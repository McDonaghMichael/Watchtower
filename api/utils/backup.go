package utils

import (
	"bytes"
	"context"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// CreateBackup runs pg_dump; tables optional. Stores file under ./backups and records metadata. Returns filename, size, and raw bytes.
func CreateBackup(pool *pgxpool.Pool, tables []string) (string, int64, []byte, error) {
	if err := os.MkdirAll("backups", 0o755); err != nil {
		return "", 0, nil, err
	}

	filename := fmt.Sprintf("backup-%d.sql", time.Now().Unix())
	if len(tables) > 0 {
		filename = fmt.Sprintf("backup-tables-%d.sql", time.Now().Unix())
	}
	fullpath := filepath.Join("backups", filename)

	args := []string{"--no-owner", "--no-privileges"}
	if host := os.Getenv("DB_HOST"); host != "" {
		args = append(args, "-h", host)
	}
	if user := os.Getenv("DB_USER"); user != "" {
		args = append(args, "-U", user)
	}
	for _, t := range tables {
		args = append(args, "--table", t)
	}
	if db := os.Getenv("DB_NAME"); db != "" {
		args = append(args, db)
	} else {
		args = append(args, "watchtower")
	}

	cmd := exec.Command("pg_dump", args...)
	if pw := os.Getenv("DB_PASSWORD"); pw != "" {
		cmd.Env = append(os.Environ(), "PGPASSWORD="+pw)
	}
	var out bytes.Buffer
	cmd.Stdout = &out
	if err := cmd.Run(); err != nil {
		return "", 0, nil, err
	}

	if err := os.WriteFile(fullpath, out.Bytes(), 0o644); err != nil {
		return "", 0, nil, err
	}

	info, _ := os.Stat(fullpath)
	size := info.Size()

	if pool != nil {
		ctx := context.Background()
		_, _ = pool.Exec(ctx, "INSERT INTO backups (filename, size_bytes, created_at) VALUES ($1,$2,NOW())", filename, size)
	}

	return filename, size, out.Bytes(), nil
}

// GetBackupConfig returns enabled + interval minutes.
func GetBackupConfig(pool *pgxpool.Pool) (enabled bool, interval int, err error) {
	if pool == nil {
		return false, 1440, fmt.Errorf("pool is nil")
	}
	err = pool.QueryRow(context.Background(), "SELECT enabled, interval_minutes FROM backup_config WHERE id=1").Scan(&enabled, &interval)
	return
}

func UpdateBackupConfig(pool *pgxpool.Pool, enabled bool, interval int) error {
	if pool == nil {
		return fmt.Errorf("pool is nil")
	}
	_, err := pool.Exec(context.Background(), "UPDATE backup_config SET enabled=$1, interval_minutes=$2, updated_at=NOW() WHERE id=1", enabled, interval)
	return err
}

// NextDue returns next run time based on last backup and interval.
func NextDue(pool *pgxpool.Pool) (time.Time, error) {
	if pool == nil {
		return time.Now(), fmt.Errorf("pool is nil")
	}
	var last time.Time
	err := pool.QueryRow(context.Background(), "SELECT COALESCE(MAX(created_at), NOW()) FROM backups").Scan(&last)
	if err != nil {
		return time.Now(), err
	}
	_, interval, err := GetBackupConfig(pool)
	if err != nil {
		return time.Now(), err
	}
	return last.Add(time.Duration(interval) * time.Minute), nil
}

// HumanSize returns KB/MB/GB formatted string.
func HumanSize(size int64) string {
	const (
		kb = 1024
		mb = kb * 1024
		gb = mb * 1024
	)
	switch {
	case size >= gb:
		return fmt.Sprintf("%.2f GB", float64(size)/float64(gb))
	case size >= mb:
		return fmt.Sprintf("%.2f MB", float64(size)/float64(mb))
	case size >= kb:
		return fmt.Sprintf("%.2f KB", float64(size)/float64(kb))
	default:
		return strconv.FormatInt(size, 10) + " B"
	}
}

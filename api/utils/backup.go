package utils

import (
	"archive/zip"
	"bytes"
	"context"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	dbHost     string
	dbPort     string
	dbUser     string
	dbPassword string
	dbName     string
)

// findPgDump returns the path to pg_dump, falling back to well-known Windows
// PostgreSQL install directories when it is not on PATH.
func findPgDump() (string, error) {
	if path, err := exec.LookPath("pg_dump"); err == nil {
		return path, nil
	}
	if runtime.GOOS != "windows" {
		return "", fmt.Errorf("pg_dump not found in PATH")
	}
	// Search C:\Program Files\PostgreSQL\<version>\bin\pg_dump.exe
	matches, _ := filepath.Glob(`C:\Program Files\PostgreSQL\*\bin\pg_dump.exe`)
	if len(matches) == 0 {
		return "", fmt.Errorf("pg_dump not found in PATH or standard PostgreSQL install directory")
	}
	// Pick the highest version number (lexicographic sort works for integer dirs)
	sort.Strings(matches)
	return matches[len(matches)-1], nil
}

// SetDBCredentials stores PostgreSQL credentials for pg_dump.
// Called by database.Connect() after resolving config.
func SetDBCredentials(host, port, user, password, name string) {
	dbHost = host
	dbPort = port
	dbUser = user
	dbPassword = password
	dbName = name
}

// CreateBackup runs pg_dump, stores the .sql file in the configured backup location,
// and records metadata in the backups table. Returns filename and size.
func CreateBackup(pool *pgxpool.Pool) (string, int64, error) {
	location := "./backups"
	if pool != nil {
		_, _, loc, err := GetBackupConfig(pool)
		if err == nil && loc != "" {
			location = loc
		}
	}

	if err := os.MkdirAll(location, 0o755); err != nil {
		return "", 0, err
	}

	filename := fmt.Sprintf("backup-%d.sql", time.Now().Unix())
	fullpath := filepath.Join(location, filename)

	args := []string{"--no-owner", "--no-privileges"}
	if dbHost != "" {
		args = append(args, "-h", dbHost)
	}
	if dbPort != "" {
		args = append(args, "-p", dbPort)
	}
	if dbUser != "" {
		args = append(args, "-U", dbUser)
	}
	if dbName != "" {
		args = append(args, dbName)
	} else {
		args = append(args, "watchtower")
	}

	pgDump, err := findPgDump()
	if err != nil {
		return "", 0, err
	}
	cmd := exec.Command(pgDump, args...)
	if dbPassword != "" {
		cmd.Env = append(os.Environ(), "PGPASSWORD="+dbPassword)
	}
	var out, stderr bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = &stderr
	if err := cmd.Run(); err != nil {
		return "", 0, fmt.Errorf("pg_dump: %w — %s", err, strings.TrimSpace(stderr.String()))
	}

	if err := os.WriteFile(fullpath, out.Bytes(), 0o644); err != nil {
		return "", 0, err
	}

	info, _ := os.Stat(fullpath)
	size := info.Size()

	if pool != nil {
		ctx := context.Background()
		_, _ = pool.Exec(ctx, "INSERT INTO backups (filename, size_bytes, created_at) VALUES ($1,$2,NOW())", filename, size)
	}

	return filename, size, nil
}

// GetBackupConfig returns enabled, interval_ms, and backup_location.
func GetBackupConfig(pool *pgxpool.Pool) (enabled bool, intervalMs int64, location string, err error) {
	if pool == nil {
		return false, 86400000, "./backups", fmt.Errorf("pool is nil")
	}
	err = pool.QueryRow(context.Background(),
		"SELECT enabled, COALESCE(interval_ms, 86400000), COALESCE(backup_location, './backups') FROM backup_config WHERE id=1",
	).Scan(&enabled, &intervalMs, &location)
	return
}

// UpdateBackupConfig saves enabled, interval_ms, and backup_location.
func UpdateBackupConfig(pool *pgxpool.Pool, enabled bool, intervalMs int64, location string) error {
	if pool == nil {
		return fmt.Errorf("pool is nil")
	}
	_, err := pool.Exec(context.Background(),
		"UPDATE backup_config SET enabled=$1, interval_ms=$2, backup_location=$3, updated_at=NOW() WHERE id=1",
		enabled, intervalMs, location,
	)
	return err
}

// NextDue returns the next scheduled backup time based on interval_ms.
func NextDue(pool *pgxpool.Pool) (time.Time, error) {
	if pool == nil {
		return time.Now(), fmt.Errorf("pool is nil")
	}
	var last time.Time
	err := pool.QueryRow(context.Background(), "SELECT COALESCE(MAX(created_at), NOW()) FROM backups").Scan(&last)
	if err != nil {
		return time.Now(), err
	}
	_, intervalMs, _, err := GetBackupConfig(pool)
	if err != nil {
		return time.Now(), err
	}
	return last.Add(time.Duration(intervalMs) * time.Millisecond), nil
}

// ZipBackup wraps a stored .sql file into a .zip archive in memory.
func ZipBackup(location, filename string) ([]byte, error) {
	sqlPath := filepath.Join(location, filename)
	sqlData, err := os.ReadFile(sqlPath)
	if err != nil {
		return nil, err
	}
	var buf bytes.Buffer
	zw := zip.NewWriter(&buf)
	f, err := zw.Create(filename)
	if err != nil {
		return nil, err
	}
	if _, err := f.Write(sqlData); err != nil {
		return nil, err
	}
	if err := zw.Close(); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
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

package routes

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"
	"watchtower/api/database"
	"watchtower/api/utils"

	"github.com/gin-gonic/gin"
)

// CreateManualBackup triggers a pg_dump and stores it; does not stream to client.
func CreateManualBackup() gin.HandlerFunc {
	return func(c *gin.Context) {
		filename, size, err := utils.CreateBackup(database.Pool)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("backup failed: %v", err)})
			return
		}
		utils.LogAudit(c, database.Pool, c.GetInt("userID"), "backup_manual", "backup", nil, map[string]interface{}{"filename": filename, "size": size})
		c.JSON(http.StatusOK, gin.H{"filename": filename, "size": size})
	}
}

// GetBackupConfigHandler returns the current backup configuration.
func GetBackupConfigHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		enabled, intervalMs, location, err := utils.GetBackupConfig(database.Pool)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load config"})
			return
		}
		c.JSON(http.StatusOK, gin.H{
			"enabled":         enabled,
			"interval_ms":     intervalMs,
			"backup_location": location,
		})
	}
}

// SetBackupSchedule updates the backup schedule config.
func SetBackupSchedule() gin.HandlerFunc {
	return func(c *gin.Context) {
		var req struct {
			Enabled        bool   `json:"enabled"`
			IntervalMs     int64  `json:"interval_ms"`
			BackupLocation string `json:"backup_location"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
			return
		}
		if req.IntervalMs <= 0 {
			req.IntervalMs = 86400000
		}
		if strings.TrimSpace(req.BackupLocation) == "" {
			req.BackupLocation = "./backups"
		}
		if err := utils.UpdateBackupConfig(database.Pool, req.Enabled, req.IntervalMs, req.BackupLocation); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update config"})
			return
		}
		utils.LogAudit(c, database.Pool, c.GetInt("userID"), "backup_schedule", "backup", nil, map[string]interface{}{"enabled": req.Enabled, "interval_ms": req.IntervalMs, "backup_location": req.BackupLocation})
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	}
}

// ListBackups returns all recorded backups ordered newest first.
func ListBackups() gin.HandlerFunc {
	return func(c *gin.Context) {
		rows, err := database.Pool.Query(c, "SELECT id, filename, size_bytes, created_at FROM backups ORDER BY created_at DESC")
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list backups"})
			return
		}
		defer rows.Close()

		type backupRow struct {
			ID        int       `json:"id"`
			Filename  string    `json:"filename"`
			SizeBytes int64     `json:"size_bytes"`
			CreatedAt time.Time `json:"created_at"`
			SizeHuman string    `json:"size_human"`
		}
		var list []backupRow
		for rows.Next() {
			var b backupRow
			if err := rows.Scan(&b.ID, &b.Filename, &b.SizeBytes, &b.CreatedAt); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to read backup"})
				return
			}
			b.SizeHuman = utils.HumanSize(b.SizeBytes)
			list = append(list, b)
		}
		if list == nil {
			list = []backupRow{}
		}
		c.JSON(http.StatusOK, list)
	}
}

// DownloadBackup streams the backup as a .zip archive.
func DownloadBackup() gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var filename string
		err := database.Pool.QueryRow(c, "SELECT filename FROM backups WHERE id=$1", id).Scan(&filename)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
			return
		}

		_, _, location, _ := utils.GetBackupConfig(database.Pool)
		if location == "" {
			location = "./backups"
		}

		zipData, err := utils.ZipBackup(location, filename)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create zip"})
			return
		}

		zipName := strings.TrimSuffix(filename, ".sql") + ".zip"
		c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=%s", zipName))
		c.Data(http.StatusOK, "application/zip", zipData)
	}
}

// DeleteBackup removes the backup file and its database record.
func DeleteBackup() gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var filename string
		err := database.Pool.QueryRow(c, "SELECT filename FROM backups WHERE id=$1", id).Scan(&filename)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
			return
		}

		_, _, location, _ := utils.GetBackupConfig(database.Pool)
		if location == "" {
			location = "./backups"
		}

		_ = os.Remove(filepath.Join(location, filename))

		if _, err := database.Pool.Exec(c, "DELETE FROM backups WHERE id=$1", id); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete backup"})
			return
		}

		utils.LogAudit(c, database.Pool, c.GetInt("userID"), "backup_delete", "backup", nil, map[string]interface{}{"id": id, "filename": filename})
		c.JSON(http.StatusOK, gin.H{"status": "deleted"})
	}
}

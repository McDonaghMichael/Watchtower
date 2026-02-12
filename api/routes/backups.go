package routes

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"time"
	"watchtower/api/database"
	"watchtower/api/utils"

	"github.com/gin-gonic/gin"
)

// Full backup: pg_dump all; store file; return download
func BackupDatabase() gin.HandlerFunc {
	return func(c *gin.Context) {
		filename, size, data, err := utils.CreateBackup(database.Pool, nil)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("backup failed: %v", err)})
			return
		}
		c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=%s", filename))
		c.Data(http.StatusOK, "application/sql", data)
		utils.LogAudit(c, database.Pool, c.GetInt("userID"), "backup_full", "backup", nil, map[string]interface{}{"size": size})
	}
}

// Export selected tables into one SQL and return as download (also stored)
func BackupTables() gin.HandlerFunc {
	return func(c *gin.Context) {
		var req struct {
			Tables []string `json:"tables"`
		}
		if err := c.ShouldBindJSON(&req); err != nil || len(req.Tables) == 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "tables required"})
			return
		}

		filename, size, data, err := utils.CreateBackup(database.Pool, req.Tables)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("table export failed: %v", err)})
			return
		}

		c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=%s", filename))
		c.Data(http.StatusOK, "application/sql", data)
		utils.LogAudit(c, database.Pool, c.GetInt("userID"), "backup_tables", "backup", nil, map[string]interface{}{"tables": req.Tables, "size": size})
	}
}

func SetBackupSchedule() gin.HandlerFunc {
	return func(c *gin.Context) {
		var req struct {
			Enabled         bool `json:"enabled"`
			IntervalMinutes int  `json:"interval_minutes"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
			return
		}
		if req.IntervalMinutes <= 0 {
			req.IntervalMinutes = 1440
		}
		if err := utils.UpdateBackupConfig(database.Pool, req.Enabled, req.IntervalMinutes); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update config"})
			return
		}
		utils.LogAudit(c, database.Pool, c.GetInt("userID"), "backup_schedule", "backup", nil, map[string]interface{}{"enabled": req.Enabled, "interval_minutes": req.IntervalMinutes})
		c.JSON(http.StatusOK, gin.H{"status": "scheduled"})
	}
}

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
		c.JSON(http.StatusOK, list)
	}
}

func DownloadBackup() gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var filename string
		err := database.Pool.QueryRow(c, "SELECT filename FROM backups WHERE id=$1", id).Scan(&filename)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
			return
		}
		path := filepath.Join("backups", filename)
		data, err := os.ReadFile(path)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "file missing"})
			return
		}
		c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=%s", filename))
		c.Data(http.StatusOK, "application/octet-stream", data)
	}
}

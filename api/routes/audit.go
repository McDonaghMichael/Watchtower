package routes

import (
	"net/http"
	"strconv"
	"time"
	"watchtower/api/database"
	"watchtower/api/utils"

	"github.com/gin-gonic/gin"
)

func ListAuditLogs() gin.HandlerFunc {
	return func(c *gin.Context) {
		q := utils.ParseAuditQuery(c)

		query := `
			SELECT id, user_id, action, resource, resource_id, metadata, ip_address, user_agent, created_at
			FROM audit_logs
			WHERE 1=1`
		args := []interface{}{}
		arg := 1

		if q.Action != "" {
			query += " AND action = $" + strconv.Itoa(arg)
			args = append(args, q.Action)
			arg++
		}
		if q.UserID != 0 {
			query += " AND user_id = $" + strconv.Itoa(arg)
			args = append(args, q.UserID)
			arg++
		}
		if q.Resource != "" {
			query += " AND resource = $" + strconv.Itoa(arg)
			args = append(args, q.Resource)
			arg++
		}
		if q.ResourceID != 0 {
			query += " AND resource_id = $" + strconv.Itoa(arg)
			args = append(args, q.ResourceID)
			arg++
		}
		if q.Since != "" {
			if t, err := time.Parse(time.RFC3339, q.Since); err == nil {
				query += " AND created_at >= $" + strconv.Itoa(arg)
				args = append(args, t)
				arg++
			}
		}
		if q.Until != "" {
			if t, err := time.Parse(time.RFC3339, q.Until); err == nil {
				query += " AND created_at <= $" + strconv.Itoa(arg)
				args = append(args, t)
				arg++
			}
		}

		query += " ORDER BY created_at DESC LIMIT $" + strconv.Itoa(arg)
		args = append(args, q.Limit)

		rows, err := database.Pool.Query(c, query, args...)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to query audit logs"})
			return
		}
		defer rows.Close()

		type auditRow struct {
			ID         int         `json:"id"`
			UserID     *int        `json:"user_id"`
			Action     string      `json:"action"`
			Resource   string      `json:"resource"`
			ResourceID *int        `json:"resource_id"`
			Metadata   interface{} `json:"metadata"`
			IPAddress  string      `json:"ip_address"`
			UserAgent  string      `json:"user_agent"`
			CreatedAt  time.Time   `json:"created_at"`
		}

		var logs []auditRow
		for rows.Next() {
			var r auditRow
			if err := rows.Scan(&r.ID, &r.UserID, &r.Action, &r.Resource, &r.ResourceID, &r.Metadata, &r.IPAddress, &r.UserAgent, &r.CreatedAt); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to read audit log"})
				return
			}
			logs = append(logs, r)
		}
		c.JSON(http.StatusOK, logs)
	}
}

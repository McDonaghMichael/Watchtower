package routes

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"
	"watchtower/api/database"
	"watchtower/api/utils"

	"github.com/gin-gonic/gin"
)

func ListSessions() gin.HandlerFunc {
	return func(c *gin.Context) {
		requesterRole := c.GetString("userRole")
		requesterID := c.GetInt("userID")
		requesterSessionID := c.GetInt("sessionID")

		query := `
			SELECT s.id, s.user_id,
				COALESCE(u.email, ''), COALESCE(u.username, ''),
				COALESCE(s.ip_address, ''), COALESCE(s.user_agent, ''),
				s.active, s.created_at, s.last_seen,
				COALESCE(
					(SELECT json_agg(a)
					 FROM (
						SELECT action, COALESCE(resource, '') AS resource, created_at
						FROM audit_logs
						WHERE user_id = s.user_id
						ORDER BY created_at DESC
						LIMIT 5
					 ) a
					),
					'[]'::json
				) AS recent_activity
			FROM sessions s
			LEFT JOIN users u ON s.user_id = u.id
			WHERE 1=1`
		args := []interface{}{}
		if requesterRole != "admin" {
			query += " AND s.user_id = $1"
			args = append(args, requesterID)
		}
		query += " ORDER BY s.last_seen DESC"

		rows, err := database.Pool.Query(c, query, args...)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to query sessions"})
			return
		}
		defer rows.Close()

		type sessionRow struct {
			ID             int             `json:"id"`
			UserID         int             `json:"user_id"`
			Email          string          `json:"email"`
			Username       string          `json:"username"`
			IP             string          `json:"ip_address"`
			UserAgent      string          `json:"user_agent"`
			Active         bool            `json:"active"`
			CreatedAt      time.Time       `json:"created_at"`
			LastSeen       time.Time       `json:"last_seen"`
			IsCurrent      bool            `json:"is_current"`
			RecentActivity json.RawMessage `json:"recent_activity"`
		}

		var list []sessionRow
		for rows.Next() {
			var s sessionRow
			var rawActivity []byte
			if err := rows.Scan(
				&s.ID, &s.UserID, &s.Email, &s.Username,
				&s.IP, &s.UserAgent, &s.Active, &s.CreatedAt, &s.LastSeen,
				&rawActivity,
			); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to read session"})
				return
			}
			s.IsCurrent = s.ID == requesterSessionID
			if len(rawActivity) > 0 {
				s.RecentActivity = json.RawMessage(rawActivity)
			} else {
				s.RecentActivity = json.RawMessage("[]")
			}
			list = append(list, s)
		}
		if list == nil {
			list = []sessionRow{}
		}
		c.JSON(http.StatusOK, list)
	}
}

func RevokeSession() gin.HandlerFunc {
	return func(c *gin.Context) {
		id, _ := strconv.Atoi(c.Param("id"))
		requesterRole := c.GetString("userRole")
		requesterID := c.GetInt("userID")
		requesterSessionID := c.GetInt("sessionID")

		if id == requesterSessionID {
			c.JSON(http.StatusBadRequest, gin.H{"error": "cannot revoke your own session"})
			return
		}

		if requesterRole != "admin" {
			var owner int
			err := database.Pool.QueryRow(c, "SELECT user_id FROM sessions WHERE id=$1", id).Scan(&owner)
			if err != nil || owner != requesterID {
				c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
				return
			}
		}

		_, err := database.Pool.Exec(c, "UPDATE sessions SET active=FALSE WHERE id=$1", id)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to revoke session"})
			return
		}
		utils.LogAudit(c, database.Pool, requesterID, "revoke_session", "session", &id, nil)
		c.Status(http.StatusNoContent)
	}
}

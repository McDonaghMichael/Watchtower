package routes

import (
	"net/http"
	"strconv"
	"watchtower/api/database"
	"watchtower/api/utils"

	"github.com/gin-gonic/gin"
)

func ListSessions() gin.HandlerFunc {
	return func(c *gin.Context) {
		requesterRole := c.GetString("userRole")
		requesterID := c.GetInt("userID")

		query := `
			SELECT s.id, s.user_id, u.email, u.username, s.ip_address, s.user_agent, s.active, s.created_at, s.last_seen
			FROM sessions s
			LEFT JOIN users u ON s.user_id = u.id
			WHERE 1=1`
		args := []interface{}{}
		if requesterRole != "admin" {
			query += " AND s.user_id = $1"
			args = append(args, requesterID)
		}
		rows, err := database.Pool.Query(c, query, args...)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to query sessions"})
			return
		}
		defer rows.Close()

		type sessionRow struct {
			ID        int    `json:"id"`
			UserID    int    `json:"user_id"`
			Email     string `json:"email"`
			Username  string `json:"username"`
			IP        string `json:"ip_address"`
			UserAgent string `json:"user_agent"`
			Active    bool   `json:"active"`
			CreatedAt string `json:"created_at"`
			LastSeen  string `json:"last_seen"`
		}
		var list []sessionRow
		for rows.Next() {
			var s sessionRow
			if err := rows.Scan(&s.ID, &s.UserID, &s.Email, &s.Username, &s.IP, &s.UserAgent, &s.Active, &s.CreatedAt, &s.LastSeen); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to read session"})
				return
			}
			list = append(list, s)
		}
		c.JSON(http.StatusOK, list)
	}
}

func RevokeSession() gin.HandlerFunc {
	return func(c *gin.Context) {
		id, _ := strconv.Atoi(c.Param("id"))
		requesterRole := c.GetString("userRole")
		requesterID := c.GetInt("userID")

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

package routes

import (
	"net/http"
	"strconv"
	"strings"
	"time"
	"watchtower/api/database"
	"watchtower/api/utils"

	"github.com/gin-gonic/gin"
)

type ticket struct {
	ID        int             `json:"id"`
	UserID    *int            `json:"user_id"`
	Title     string          `json:"title"`
	Body      string          `json:"body"`
	Status    string          `json:"status"`
	CreatedAt time.Time       `json:"created_at"`
	UpdatedAt time.Time       `json:"updated_at"`
	Messages  []ticketMessage `json:"messages,omitempty"`
}

type ticketMessage struct {
	ID        int       `json:"id"`
	TicketID  int       `json:"ticket_id"`
	UserID    *int      `json:"user_id"`
	Message   string    `json:"message"`
	CreatedAt time.Time `json:"created_at"`
}

func CreateTicket() gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetInt("userID")
		var req struct {
			Title string `json:"title" binding:"required"`
			Body  string `json:"body" binding:"required"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "title and body required"})
			return
		}
		var id int
		err := database.Pool.QueryRow(c, `
			INSERT INTO tickets (user_id, title, body)
			VALUES ($1,$2,$3) RETURNING id`, userID, req.Title, req.Body).Scan(&id)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create ticket"})
			return
		}
		utils.LogAudit(c, database.Pool, userID, "ticket_create", "ticket", &id, nil)
		c.JSON(http.StatusCreated, gin.H{"id": id})
	}
}

func ListTickets() gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetInt("userID")
		perms := c.GetStringSlice("permissions")
		isSupport := contains(perms, "support_manage")

		statusFilter := strings.TrimSpace(c.Query("status"))

		query := `
			SELECT id, user_id, title, body, status, created_at, updated_at
			FROM tickets
			WHERE 1=1`
		args := []interface{}{}
		arg := 1
		if !isSupport {
			query += " AND user_id = $" + strconv.Itoa(arg)
			args = append(args, userID)
			arg++
		}
		if statusFilter != "" {
			query += " AND status = $" + strconv.Itoa(arg)
			args = append(args, statusFilter)
			arg++
		}
		query += " ORDER BY updated_at DESC"

		rows, err := database.Pool.Query(c, query, args...)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to query tickets"})
			return
		}
		defer rows.Close()

		var list []ticket
		for rows.Next() {
			var t ticket
			if err := rows.Scan(&t.ID, &t.UserID, &t.Title, &t.Body, &t.Status, &t.CreatedAt, &t.UpdatedAt); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to read ticket"})
				return
			}
			list = append(list, t)
		}
		c.JSON(http.StatusOK, list)
	}
}

func GetTicket() gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetInt("userID")
		perms := c.GetStringSlice("permissions")
		isSupport := contains(perms, "support_manage")
		id, _ := strconv.Atoi(c.Param("id"))

		var t ticket
		err := database.Pool.QueryRow(c, `
			SELECT id, user_id, title, body, status, created_at, updated_at
			FROM tickets WHERE id=$1`, id).
			Scan(&t.ID, &t.UserID, &t.Title, &t.Body, &t.Status, &t.CreatedAt, &t.UpdatedAt)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "ticket not found"})
			return
		}
		if !isSupport && (t.UserID == nil || *t.UserID != userID) {
			c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
			return
		}

		msgRows, err := database.Pool.Query(c, `
			SELECT id, ticket_id, user_id, message, created_at
			FROM ticket_messages WHERE ticket_id=$1 ORDER BY created_at ASC`, id)
		if err == nil {
			defer msgRows.Close()
			for msgRows.Next() {
				var m ticketMessage
				msgRows.Scan(&m.ID, &m.TicketID, &m.UserID, &m.Message, &m.CreatedAt)
				t.Messages = append(t.Messages, m)
			}
		}
		c.JSON(http.StatusOK, t)
	}
}

func ReplyTicket() gin.HandlerFunc {
	return func(c *gin.Context) {
		id, _ := strconv.Atoi(c.Param("id"))
		userID := c.GetInt("userID")
		perms := c.GetStringSlice("permissions")
		isSupport := contains(perms, "support_manage")
		if !isSupport {
			c.JSON(http.StatusForbidden, gin.H{"error": "support only"})
			return
		}
		var req struct {
			Message string `json:"message" binding:"required"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "message required"})
			return
		}
		var exists bool
		if err := database.Pool.QueryRow(c, "SELECT EXISTS(SELECT 1 FROM tickets WHERE id=$1)", id).Scan(&exists); err != nil || !exists {
			c.JSON(http.StatusNotFound, gin.H{"error": "ticket not found"})
			return
		}
		_, err := database.Pool.Exec(c, `
			INSERT INTO ticket_messages (ticket_id, user_id, message) VALUES ($1,$2,$3)`,
			id, userID, req.Message)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to add message"})
			return
		}
		database.Pool.Exec(c, "UPDATE tickets SET updated_at=NOW() WHERE id=$1", id)
		utils.LogAudit(c, database.Pool, userID, "ticket_reply", "ticket", &id, nil)
		c.Status(http.StatusCreated)
	}
}

func UpdateTicketStatus() gin.HandlerFunc {
	return func(c *gin.Context) {
		id, _ := strconv.Atoi(c.Param("id"))
		perms := c.GetStringSlice("permissions")
		isSupport := contains(perms, "support_manage")
		if !isSupport {
			c.JSON(http.StatusForbidden, gin.H{"error": "support only"})
			return
		}
		var req struct {
			Status string `json:"status" binding:"required"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "status required"})
			return
		}
		if req.Status == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "status required"})
			return
		}
		_, err := database.Pool.Exec(c, "UPDATE tickets SET status=$1, updated_at=NOW() WHERE id=$2", req.Status, id)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update status"})
			return
		}
		utils.LogAudit(c, database.Pool, c.GetInt("userID"), "ticket_status", "ticket", &id, map[string]interface{}{"status": req.Status})
		c.Status(http.StatusOK)
	}
}

func contains(arr []string, v string) bool {
	for _, a := range arr {
		if a == v {
			return true
		}
	}
	return false
}

package routes

import (
	"context"
	"net/http"
	"sync"
	"time"
	"watchtower/api/database"
	"watchtower/api/utils"

	"github.com/gin-gonic/gin"
)

type Health struct {
	ID        int       `json:"id"`
	ServerID  int       `json:"server_id"`
	Status    int       `json:"status"`
	Timestamp time.Time `json:"timestamp"`
}

func addHealthStatus() gin.HandlerFunc {
	return func(c *gin.Context) {

		var health Health

		if err := c.ShouldBindJSON(&health); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		health.Timestamp = time.Now()

		err := database.Pool.QueryRow(
			context.Background(),
			`INSERT INTO health_status (
                server_id,
                status,
                timestamp
            ) VALUES ($1, $2, $3) RETURNING id`,
			health.ServerID,
			health.Status,
			health.Timestamp,
		).Scan(&health.ID)

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusCreated, health)
	}
}

func GetHealthStatusByServerID() gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		limit := c.Query("limit")

		var healthList []Health

		rows, err := database.Pool.Query(context.Background(),
			`SELECT 
                id,
                server_id,
                status,
                timestamp
             FROM health_status
             WHERE server_id = $1
             ORDER BY timestamp DESC
             LIMIT $2`,
			id, limit,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		defer rows.Close()

		for rows.Next() {
			var h Health
			if err := rows.Scan(
				&h.ID,
				&h.ServerID,
				&h.Status,
				&h.Timestamp,
			); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}

			healthList = append(healthList, h)
		}

		if len(healthList) == 0 {
			c.JSON(http.StatusNotFound, gin.H{})
			return
		}

		c.JSON(http.StatusOK, healthList)
	}
}

func InsertHealthStatus(serverID int, status int) error {
	_, err := database.Pool.Exec(
		context.Background(),
		`INSERT INTO health_status (server_id, status) VALUES ($1, $2)`,
		serverID, status,
	)
	return err
}

func CheckAllServersHealth() error {
	servers, err := GetAllServers()
	if err != nil {
		return err
	}

	var wg sync.WaitGroup

	for _, s := range servers {
		wg.Add(1)

		go func(server Server) {
			defer wg.Done()

			// Ping server
			_, err := utils.Ping(server.IPAddress)

			var statusInt int

			if err != nil {
				statusInt = 0
			} else {
				statusInt = 1
			}

			// Insert health history
			_ = InsertHealthStatus(server.ID, statusInt)

		}(s)
	}

	wg.Wait()
	return nil
}

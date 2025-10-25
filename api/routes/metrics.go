package routes

import (
	"context"
	"net/http"
	"watchtower/api/database"

	"github.com/gin-gonic/gin"
)

type Metrics struct {
	ID                int    `json:"id"`
	IPAddress         string `json:"ip_address"`
	NumOfCPU          int    `json:"num_of_cpu"`
	MemoryAllocated   int    `json:"memory_allocated"`
	MemoryAllocations int    `json:"memory_allocations"`
}

func AddMetric() gin.HandlerFunc {
	return func(c *gin.Context) {
		var metric Metrics

		if err := c.ShouldBindJSON(&metric); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		err := database.Pool.QueryRow(context.Background(),
			`INSERT INTO metrics (ip_address, num_of_cpu, memory_allocated, memory_allocations) 
             VALUES ($1, $2, $3, $4) RETURNING id`,
			metric.IPAddress, metric.NumOfCPU, metric.MemoryAllocated, metric.MemoryAllocations).Scan(&metric.ID)

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusCreated, metric)
	}
}

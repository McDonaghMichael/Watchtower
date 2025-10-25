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
	DiskUsageTotal    uint64 `json:"disk_usage_total"`
	DiskUsageUsed     uint64 `json:"disk_usage_used"`
	DiskUsageFree     uint64 `json:"disk_usage_free"`
}

func AddMetric() gin.HandlerFunc {
	return func(c *gin.Context) {
		var metric Metrics

		if err := c.ShouldBindJSON(&metric); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		err := database.Pool.QueryRow(context.Background(),
			`INSERT INTO metrics (ip_address, num_of_cpu, memory_allocated, memory_allocations, disk_usage_total, disk_usage_free, disk_usage_used) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
			metric.IPAddress, metric.NumOfCPU, metric.MemoryAllocated, metric.MemoryAllocations, metric.DiskUsageTotal, metric.DiskUsageUsed, metric.DiskUsageFree).Scan(&metric.ID)

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusCreated, metric)
	}
}

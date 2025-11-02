package routes

import (
	"context"
	"net/http"
	"time"
	"watchtower/api/database"

	"github.com/gin-gonic/gin"
)

type Metrics struct {
	ID                int       `json:"id"`
	ServerID          int       `json:"server_id"`
	IPAddress         string    `json:"ip_address"`
	NumOfCPU          int       `json:"num_of_cpu"`
	MemoryAllocated   int       `json:"memory_allocated"`
	MemoryAllocations int       `json:"memory_allocations"`
	DiskUsageTotal    uint64    `json:"disk_usage_total"`
	DiskUsageUsed     uint64    `json:"disk_usage_used"`
	DiskUsageFree     uint64    `json:"disk_usage_free"`
	SSHConnections    int       `json:"ssh_connections"`
	HTTPConnections   int       `json:"http_connections"`
	HTTPSConnections  int       `json:"https_connections"`
	Timestamp         time.Time `json:"timestamp"`
}

func AddMetric() gin.HandlerFunc {
	return func(c *gin.Context) {
		var metric Metrics

		if err := c.ShouldBindJSON(&metric); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		err := database.Pool.QueryRow(context.Background(),
			`INSERT INTO metrics (server_id, num_of_cpu, memory_allocated, memory_allocations,
                                  disk_usage_total, disk_usage_used, disk_usage_free,
                                  ssh_connections, http_connections, https_connections)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
			metric.ServerID,
			metric.NumOfCPU,
			metric.MemoryAllocated,
			metric.MemoryAllocations,
			metric.DiskUsageTotal,
			metric.DiskUsageUsed,
			metric.DiskUsageFree,
			metric.SSHConnections,
			metric.HTTPConnections,
			metric.HTTPSConnections,
		).Scan(&metric.ID)

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusCreated, metric)
	}
}

func GetMetricsByServerID() gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var metricsList []Metrics

		rows, err := database.Pool.Query(context.Background(),
			`SELECT id, server_id, num_of_cpu, memory_allocated, memory_allocations,
			        disk_usage_total, disk_usage_used, disk_usage_free,
			        ssh_connections, http_connections, https_connections, timestamp
			   FROM metrics
			   WHERE server_id = $1
			   ORDER BY timestamp DESC`, id)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		defer rows.Close()

		for rows.Next() {
			var m Metrics
			if err := rows.Scan(
				&m.ID, &m.ServerID, &m.NumOfCPU, &m.MemoryAllocated, &m.MemoryAllocations,
				&m.DiskUsageTotal, &m.DiskUsageUsed, &m.DiskUsageFree,
				&m.SSHConnections, &m.HTTPConnections, &m.HTTPSConnections, &m.Timestamp,
			); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			metricsList = append(metricsList, m)
		}

		if len(metricsList) == 0 {
			c.JSON(http.StatusNotFound, gin.H{})
			return
		}

		c.JSON(http.StatusOK, metricsList)
	}
}

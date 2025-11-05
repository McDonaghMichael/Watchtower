package routes

import (
	"context"
	"net/http"
	"time"
	"watchtower/api/database"

	"github.com/gin-gonic/gin"
)

type Metrics struct {
	ID                 int       `json:"id"`
	ServerID           int       `json:"server_id"`
	NumOfCPU           int       `json:"num_of_cpu"`
	CPUUsage           float64   `json:"cpu_usage"`
	MemoryAllocated    int       `json:"memory_allocated"`
	MemoryAllocations  int       `json:"memory_allocations"`
	MemoryUsagePercent float64   `json:"memory_usage_percent"`
	SwapUsed           int64     `json:"swap_used"`
	SwapTotal          int64     `json:"swap_total"`
	SwapFree           int64     `json:"swap_free"`
	CacheMemory        int64     `json:"cache_memory"`
	BufferMemory       int64     `json:"buffer_memory"`
	DiskUsageTotal     uint64    `json:"disk_usage_total"`
	DiskUsageUsed      uint64    `json:"disk_usage_used"`
	DiskUsageFree      uint64    `json:"disk_usage_free"`
	SSHConnections     int       `json:"ssh_connections"`
	HTTPConnections    int       `json:"http_connections"`
	HTTPSConnections   int       `json:"https_connections"`
	UptimeSeconds      int64     `json:"uptime_seconds"`
	Timestamp          time.Time `json:"timestamp"`
}

func AddMetric() gin.HandlerFunc {
	return func(c *gin.Context) {
		var metric Metrics

		if err := c.ShouldBindJSON(&metric); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		err := database.Pool.QueryRow(context.Background(),
			`INSERT INTO metrics (
			server_id,
			num_of_cpu,
			cpu_usage,
			memory_allocated,
			memory_allocations,
			memory_usage_percent,
			swap_used,
			swap_total,
			swap_free,
			cache_memory,
			buffer_memory,
            disk_usage_total,
			disk_usage_used,
			disk_usage_free,
            ssh_connections,
			http_connections,
			https_connections,
			uptime_seconds
			)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) RETURNING id`,
			metric.ServerID,
			metric.NumOfCPU,
			metric.CPUUsage,
			metric.MemoryAllocated,
			metric.MemoryAllocations,
			metric.MemoryUsagePercent,
			metric.SwapUsed,
			metric.SwapTotal,
			metric.SwapFree,
			metric.CacheMemory,
			metric.BufferMemory,
			metric.DiskUsageTotal,
			metric.DiskUsageUsed,
			metric.DiskUsageFree,
			metric.SSHConnections,
			metric.HTTPConnections,
			metric.HTTPSConnections,
			metric.UptimeSeconds,
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
		limit := c.Query("limit")

		var metricsList []Metrics

		rows, err := database.Pool.Query(context.Background(),
			`SELECT id, server_id, num_of_cpu, memory_allocated, memory_allocations,
			        disk_usage_total, disk_usage_used, disk_usage_free,
			        ssh_connections, http_connections, https_connections, timestamp
			   FROM metrics
			   WHERE server_id = $1
			   ORDER BY timestamp DESC LIMIT $2`, id, limit)
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

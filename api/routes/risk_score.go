package routes

import (
	"context"
	"net/http"
	"watchtower/api/database"
	machinelearning "watchtower/api/machine-learning"
	"watchtower/api/models"

	"github.com/gin-gonic/gin"
)

func GetRiskScoreByServerId() gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")

		rows, err := database.Pool.Query(context.Background(),
			`SELECT 
			id, server_id, num_of_cpu, cpu_usage,
			memory_allocated, memory_allocations, memory_usage_percent,
			swap_used, swap_total, swap_free, cache_memory, buffer_memory,
			disk_usage_total, disk_usage_used, disk_usage_free,
			ssh_connections, http_connections, https_connections,
			uptime_seconds, timestamp
			FROM metrics
			WHERE server_id = $1
			ORDER BY timestamp DESC LIMIT 1`, id)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		defer rows.Close()

		var m models.Metrics
		for rows.Next() {

			if err := rows.Scan(
				&m.ID, &m.ServerID, &m.NumOfCPU, &m.CPUUsage,
				&m.MemoryAllocated, &m.MemoryAllocations, &m.MemoryUsagePercent,
				&m.SwapUsed, &m.SwapTotal, &m.SwapFree, &m.CacheMemory, &m.BufferMemory,
				&m.DiskUsageTotal, &m.DiskUsageUsed, &m.DiskUsageFree,
				&m.SSHConnections, &m.HTTPConnections, &m.HTTPSConnections,
				&m.UptimeSeconds, &m.Timestamp,
			); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			m.Connections = m.HTTPConnections + m.SSHConnections + m.HTTPSConnections
		}

		// Keep ONNX call for future use
		_ = machinelearning.RunMachineLearning([]float32{
			float32(m.NumOfCPU),            // num_of_cpu
			float32(m.CPUUsage),            // cpu_usage
			float32(m.MemoryAllocated),     // memory_allocated
			float32(m.MemoryAllocations),   // memory_allocations
			float32(m.MemoryUsagePercent),  // memory_usage_percent
			float32(m.DiskUsageTotal),      // disk_usage_total
			float32(m.DiskUsageUsed),       // disk_usage_used
			float32(m.DiskUsageFree),       // disk_usage_free
			float32(m.SwapTotal),           // swap_total
			float32(m.SwapFree),            // swap_free
			float32(m.SwapUsed),            // swap_used
			float32(m.CacheMemory),         // cache_memory
			float32(m.BufferMemory),        // buffer_memory
			float32(m.SSHConnections),      // ssh_connections
			float32(m.HTTPConnections),     // http_connections
			float32(m.HTTPSConnections),    // https_connections
		})

		// Inline risk score (0-100) weighted by key metrics
		var score float64

		// CPU usage: up to 35 points
		score += m.CPUUsage / 100.0 * 35.0

		// Memory usage: up to 35 points
		score += m.MemoryUsagePercent / 100.0 * 35.0

		// Disk usage: up to 20 points
		if m.DiskUsageTotal > 0 {
			diskPercent := float64(m.DiskUsageUsed) / float64(m.DiskUsageTotal)
			score += diskPercent * 20.0
		}

		// Swap usage: up to 7 points
		if m.SwapTotal > 0 {
			swapPercent := float64(m.SwapUsed) / float64(m.SwapTotal)
			score += swapPercent * 7.0
		}

		// SSH connections: up to 3 points (elevated connections = higher risk)
		if m.SSHConnections > 10 {
			score += 3.0
		} else if m.SSHConnections > 5 {
			score += 1.5
		} else if m.SSHConnections > 2 {
			score += 0.5
		}

		if score > 100 {
			score = 100
		}

		c.JSON(http.StatusOK, gin.H{"score": score})
	}
}

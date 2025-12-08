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

		var res float64 = machinelearning.RunMachineLearning([]float32{
			float32(m.NumOfCPU),                                 // num_of_cpu
			float32(m.CPUUsage),                                 // cpu_usage (25% utilization)
			float32(m.MemoryAllocated),                          // memory_allocated (8 GB)
			float32(m.MemoryAllocations),                        // memory_allocations
			float32((m.DiskUsageTotal / m.DiskUsageUsed) * 100), // memory_usage_percent
			float32(m.DiskUsageTotal),                           // disk_usage_total (250 GB)
			float32(m.DiskUsageUsed),                            // disk_usage_used (50 GB - 20% full)
			float32(m.DiskUsageFree),                            // disk_usage_free (200 GB)
			float32(m.SwapTotal),                                // swap_total (4 GB)
			float32(m.SwapFree),                                 // swap_free (4 GB - no swap used)
			float32(m.SwapFree),                                 // swap_used
			float32(m.CacheMemory),                              // cache_memory
			float32(m.BufferMemory),                             // buffer_memory
			float32(m.SSHConnections),                           // ssh_connections
			float32(m.HTTPConnections),                          // http_connections
			float32(m.HTTPSConnections),                         // https_connections
		})

		c.JSON(http.StatusOK, gin.H{"score": res})
	}
}

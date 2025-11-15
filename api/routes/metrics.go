package routes

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"watchtower/api/database"
	"watchtower/api/models"
	"watchtower/api/redis"

	"github.com/gin-gonic/gin"
)

func AddMetric() gin.HandlerFunc {
	return func(c *gin.Context) {
		var metric models.Metrics

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

		redis.StoreMetrics(metric.ServerID, metric)

		c.JSON(http.StatusCreated, metric)
	}
}

func GetMetricsByServerID() gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		limitStr := c.Query("limit")
		limit := 50 // default limit
		if limitStr != "" {
			if l, err := strconv.Atoi(limitStr); err == nil {
				limit = l
			}
		}

		var ctx = context.Background()
		var metricsList []models.Metrics

		key := fmt.Sprintf("server:%s:metrics", id)
		vals, err := redis.Rdb.LRange(ctx, key, 0, int64(limit-1)).Result()
		if err == nil && len(vals) > 0 {
			for _, v := range vals {
				var m models.Metrics
				if err := json.Unmarshal([]byte(v), &m); err != nil {
					fmt.Println("JSON unmarshal error:", err)
					continue
				}
				m.Connections = m.HTTPConnections + m.SSHConnections + m.HTTPSConnections
				metricsList = append(metricsList, m)
			}

			fmt.Print("YES!!")
			c.JSON(http.StatusOK, metricsList)
			return
		}

		// 2️⃣ Fallback to PostgreSQL if Redis is empty or error
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
			ORDER BY timestamp DESC LIMIT $2`, id, limit)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		defer rows.Close()

		for rows.Next() {
			var m models.Metrics
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
			metricsList = append(metricsList, m)
		}

		if len(metricsList) == 0 {
			c.JSON(http.StatusNotFound, gin.H{})
			return
		}

		c.JSON(http.StatusOK, metricsList)
	}
}

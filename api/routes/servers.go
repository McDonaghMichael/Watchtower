package routes

import (
	"context"
	"net/http"
	"time"
	"watchtower/api/database"

	"github.com/gin-gonic/gin"
)

type Server struct {
	ID                 int        `json:"id"`
	ServerName         string     `json:"server_name"`
	IPAddress          string     `json:"ip_address"`
	SSHUsername        string     `json:"ssh_username"`
	SSHPassword        string     `json:"ssh_password"`
	SSHPort            int        `json:"ssh_port"`
	OperatingSystem    string     `json:"operating_system"`
	Environment        string     `json:"environment"`
	Location           string     `json:"location"`
	Description        string     `json:"description"`
	MonitoringInterval int        `json:"monitoring_interval"`
	CPUThreshold       int        `json:"cpu_threshold"`
	MemoryThreshold    int        `json:"memory_threshold"`
	DiskThreshold      int        `json:"disk_threshold"`
	Status             string     `json:"status"`
	LastPing           *time.Time `json:"last_ping"`
	CreatedAt          time.Time  `json:"created_at"`
	UpdatedAt          time.Time  `json:"updated_at"`
}

func AddServer() gin.HandlerFunc {
	return func(c *gin.Context) {
		var server Server

		if err := c.ShouldBindJSON(&server); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Use QueryRow with RETURNING to get the created server data
		err := database.Pool.QueryRow(context.Background(),
			`INSERT INTO servers (
				server_name, ip_address, ssh_username, ssh_password, ssh_port, 
				operating_system, environment, location, description, 
				monitoring_interval, cpu_threshold, memory_threshold, disk_threshold
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
			RETURNING id, status, created_at, updated_at`,
			server.ServerName, server.IPAddress, server.SSHUsername, server.SSHPassword,
			server.SSHPort, server.OperatingSystem, server.Environment, server.Location,
			server.Description, server.MonitoringInterval, server.CPUThreshold,
			server.MemoryThreshold, server.DiskThreshold,
		).Scan(&server.ID, &server.Status, &server.CreatedAt, &server.UpdatedAt)

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusCreated, server)
	}
}

func GetServers() gin.HandlerFunc {
	return func(c *gin.Context) {
		rows, err := database.Pool.Query(context.Background(),
			`SELECT 
				id, server_name, ip_address, ssh_username, ssh_port, 
				operating_system, environment, location, description, 
				monitoring_interval, cpu_threshold, memory_threshold, disk_threshold, 
				status, last_ping, created_at, updated_at 
			FROM servers`)

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		defer rows.Close()

		var servers []Server
		for rows.Next() {
			var server Server
			err := rows.Scan(
				&server.ID, &server.ServerName, &server.IPAddress, &server.SSHUsername,
				&server.SSHPort, &server.OperatingSystem, &server.Environment,
				&server.Location, &server.Description, &server.MonitoringInterval,
				&server.CPUThreshold, &server.MemoryThreshold, &server.DiskThreshold,
				&server.Status, &server.LastPing, &server.CreatedAt, &server.UpdatedAt,
			)

			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			servers = append(servers, server)
		}

		if err = rows.Err(); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, servers)
	}
}

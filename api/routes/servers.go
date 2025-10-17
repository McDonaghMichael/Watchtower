package routes

import (
	"context"
	"fmt"
	"net/http"
	"strings"
	"sync"
	"time"
	"watchtower/api/database"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/ssh"
)

type Server struct {
	ID                 int        `json:"id"`
	ServerName         string     `json:"server_name"`
	IPAddress          string     `json:"ip_address"`
	SSHUsername        string     `json:"ssh_username"`
	SSHPrivateKey      string     `json:"ssh_private_key,omitempty"`
	SSHPort            int        `json:"ssh_port"`
	OperatingSystem    string     `json:"operating_system"`
	Environment        string     `json:"environment"`
	Location           string     `json:"location"`
	Description        string     `json:"description"`
	Status             string     `json:"status"`
	MonitoringInterval int        `json:"monitoring_interval"`
	CPUThreshold       int        `json:"cpu_threshold"`
	MemoryThreshold    int        `json:"memory_threshold"`
	DiskThreshold      int        `json:"disk_threshold"`
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

		err := database.Pool.QueryRow(context.Background(),
			`INSERT INTO servers (
				server_name, ip_address, ssh_username, ssh_private_key, ssh_port, 
				operating_system, environment, location, description, 
				monitoring_interval, cpu_threshold, memory_threshold, disk_threshold
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
			RETURNING id, created_at, updated_at`,
			server.ServerName, server.IPAddress, server.SSHUsername, server.SSHPrivateKey,
			server.SSHPort, server.OperatingSystem, server.Environment, server.Location,
			server.Description, server.MonitoringInterval, server.CPUThreshold,
			server.MemoryThreshold, server.DiskThreshold,
		).Scan(&server.ID, &server.CreatedAt, &server.UpdatedAt)

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
				id, server_name, ip_address, ssh_username, ssh_private_key, ssh_port, 
				operating_system, environment, location, description, 
				monitoring_interval, cpu_threshold, memory_threshold, disk_threshold, last_ping, created_at, updated_at 
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
				&server.ID, &server.ServerName, &server.IPAddress, &server.SSHUsername, &server.SSHPrivateKey,
				&server.SSHPort, &server.OperatingSystem, &server.Environment,
				&server.Location, &server.Description, &server.MonitoringInterval,
				&server.CPUThreshold, &server.MemoryThreshold, &server.DiskThreshold, &server.LastPing, &server.CreatedAt, &server.UpdatedAt,
			)

			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}

			server.Status = "online"

			if server.SSHPrivateKey == "" {
				server.Status = "offline"
				fmt.Printf("Server %s: No SSH private key provided\n", server.ServerName)
			} else {
				client, err := EstablishSSHConnection(server)
				if err != nil {
					server.Status = "offline"
					fmt.Printf("Server %s SSH connection failed: %v\n", server.ServerName, err)
				} else {
					client.Close()
				}
			}
			server.SSHPrivateKey = ""

			servers = append(servers, server)
		}

		if err = rows.Err(); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, servers)
	}
}
func GetServerByID() gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var server Server

		server.Status = "online"

		err := database.Pool.QueryRow(context.Background(),

			`SELECT 
				id, server_name, ip_address, ssh_username, ssh_port, 
				operating_system, environment, location, description,		
				monitoring_interval, cpu_threshold, memory_threshold, disk_threshold, last_ping, created_at, updated_at
			FROM servers WHERE id=$1`, id).Scan(
			&server.ID, &server.ServerName, &server.IPAddress, &server.SSHUsername,
			&server.SSHPort, &server.OperatingSystem, &server.Environment,
			&server.Location, &server.Description, &server.MonitoringInterval,
			&server.CPUThreshold, &server.MemoryThreshold, &server.DiskThreshold, &server.LastPing, &server.CreatedAt, &server.UpdatedAt,
		)

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, server)
	}
}

func UpdateServer() gin.HandlerFunc {
	return func(c *gin.Context) {
		var server Server

		if err := c.ShouldBindJSON(&server); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		err := database.Pool.QueryRow(context.Background(),
			`INSERT INTO servers (
				server_name, ip_address, ssh_username, ssh_private_key, ssh_port, 
				operating_system, environment, location, description, 
				monitoring_interval, cpu_threshold, memory_threshold, disk_threshold
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
			RETURNING id, created_at, updated_at`,
			server.ServerName, server.IPAddress, server.SSHUsername, server.SSHPrivateKey,
			server.SSHPort, server.OperatingSystem, server.Environment, server.Location,
			server.Description, server.MonitoringInterval, server.CPUThreshold,
			server.MemoryThreshold, server.DiskThreshold,
		).Scan(&server.ID, &server.CreatedAt, &server.UpdatedAt)

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusCreated, server)
	}
}

func DeleteServer() gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")

		result, err := database.Pool.Exec(context.Background(),
			`DELETE FROM servers WHERE id = $1`, id)

		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		}

		rowsAffected := result.RowsAffected()
		if rowsAffected == 0 {
			c.JSON(http.StatusNotFound, gin.H{"error": "Server not found"})
		} else {
			c.JSON(http.StatusOK, gin.H{"response": "server deleted"})
		}

	}
}

func UpdateLastPing(serverID int, wg *sync.WaitGroup) {

	defer wg.Done()

	now := time.Now().UTC()
	_, err := database.Pool.Exec(context.Background(),
		"UPDATE servers SET last_ping = $1 WHERE id = $2",
		now, serverID,
	)
	fmt.Printf("Go timestamp: %v (Unix: %d)\n", now, now.Unix())

	if err != nil {
		fmt.Printf("Pinging server error: %v\n", err)
		return
	}

	fmt.Printf("✅ %s: SUCCESS (pinged at %v)\n", serverID, time.Now().Format("15:04:05"))

}

func EstablishSSHConnection(server Server) (*ssh.Client, error) {
	if server.SSHPrivateKey == "" {
		return nil, fmt.Errorf("no SSH private key provided")
	}

	fmt.Printf("Attempting SSH to %s:%d as %s\n", server.IPAddress, server.SSHPort, server.SSHUsername)
	fmt.Printf("Key length: %d characters\n", len(server.SSHPrivateKey))

	if !strings.HasPrefix(server.SSHPrivateKey, "-----BEGIN") {
		return nil, fmt.Errorf("private key format invalid - missing BEGIN header")
	}

	signer, err := ssh.ParsePrivateKey([]byte(server.SSHPrivateKey))
	if err != nil {
		fmt.Printf("Key parsing error: %v\n", err)
		return nil, fmt.Errorf("unable to parse private key: %w", err)
	}

	config := &ssh.ClientConfig{
		User: server.SSHUsername,
		Auth: []ssh.AuthMethod{
			ssh.PublicKeys(signer),
		},
		HostKeyCallback: ssh.InsecureIgnoreHostKey(),
		Timeout:         30 * time.Second,
	}

	address := fmt.Sprintf("%s:%d", server.IPAddress, server.SSHPort)
	client, err := ssh.Dial("tcp", address, config)
	if err != nil {
		fmt.Printf("SSH dial error: %v\n", err)
		return nil, fmt.Errorf("SSH connection failed: %w", err)
	}

	fmt.Printf("SSH connection successful!\n")
	return client, nil
}

func PingAllServers() {

	var wg sync.WaitGroup

	// Here we will get all of the servers from the database
	rows, err := database.Pool.Query(context.Background(),
		`SELECT
			id, server_name, ip_address, ssh_username, ssh_private_key, ssh_port, last_ping
		FROM servers`)

	if err != nil {
		fmt.Printf("Error querying servers: %v\n", err)
		return
	}
	defer rows.Close()

	// Create an array for storing all of the servers
	var servers []Server

	// Now lets loop through all of the servers
	for rows.Next() {
		// Store the values of each server into a variable
		var server Server
		err := rows.Scan(
			&server.ID, &server.ServerName, &server.IPAddress, &server.SSHUsername, &server.SSHPrivateKey,
			&server.SSHPort, &server.LastPing,
		)
		if err != nil {
			fmt.Printf("Error scanning server: %v\n", err)
			continue // Continue to next server
		}

		if server.SSHPrivateKey == "" {
			fmt.Printf("Server %s: No SSH key provided\n", server.ServerName)
			continue // Skip this server
		}

		client, err := EstablishSSHConnection(server)
		if err != nil {
			fmt.Printf("Server %s SSH connection failed: %v\n", server.ServerName, err)
			continue // Continue to next server
		}

		wg.Add(1)

		go UpdateLastPing(server.ID, &wg)

		client.Close()
		servers = append(servers, server)
	}

	wg.Wait()
	fmt.Printf("Pinged %d servers\n", len(servers))
}

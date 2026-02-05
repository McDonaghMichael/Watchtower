package routes

import (
	"context"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"
	"watchtower/api/database"
	"watchtower/api/models"
	"watchtower/api/utils"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/ssh"
)

func AddServer() gin.HandlerFunc {
	return func(c *gin.Context) {
		var server models.Server

		if err := c.ShouldBindJSON(&server); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		err := database.Pool.QueryRow(context.Background(),
			`INSERT INTO servers (
				server_name, ip_address, ssh_username, ssh_private_key, ssh_port, 
				operating_system, environment, location, description
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
			RETURNING id, created_at, updated_at`,
			server.ServerName, server.IPAddress, server.SSHUsername, server.SSHPrivateKey,
			server.SSHPort, server.OperatingSystem, server.Environment, server.Location,
			server.Description,
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
				operating_system, environment, location, description, last_ping, created_at, updated_at 
			FROM servers`)

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		defer rows.Close()

		var servers []models.Server
		for rows.Next() {
			var server models.Server

			err := rows.Scan(
				&server.ID, &server.ServerName, &server.IPAddress, &server.SSHUsername, &server.SSHPrivateKey,
				&server.SSHPort, &server.OperatingSystem, &server.Environment,
				&server.Location, &server.Description, &server.LastPing, &server.CreatedAt, &server.UpdatedAt,
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
func GetServerByID() gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var server models.Server

		err := database.Pool.QueryRow(context.Background(),

			`SELECT 
				id, server_name, ip_address, ssh_username, ssh_port, ssh_private_key, 
				operating_system, environment, location, description, last_ping, created_at, updated_at
			FROM servers WHERE id=$1`, id).Scan(
			&server.ID, &server.ServerName, &server.IPAddress, &server.SSHUsername,
			&server.SSHPort, &server.SSHPrivateKey, &server.OperatingSystem, &server.Environment,
			&server.Location, &server.Description, &server.LastPing, &server.CreatedAt, &server.UpdatedAt,
		)

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error(), "message": "Unable to locate server with given id"})
			return
		}

		c.JSON(http.StatusOK, server)
	}
}

func UpdateServer() gin.HandlerFunc {
	return func(c *gin.Context) {
		var server models.Server

		if err := c.ShouldBindJSON(&server); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		err := database.Pool.QueryRow(context.Background(),
			`UPDATE servers SET
        server_name = $1,
        ip_address = $2,
        ssh_username = $3,
        ssh_private_key = $4,
        ssh_port = $5,
        operating_system = $6,
        environment = $7,
        location = $8,
        description = $9,
        updated_at = NOW()
     WHERE id = $10
     RETURNING id, created_at, updated_at`,
			server.ServerName, server.IPAddress, server.SSHUsername, server.SSHPrivateKey,
			server.SSHPort, server.OperatingSystem, server.Environment, server.Location,
			server.Description, server.ID,
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
			c.JSON(http.StatusNotFound, gin.H{"error": "models.Server not found"})
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

	if err != nil {

		fmt.Printf("Pinging server error: %v\n", err)

		if err != nil {
			fmt.Printf("Error updating database: %v\n", err)
			return
		}

		return
	}

	fmt.Printf("✅ %s: SUCCESS (pinged at %v)\n", serverID, time.Now().Format("15:04:05"))

}

func UpdateLastPingServer() gin.HandlerFunc {
	return func(c *gin.Context) {

		serverID, err := strconv.Atoi(c.Param("id"))

		now := time.Now().UTC()
		_, err = database.Pool.Exec(context.Background(),
			"UPDATE servers SET last_ping = $1 WHERE id = $2",
			now, serverID,
		)

		if err != nil {

			fmt.Printf("Pinging server error: %v\n", err)

			if err != nil {
				fmt.Printf("Error updating database: %v\n", err)
				return
			}

			return
		}

		fmt.Printf("✅ %s: SUCCESS (pinged at %v)\n", serverID, time.Now().Format("15:04:05"))

		c.JSON(http.StatusAccepted, gin.H{"ping": now})
	}

}

func EstablishSSHConnection(server models.Server) (*ssh.Client, error) {
	if server.SSHPrivateKey == "" {
		return nil, fmt.Errorf("no SSH private key provided")
	}

	
	utils.GetConsole().PrintSecondary(fmt.Sprintf("Attempting SSH to %s:%d as %s\n", server.IPAddress, server.SSHPort, server.SSHUsername))

		utils.GetConsole().PrintSecondary(fmt.Sprintf("Key length: %d characters\n", len(server.SSHPrivateKey)))


	// Log the first and last parts of the key for debugging
	keyPreview := strings.TrimSpace(server.SSHPrivateKey)
	if len(keyPreview) > 100 {
		utils.GetConsole().PrintDebug(fmt.Sprintf("Key preview (first 100 chars): %s...\n", keyPreview[:100]))
		utils.GetConsole().PrintDebug(fmt.Sprintf("Key preview (last 50 chars): ...%s\n", keyPreview[len(keyPreview)-50:]))

	}

	if !strings.HasPrefix(keyPreview, "-----BEGIN") {
		return nil, utils.GetConsole().PrintError(fmt.Sprintf("private key format invalid - missing BEGIN header. Starts with: %s", keyPreview[:50]))
		

	}

	// Try different parsing methods
	var signer ssh.Signer
	var err error

	// Method 1: Standard parsing
	signer, err = ssh.ParsePrivateKey([]byte(keyPreview))
	if err != nil {
		utils.GetConsole().PrintError(fmt.Sprintf("Standard parse failed: %v\n", err))


		// Method 2: Try with empty passphrase
		signer, err = ssh.ParsePrivateKeyWithPassphrase([]byte(keyPreview), []byte(""))
		if err != nil {
			utils.GetConsole().PrintError(fmt.Sprintf("Parse with empty passphrase failed: %v\n", err))

			
			return nil, utils.GetConsole().PrintError(fmt.Sprintf("unable to parse private key: %w", err))
		}
			utils.GetConsole().PrintSuccess("Key parsed successfully with empty passphrase")

	} else {
			utils.GetConsole().PrintSuccess("Key parsed successfully without passphrase")

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
	fmt.Printf("Dialing SSH connection to: %s\n", address)

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

	rows, err := database.Pool.Query(context.Background(),
		`SELECT
			id, server_name, ip_address, ssh_username, ssh_private_key, ssh_port, last_ping
		FROM servers`)

	if err != nil {
		utils.GetConsole().PrintError(fmt.Sprintf("Error querying servers: %v\n", err))
		return
	}
	defer rows.Close()

	var servers []models.Server

	for rows.Next() {

		var server models.Server
		err := rows.Scan(
			&server.ID, &server.ServerName, &server.IPAddress, &server.SSHUsername, &server.SSHPrivateKey,
			&server.SSHPort, &server.LastPing,
		)
		if err != nil {
		utils.GetConsole().PrintError(fmt.Sprintf("Error scanning server: %v\n", err))

			continue
		}

		if server.SSHPrivateKey == "" {
		utils.GetConsole().PrintWarning(fmt.Sprintf("models.Server %s: No SSH key provided\n", server.ServerName))
			
			continue
		}

		_, err = utils.Ping(server.IPAddress)
		if err != nil {
			continue
		}

		client, err := EstablishSSHConnection(server)
		if err != nil {
			continue
		}

		wg.Add(1)

		go UpdateLastPing(server.ID, &wg)

		client.Close()
		servers = append(servers, server)
	}

	wg.Wait()
}

func GetAllServers() ([]models.Server, error) {
	rows, err := database.Pool.Query(
		context.Background(),
		`SELECT id, ip_address, last_ping FROM servers`,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var servers []models.Server

	for rows.Next() {
		var s models.Server
		err := rows.Scan(&s.ID, &s.IPAddress, &s.LastPing)
		if err != nil {
			return nil, err
		}
		servers = append(servers, s)
	}

	return servers, nil
}

func ExecuteSSHCommand(client *ssh.Client, command string) (string, error) {

	session, err := client.NewSession()
	if err != nil {
		return "", fmt.Errorf("failed to create SSH session: %w", err)
	}
	defer session.Close()

	output, err := session.CombinedOutput(command)
	if err != nil {
		return string(output), fmt.Errorf("command execution failed: %w", err)
	}

	return string(output), nil
}

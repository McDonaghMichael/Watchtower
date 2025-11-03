package routes

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

func SetupAPIRoutes(r *gin.RouterGroup) {

	r.Use(corsMiddleware())

	r.GET("/health", getHealth())

	// ========== Account Routes ==========
	r.GET("/accounts", getDefault())       // List all accounts
	r.GET("/account/:id", getDefault())    // Find account given the ID
	r.POST("/account/:id", getDefault())   // Update the account given the ID
	r.POST("/account", getDefault())       // Create a new account
	r.DELETE("/account/:id", getDefault()) // Delete the account given the ID

	// ========== Server Routes ==========
	r.GET("/servers", GetServers())       // List all servers
	r.GET("/server/:id", GetServerByID()) // Find server given the ID
	//r.GET("/server/:id/metrics", getDefault())  // Get server metrics given the ID
	//r.GET("/server/:id/health", getDefault())   // Get server health given the ID
	//r.POST("/server/:id/execute", getDefault()) // Execute command on server given the ID
	r.PUT("/server/:id", UpdateServer()) // Update the server given the ID
	r.POST("/server/ping/:id", UpdateLastPingServer())
	r.GET("/server/status/:id", GetServerStatus())
	r.POST("/server", AddServer())          // Create a new server
	r.DELETE("/server/:id", DeleteServer()) // Delete the server given the ID

	// ========== Metrics Routes ==========
	r.POST("/metric", AddMetric())
	r.GET("/metrics/server/:id", GetMetricsByServerID()) // Gets metrics by server ID
}

func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")

		fmt.Printf("=== CORS DEBUG ===\n")
		fmt.Printf("Request Origin: '%s'\n", origin)
		fmt.Printf("Request Method: '%s'\n", c.Request.Method)
		fmt.Printf("All Headers: %v\n", c.Request.Header)

		// If origin is empty or matches our server, allow it
		if origin == "" {
			origin = "*" // Allow all for now during debugging
		}

		c.Header("Access-Control-Allow-Origin", origin)
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization")

		c.Next()
	}
}

func getHealth() gin.HandlerFunc {
	return func(c *gin.Context) {

		c.JSON(http.StatusOK, "All good")
	}
}

func getDefault() gin.HandlerFunc {
	return func(c *gin.Context) {

		c.JSON(http.StatusOK, "Default")
	}
}

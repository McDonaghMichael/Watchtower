package routes

import (
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
	r.GET("/servers", getDefault()) // List all servers
	r.GET("/server/:id", getDefault()) // Find server given the ID
	r.GET("/server/:id/metrics", getDefault()) // Get server metrics given the ID
	r.GET("/server/:id/health", getDefault()) // Get server health given the ID
	r,POST("/server/:id/execute", getDefault()) // Execute command on server given the ID
	r.POST("/server/:id", getDefault()) // Update the server given the ID
	r.POST("/server", getDefault()) // Create a new server
	r.DELETE("/server/:id", getDefault()) // Delete the server given the ID
}

func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "http://localhost:3000")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
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

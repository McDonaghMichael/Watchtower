package main

import (
	"log"
	"time"
	"watchtower/api/database"
	"watchtower/api/routes"

	"github.com/gin-gonic/gin"
)

func main() {
	database.Connect()
	gin.SetMode(gin.ReleaseMode)
	r := gin.Default()

	r.Use(func(c *gin.Context) {
		allowedOrigins := map[string]bool{
			"http://localhost:3000":     true,
			"http://localhost:3001":     true,
			"http://80.208.227.58:3000": true,
			"http://80.208.227.58:3001": true,
		}

		origin := c.Request.Header.Get("Origin")

		if allowedOrigins[origin] {
			c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
		}

		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})
	routes.SetupAPIRoutes(r.Group("/api/v1"))

	// Start the ping loop BEFORE starting the server
	go func() {
		for {
			routes.PingAllServers()
			time.Sleep(60 * time.Second)
		}
	}()

	port := "8080"
	log.Printf("🚀 API server running on http://localhost:%s/api/v1\n", port)
	log.Fatal(r.Run(":" + port)) // This blocks forever
}

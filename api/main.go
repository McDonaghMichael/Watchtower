package main

import (
	"fmt"
	"log"
	"time"
	"watchtower/api/actions"
	"watchtower/api/database"
	"watchtower/api/redis"
	"watchtower/api/routes"

	"github.com/gin-gonic/gin"
)

func main() {
	database.Connect()
	gin.SetMode(gin.ReleaseMode)

	r := gin.New() // don't use Default, we'll add our own middleware
	r.Use(gin.Recovery())
	r.Use(corsMiddleware()) // global CORS for all routes

	// Catch-all OPTIONS preflight
	r.OPTIONS("/*path", func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization")
		c.AbortWithStatus(200)
	})

	// API routes
	routes.SetupAPIRoutes(r.Group("/api/v1"))

	// Start ping loop
	go func() {
		for {
			routes.PingAllServers()
			time.Sleep(60 * time.Second)
		}
	}()

	StartHealthChecker()
	go actions.StartHandlingActions()

	redis.Init()
	redis.ExampleClient()
	port := "8080"
	log.Printf("🚀 API server running on http://localhost:%s/api/v1\n", port)
	log.Fatal(r.Run(":" + port))

}

func corsMiddleware() gin.HandlerFunc {
	allowedOrigins := []string{
		"http://localhost:3000",
		"http://80.208.227.58:3000",
	}

	return func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")
		if origin != "" {
			for _, o := range allowedOrigins {
				if o == origin {
					c.Header("Access-Control-Allow-Origin", origin)
					break
				}
			}
		} else {
			c.Header("Access-Control-Allow-Origin", "*") // allow debug requests with empty origin
		}

		fmt.Printf("=== CORS DEBUG 5 ===\n")

		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization")
		c.Header("Access-Control-Allow-Credentials", "true")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(200)
			return
		}

		c.Next()
	}
}

func StartHealthChecker() {
	go func() {
		for {
			routes.CheckAllServersHealth()
			time.Sleep(10 * time.Second)
		}
	}()
}

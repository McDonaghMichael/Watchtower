package main

import (
	"fmt"
	"github.com/gin-gonic/gin"
	"log"
	"os"
	"time"
	"watchtower/api/actions"
	"watchtower/api/database"
	"watchtower/api/redis"
	"watchtower/api/routes"
	"watchtower/api/utils"
)

func main() {

	utils.GetConsole().PrintInfo("LOADING WATCHTOWER API")

	utils.InitAuth()
	database.Connect()
	gin.SetMode(gin.ReleaseMode)

	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(corsMiddleware())

	r.OPTIONS("/*path", func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization")
		c.AbortWithStatus(200)
	})

	utils.GetConsole().PrintSecondary("Setting up all API routes on /api/v1")
	routes.SetupAPIRoutes(r.Group("/api/v1"))

	go func() {
		utils.GetConsole().PrintSecondary("Starting ping loop for all servers every 60's")
		for {
			routes.PingAllServers()
			time.Sleep(60 * time.Second)
		}
	}()

	StartHealthChecker()

	go actions.StartHandlingActions()

	redis.Init()
	port := "8080"
	log.Printf("🚀 API server running on http://localhost:%s/api/v1\n", port)
	utils.GetConsole().PrintSuccess("LOADED API")

	log.Fatal(r.Run(":" + port))

}

func corsMiddleware() gin.HandlerFunc {

	var allowedOriginIP string = os.Getenv("ALLOWED_ORIGIN")
	allowedOrigins := []string{
		"http://localhost:3000",
		allowedOriginIP,
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

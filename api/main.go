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

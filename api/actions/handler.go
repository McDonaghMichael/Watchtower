package actions

import (
	"context"
	"fmt"
	"log"
	"watchtower/api/database"
	"watchtower/api/models"
)

func StartHandlingActions() {
	fmt.Println("ACTION HANDLER STARTED")

	var serverMetrics []models.Metrics

	rows, err := database.Pool.Query(context.Background(),
		`SELECT DISTINCT ON (server_id) server_id, cpu_usage, timestamp 
         FROM metrics 
         ORDER BY server_id, timestamp DESC 
         LIMIT 2`,
	)

	if err != nil {
		log.Printf("Query error: %v", err)
		return
	}
	defer rows.Close()

	for rows.Next() {
		var sm models.Metrics

		err := rows.Scan(&sm.ServerID, &sm.CPUUsage, &sm.Timestamp)

		if err != nil {
			log.Printf("Scan error: %v", err)
			continue
		}
		serverMetrics = append(serverMetrics, sm)
	}

	if err := rows.Err(); err != nil {
		log.Printf("Rows error: %v", err)
		return
	}

	for _, value := range serverMetrics {
		fmt.Printf("Server %s: CPU Usage %.2f%% at %v\n",
			value.ServerID, value.CPUUsage, value.Timestamp)
	}
}

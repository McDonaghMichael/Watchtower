package actions

import (
	"context"
	"fmt"
	"log"
	"watchtower/api/database"
	"watchtower/api/models"
)

type Conditionals struct {
	ServerID      int    `json:"server_id"`
	ConditionalID int    `json:"condition_id"`
	GroupID       int    `json:"group_id"`
	Metric        string `json:"metric"`
	Value         int    `json:"value"`
	Action        string `json:"action"`
}

type MetricConditionalLog struct {
	ID         int `json:"id"`
	ConditonID int `json:"condition_id"`
	MetricID   int `json:"metric_id"`
}

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

	var conditionals []Conditionals

	rows, err = database.Pool.Query(context.Background(),
		`SELECT g.server_id, c.condition_id, c.metric, g.group_id,c.value, a.action
         FROM conditions c
         INNER JOIN actions a ON c.group_id = a.group_id
         INNER JOIN groups g ON c.group_id = g.group_id`,
	)

	if err != nil {
		log.Printf("Query error: %v", err)
		return
	}

	defer rows.Close()

	for rows.Next() {
		var cond Conditionals

		err := rows.Scan(&cond.ServerID, &cond.ConditionalID, &cond.Metric, &cond.GroupID, &cond.Value, &cond.Action)

		if err != nil {
			log.Printf("Query error: %v", err)
			continue
		}

		conditionals = append(conditionals, cond)

	}

	for index, value := range conditionals {
		fmt.Printf("%v : Server: %v,Condition: %v, Group: %v, Metric: %v, Value: %v, Action: %v\n\n", index,
			value.ServerID, value.ConditionalID, value.GroupID, value.Metric, value.Value, value.Action)

		if IsConditionCorrect(value.ServerID, value.Metric, value.Value, value.ConditionalID) {
			executeAction(value.Action)

		}
	}

}

func executeAction(action string) {
	switch action {
	case "webhook":
		fmt.Println("SENDS WEBHOOK")
	case "reboot":
		fmt.Println("REBOOTS SERVER")
	}
}

func IsConditionCorrect(serverID int, metric string, value int, conditionID int) bool {
	ser, _ := getServerByID(serverID)

	isLogged, _ := hasMetricBeenCondition(conditionID, ser.ID)
	if isLogged {
		fmt.Println("ALREADY LOGGED METRIC:", ser.ID)
		return false
	}

	logMetricConditional(conditionID, ser.ID)

	switch metric {
	case "cpu_usage":
		fmt.Println("CPU USAGE: ", ser.CPUUsage)
		fmt.Println("VALUE USAGE: ", value)
		if ser.CPUUsage > float64(value) {
			return true
		}
	case "disk_usage":
		total := float64(ser.DiskUsageTotal)
		used := float64(ser.DiskUsageUsed)

		usedPercentage := (used / total) * 100

		fmt.Println("DISK USAGE: ", usedPercentage)
		fmt.Println("VALUE USAGE: ", value)
		if float64(usedPercentage) > float64(value) {
			return true
		}
	}

	return false
}

func getServerByID(id int) (models.Metrics, error) {
	var metrics models.Metrics

	rows, err := database.Pool.Query(context.Background(),
		`SELECT 
            id, server_id, num_of_cpu, cpu_usage,
            memory_allocated, memory_allocations, memory_usage_percent,
            swap_used, swap_total, swap_free, cache_memory, buffer_memory,
            disk_usage_total, disk_usage_used, disk_usage_free,
            ssh_connections, http_connections, https_connections,
            uptime_seconds, timestamp
        FROM metrics
        WHERE server_id = $1
        ORDER BY timestamp DESC LIMIT 1`, id)

	if err != nil {
		return metrics, err
	}
	defer rows.Close()

	if rows.Next() {

		err := rows.Scan(
			&metrics.ID, &metrics.ServerID, &metrics.NumOfCPU, &metrics.CPUUsage,
			&metrics.MemoryAllocated, &metrics.MemoryAllocations, &metrics.MemoryUsagePercent,
			&metrics.SwapUsed, &metrics.SwapTotal, &metrics.SwapFree, &metrics.CacheMemory, &metrics.BufferMemory,
			&metrics.DiskUsageTotal, &metrics.DiskUsageUsed, &metrics.DiskUsageFree,
			&metrics.SSHConnections, &metrics.HTTPConnections, &metrics.HTTPSConnections,
			&metrics.UptimeSeconds, &metrics.Timestamp,
		)
		if err != nil {
			return metrics, err
		}
	} else {
		return metrics, fmt.Errorf("no metrics found for server ID %d", id)
	}

	if err := rows.Err(); err != nil {
		return metrics, err
	}

	return metrics, nil
}

/*
*
When a conditions actions are executed, the metrics id gets stored as to not execute due to that same metric
*/
func logMetricConditional(conditionID int, metricID int) error {
	var id int
	err := database.Pool.QueryRow(context.Background(),
		`INSERT INTO metrics_used_for_condtionals (
            condition_id,
            metric_id
        ) VALUES ($1, $2) RETURNING id`,
		conditionID, metricID,
	).Scan(&id)

	if err != nil {
		log.Printf("Failed to log metric conditional: %v", err)
		return err
	}

	log.Printf("Logged metric conditional: condition=%d, metric=%d, id=%d",
		conditionID, metricID, id)
	return nil
}

func hasMetricBeenCondition(conditionID int, metricID int) (bool, error) {
	var exists bool
	err := database.Pool.QueryRow(context.Background(),
		`SELECT EXISTS(
            SELECT 1 
            FROM metrics_used_for_condtionals 
            WHERE condition_id = $1 AND metric_id = $2
        )`,
		conditionID, metricID,
	).Scan(&exists)

	if err != nil {
		log.Printf("Failed to check metric conditional: %v", err)
		return false, err
	}

	return exists, nil
}

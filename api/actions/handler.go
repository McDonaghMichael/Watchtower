package actions

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"
	"watchtower/api/database"
	"watchtower/api/models"
	"watchtower/api/routes"
)

type Conditionals struct {
	ServerID      int    `json:"server_id"`
	ConditionalID int    `json:"condition_id"`
	GroupID       int    `json:"group_id"`
	Metric        string `json:"metric"`
	Value         int    `json:"value"`
	Action        string `json:"action"`
	ActionValue   string `json:"action_value"`
	Operation     string `json:"operation"`
}

type MetricConditionalLog struct {
	ID         int `json:"id"`
	ConditonID int `json:"condition_id"`
	MetricID   int `json:"metric_id"`
}

func StartHandlingActions() {
	fmt.Println("ACTION HANDLER STARTED")

	for true {
		fmt.Println("EXECUTION HANDLER STARTED")

		go ExecuteActions()
		time.Sleep(6 * time.Second)
	}
}

func ExecuteActions() {

	var serverMetrics []models.Metrics

	rows, err := database.Pool.Query(context.Background(),
		`SELECT DISTINCT ON (server_id) server_id, cpu_usage, timestamp 
         FROM metrics 
         ORDER BY server_id, timestamp DESC 
         LIMIT 1`,
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
		`SELECT g.server_id, c.condition_id, c.metric, g.group_id,c.value, a.action, a.value, c.operator
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

		err := rows.Scan(&cond.ServerID, &cond.ConditionalID, &cond.Metric, &cond.GroupID, &cond.Value, &cond.Action, &cond.ActionValue, &cond.Operation)

		if err != nil {
			log.Printf("Query error: %v", err)
			continue
		}

		conditionals = append(conditionals, cond)

	}

	for index, value := range conditionals {
		fmt.Printf("%v : Server: %v,Condition: %v, Group: %v, Metric: %v, Value: %v, Action: %v\n\n", index,
			value.ServerID, value.ConditionalID, value.GroupID, value.Metric, value.Value, value.Action)

		var server models.Server = GetServerByID(value.ServerID)
		if IsConditionCorrect(value.ServerID, value.Metric, value.Value, value.ConditionalID, value.Operation) {
			executeAction(server, value.Action, value.ActionValue)

		}
	}

}

func executeAction(server models.Server, action string, value string) {
	switch action {
	case "webhook":
		sendDiscordWebhook(value, "server has err")
	case "reboot":
		client, err := routes.EstablishSSHConnection(server)
		if err != nil {
			fmt.Printf("SSH connection failed: %v\n", err.Error())
			return
		}
		defer client.Close()

		// Debug: Print the command before executing
		fmt.Printf("Executing command: %s\n", "reboot")

		// Execute the command and capture output/error
		output, err := routes.ExecuteSSHCommand(client, "reboot")
		if err != nil {
			fmt.Printf("Command execution failed: %v\n", err)
			fmt.Printf("Command output: %s\n", output)
		} else {
			fmt.Printf("Command executed successfully. Output: %s\n", output)
		}
	case "exec_command":
		client, err := routes.EstablishSSHConnection(server)
		if err != nil {
			fmt.Printf("SSH connection failed: %v\n", err.Error())
			return
		}
		defer client.Close()

		// Debug: Print the command before executing
		fmt.Printf("Executing command: %s\n", value)

		// Execute the command and capture output/error
		output, err := routes.ExecuteSSHCommand(client, value)
		if err != nil {
			fmt.Printf("Command execution failed: %v\n", err)
			fmt.Printf("Command output: %s\n", output)
		} else {
			fmt.Printf("Command executed successfully. Output: %s\n", output)
		}
	}
}

func IsConditionCorrect(serverID int, metric string, value int, conditionID int, operation string) bool {
	ser, _ := getMetricsById(serverID)

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

		return performOperation(ser.CPUUsage, float64(value), operation)
	case "disk_usage":
		usedPercentage := (float64(ser.DiskUsageUsed) / float64(ser.DiskUsageTotal)) * 100

		fmt.Println("DISK USAGE: ", usedPercentage)
		fmt.Println("VALUE USAGE: ", value)

		return performOperation(float64(usedPercentage), float64(value), operation)
	}

	return false
}

func getMetricsById(id int) (models.Metrics, error) {
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

func GetServerByID(id int) models.Server {
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

	}

	return server
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

type DiscordWebhook struct {
	Content string `json:"content"`
}

func sendDiscordWebhook(webhookURL string, message string) error {
	// Create the webhook payload
	payload := DiscordWebhook{
		Content: message,
	}

	// Convert to JSON
	jsonData, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal JSON: %v", err)
	}

	// Send HTTP POST request
	resp, err := http.Post(webhookURL, "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("failed to send webhook: %v", err)
	}
	defer resp.Body.Close()

	// Check response status
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("webhook returned status: %s", resp.Status)
	}

	fmt.Println("Discord webhook sent successfully!")
	return nil
}

func performOperation(x float64, y float64, operation string) bool {
	switch operation {
	case ">":
		return x > y
	case "<":
		return x < y
	case ">=":
		return x >= y
	case "<=":
		return x <= y
	case "==":
		return x == y
	case "!=":
		return x != y
	default:
		return false // or handle unknown operation
	}
}

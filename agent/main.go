package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"sync"
	"time"

	"github.com/shirou/gopsutil/v3/cpu"
	"github.com/shirou/gopsutil/v3/disk"
	"github.com/shirou/gopsutil/v3/host"
	"github.com/shirou/gopsutil/v3/mem"
	"github.com/shirou/gopsutil/v3/net"
)

type Metrics struct {
	ID                 int     `json:"id"`
	ServerID           int     `json:"server_id"`
	NumOfCPU           int     `json:"num_of_cpu"`
	CPUUsage           float64 `json:"cpu_usage"`
	MemoryAllocated    int     `json:"memory_allocated"`
	MemoryAllocations  int     `json:"memory_allocations"`
	MemoryUsagePercent float64 `json:"memory_usage_percent"`
	SwapUsed           int64   `json:"swap_used"`
	SwapTotal          int64   `json:"swap_total"`
	SwapFree           int64   `json:"swap_free"`
	CacheMemory        int64   `json:"cache_memory"`
	BufferMemory       int64   `json:"buffer_memory"`
	DiskUsageTotal     uint64  `json:"disk_usage_total"`
	DiskUsageUsed      uint64  `json:"disk_usage_used"`
	DiskUsageFree      uint64  `json:"disk_usage_free"`
	SSHConnections     int     `json:"ssh_connections"`
	HTTPConnections    int     `json:"http_connections"`
	HTTPSConnections   int     `json:"https_connections"`
	UptimeSeconds      int64   `json:"uptime_seconds"`
}

// latestMetrics is updated after every collection cycle and served on GET /status.
var (
	latestMu      sync.RWMutex
	latestMetrics *Metrics
)

func startStatusServer() {
	mux := http.NewServeMux()
	mux.HandleFunc("/status", func(w http.ResponseWriter, r *http.Request) {
		latestMu.RLock()
		m := latestMetrics
		latestMu.RUnlock()

		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Access-Control-Allow-Origin", "*")
		if m == nil {
			w.WriteHeader(http.StatusServiceUnavailable)
			fmt.Fprintln(w, `{"status":"starting"}`)
			return
		}
		json.NewEncoder(w).Encode(m)
	})

	log.Println("Status server listening on :8744")
	if err := http.ListenAndServe(":8744", mux); err != nil {
		log.Printf("Status server error: %v", err)
	}
}

func main() {
	serverURL := os.Getenv("SERVER_URL")
	serverID, _ := strconv.Atoi(os.Getenv("SERVER_ID"))
	agentToken := os.Getenv("AGENT_TOKEN")

	go startStatusServer()

	for {
		vmen, _ := mem.VirtualMemory()
		swap, _ := mem.SwapMemory()
		usage, _ := disk.Usage("/")
		connections, _ := net.Connections("all")
		uptime, _ := GetUptime()
		cpuUsage, _ := getCPUUsage()

		sshConns, httpConns, httpsConns := 0, 0, 0
		for _, conn := range connections {
			if conn.Status == "ESTABLISHED" {
				switch conn.Laddr.Port {
				case 22:
					sshConns++
				case 80:
					httpConns++
				case 443:
					httpsConns++
				}
			}
		}

		metrics := Metrics{
			ServerID:           serverID,
			NumOfCPU:           getNumCPU(),
			CPUUsage:           cpuUsage,
			MemoryAllocated:    int(vmen.Used),
			MemoryAllocations:  int(vmen.Total),
			MemoryUsagePercent: vmen.UsedPercent,
			SwapUsed:           int64(swap.Used),
			SwapTotal:          int64(swap.Total),
			SwapFree:           int64(swap.Free),
			CacheMemory:        int64(vmen.Cached),
			BufferMemory:       int64(vmen.Buffers),
			DiskUsageTotal:     usage.Total,
			DiskUsageUsed:      usage.Used,
			DiskUsageFree:      usage.Free,
			SSHConnections:     sshConns,
			HTTPConnections:    httpConns,
			HTTPSConnections:   httpsConns,
			UptimeSeconds:      int64(uptime.Seconds()),
		}

		latestMu.Lock()
		latestMetrics = &metrics
		latestMu.Unlock()

		body, err := json.Marshal(metrics)
		if err != nil {
			log.Printf("Error marshaling JSON: %v", err)
			time.Sleep(5 * time.Second)
			continue
		}

		r, err := http.NewRequest("POST", serverURL, bytes.NewBuffer(body))
		if err != nil {
			log.Printf("Error creating request: %v", err)
			time.Sleep(5 * time.Second)
			continue
		}
		r.Header.Add("Content-Type", "application/json")
		if agentToken != "" {
			r.Header.Add("Authorization", "Bearer "+agentToken)
		}

		client := &http.Client{Timeout: 10 * time.Second}
		res, err := client.Do(r)
		if err != nil {
			log.Printf("Error sending metrics: %v", err)
			time.Sleep(5 * time.Second)
			continue
		}
		res.Body.Close()

		if res.StatusCode != http.StatusCreated {
			log.Printf("API returned status %d", res.StatusCode)
		}

		time.Sleep(5 * time.Second)
	}
}

func getCPUUsage() (float64, error) {
	percentages, err := cpu.Percent(time.Second, false)
	if err != nil {
		return 0, err
	}
	if len(percentages) > 0 {
		return percentages[0], nil
	}
	return 0, nil
}

func getNumCPU() int {
	count, err := cpu.Counts(true)
	if err != nil || count == 0 {
		return 1
	}
	return count
}

func GetUptime() (time.Duration, error) {
	uptimeSeconds, err := host.Uptime()
	if err != nil {
		return 0, err
	}
	return time.Duration(uptimeSeconds) * time.Second, nil
}

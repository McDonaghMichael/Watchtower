package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"runtime"
	"strconv"
	"time"

	"github.com/shirou/gopsutil/cpu"
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

func main() {

	serverIP := os.Getenv("SERVER_URL")

	var routeIP string = serverIP

	serverID, _ := strconv.Atoi(os.Getenv("SERVER_ID"))

	for {
		var memr runtime.MemStats
		runtime.ReadMemStats(&memr)

		vmen, _ := mem.VirtualMemory()

		var numOfCPU int = runtime.NumCPU()
		var totalMemoryAllocated uint64 = vmen.Used
		var totalMemoryAllocations uint64 = vmen.Total
		var totalUsedMemory float64 = vmen.UsedPercent
		var totalCachedMemory uint64 = vmen.Cached
		var totalBufferMemory uint64 = vmen.Buffers

		cpuUsage, _ := getCPUUsage()

		var totalSwap uint64 = vmen.SwapTotal
		swap, _ := mem.SwapMemory()
		var usedSwap uint64 = swap.Used
		var freeSwap uint64 = swap.Free

		systemUptimeSeconds, err := GetUptime()
		if err != nil {
			log.Printf("Error getting uptime: %v", err)
			// Handle appropriately
		}

		usage, err := disk.Usage("/")
		if err != nil {
			panic(err)
		}

		connections, err := net.Connections("all")
		if err != nil {
			panic(err)
		}

		sshConnections := 0
		httpConnections := 0
		httpsConnections := 0

		for _, conn := range connections {
			if conn.Status == "ESTABLISHED" {
				switch conn.Laddr.Port {
				case 22:
					sshConnections++
				case 80:
					httpConnections++
				case 443:
					httpsConnections++
				}
			}
		}
		// Create metrics struct first
		metrics := Metrics{
			ServerID:           serverID,
			NumOfCPU:           numOfCPU,
			CPUUsage:           cpuUsage,
			MemoryAllocated:    int(totalMemoryAllocated),
			MemoryAllocations:  int(totalMemoryAllocations),
			MemoryUsagePercent: totalUsedMemory,
			SwapUsed:           int64(usedSwap),
			SwapTotal:          int64(totalSwap),
			SwapFree:           int64(freeSwap),
			CacheMemory:        int64(totalCachedMemory),
			BufferMemory:       int64(totalBufferMemory),
			DiskUsageTotal:     usage.Total,
			DiskUsageUsed:      usage.Used,
			DiskUsageFree:      usage.Free,
			SSHConnections:     sshConnections,
			HTTPConnections:    httpConnections,
			HTTPSConnections:   httpsConnections,
			UptimeSeconds:      int64(systemUptimeSeconds.Seconds()),
		}

		body, err := json.Marshal(metrics)
		if err != nil {
			log.Printf("Error marshaling JSON: %v", err)
			time.Sleep(time.Second * 5)
			continue
		}

		fmt.Printf("Sending JSON: %s\n", string(body))

		r, err := http.NewRequest("POST", routeIP, bytes.NewBuffer(body))
		if err != nil {
			log.Printf("Error creating request: %v", err)
			time.Sleep(time.Second * 5)
			continue
		}

		r.Header.Add("Content-Type", "application/json")

		client := &http.Client{}
		res, err := client.Do(r)
		if err != nil {
			log.Printf("Error sending request: %v", err)
			time.Sleep(time.Second * 5)
			continue
		}
		defer res.Body.Close()

		// Check response status
		if res.StatusCode != http.StatusCreated {
			// Read the error response to see what's wrong
			var errorBody bytes.Buffer
			errorBody.ReadFrom(res.Body)
			log.Printf("API Error %d: %s", res.StatusCode, errorBody.String())
			time.Sleep(time.Second * 5)
			continue
		}

		post := &Metrics{}
		derr := json.NewDecoder(res.Body).Decode(post)
		if derr != nil {
			log.Printf("Error decoding response: %v", derr)
			time.Sleep(time.Second * 5)
			continue
		}

		fmt.Println("ID:", post.ID)
		fmt.Println("CPU Usage:", cpuUsage)
		fmt.Println("Num Of CPU:", numOfCPU)
		fmt.Println("Memory Allocated:", totalMemoryAllocated)
		fmt.Println("Memory Allocations:", totalMemoryAllocations)
		fmt.Println("Memory Usage Percent:", totalUsedMemory)
		fmt.Println("Memory Cache:", totalCachedMemory)
		fmt.Println("Memory Buffer:", totalBufferMemory)
		fmt.Println("Total Swap:", totalSwap)
		fmt.Println("Used Swap:", usedSwap)
		fmt.Println("Free Swap:", freeSwap)
		fmt.Println("Uptime Seconds:", systemUptimeSeconds)

		time.Sleep(time.Second * 5)
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

func GetUptime() (time.Duration, error) {
	uptimeSeconds, err := host.Uptime()
	if err != nil {
		return 0, err
	}
	return time.Duration(uptimeSeconds) * time.Second, nil
}

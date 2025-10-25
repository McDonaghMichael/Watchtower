package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"runtime"
	"time"

	"github.com/shirou/gopsutil/v3/disk"
	"github.com/shirou/gopsutil/v3/net"
)

type Metrics struct {
	ID                int    `json:"id"`
	IPAddress         string `json:"ip_address"`
	NumOfCPU          int    `json:"num_of_cpu"`
	MemoryAllocated   int    `json:"memory_allocated"`
	MemoryAllocations int    `json:"memory_allocations"`
	DiskUsageTotal    uint64 `json:"disk_usage_total"`
	DiskUsageUsed     uint64 `json:"disk_usage_used"`
	DiskUsageFree     uint64 `json:"disk_usage_free"`
	SSHConnections    int    `json:"ssh_connections"`
	HTTPConnections   int    `json:"http_connections"`
	HTTPSConnections  int    `json:"https_connections"`
}

func main() {

	serverIP := os.Getenv("SERVER_URL")

	if serverIP == "" {
		serverIP = "http://localhost:8080"
	}

	var routeIP string = serverIP + "/api/v1/metric"

	ipAddress := "80.209.228.5"

	for {
		var mem runtime.MemStats
		runtime.ReadMemStats(&mem)

		var numOfCPU int = runtime.NumCPU()
		var totalMemoryAllocated uint64 = mem.Alloc
		var totalMemoryAllocations uint64 = mem.Mallocs

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

		jsonString := fmt.Sprintf(`{"ip_address": "%s", "num_of_cpu": %v, "memory_allocated": %v, "memory_allocations": %v, "disk_usage_total": %v, "disk_usage_used": %v, "disk_usage_free": %v, "ssh_connections": %v, "http_connections": %v, "https_connections": %v}`,
			ipAddress, numOfCPU, totalMemoryAllocated, totalMemoryAllocations, usage.Total, usage.Used, usage.Free, sshConnections, httpConnections, httpsConnections)
		body := []byte(jsonString)

		r, err := http.NewRequest("POST", routeIP, bytes.NewBuffer(body))

		if err != nil {
			panic(err)
		}

		r.Header.Add("Content-Type", "application/json")

		client := &http.Client{}
		res, err := client.Do(r)
		if err != nil {
			panic(err)
		}

		post := &Metrics{}
		derr := json.NewDecoder(res.Body).Decode(post)
		if derr != nil {
			panic(derr)
		}

		if res.StatusCode != http.StatusCreated {
			panic(res.Status)
		}

		fmt.Println("Id:", post.ID)
		fmt.Println("IP:", post.IPAddress)
		fmt.Println("Num Of CPU:", post.NumOfCPU)
		fmt.Println("Memory Allocated:", post.MemoryAllocated)
		fmt.Println("Memory Allocations:", post.MemoryAllocations)

		time.Sleep(time.Second * 5)
	}

}

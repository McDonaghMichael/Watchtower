package models

import "time"

type Metrics struct {
	ID                 int       `json:"id"`
	ServerID           int       `json:"server_id"`
	NumOfCPU           int       `json:"num_of_cpu"`
	CPUUsage           float64   `json:"cpu_usage"`
	MemoryAllocated    int       `json:"memory_allocated"`
	MemoryAllocations  int       `json:"memory_allocations"`
	MemoryUsagePercent float64   `json:"memory_usage_percent"`
	SwapUsed           int64     `json:"swap_used"`
	SwapTotal          int64     `json:"swap_total"`
	SwapFree           int64     `json:"swap_free"`
	CacheMemory        int64     `json:"cache_memory"`
	BufferMemory       int64     `json:"buffer_memory"`
	DiskUsageTotal     uint64    `json:"disk_usage_total"`
	DiskUsageUsed      uint64    `json:"disk_usage_used"`
	DiskUsageFree      uint64    `json:"disk_usage_free"`
	SSHConnections     int       `json:"ssh_connections"`
	HTTPConnections    int       `json:"http_connections"`
	HTTPSConnections   int       `json:"https_connections"`
	Connections        int       `json:"connections"`
	UptimeSeconds      int64     `json:"uptime_seconds"`
	Timestamp          time.Time `json:"timestamp"`
}

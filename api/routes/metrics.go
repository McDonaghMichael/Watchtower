package routes

type Statistics struct {
	ID                int    `json:"id"`
	IPAddress         string `json:"ip_address`
	NumOfCPU          int    `json:"num_of_cpu"`
	MemoryAllocated   int    `json:"memory_allocated"`
	MemoryAllocations int    `json:"memory_allocations"`
}

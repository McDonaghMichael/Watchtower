package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"runtime"
)

type Metrics struct {
	ID                int    `json:"id"`
	IPAddress         string `json:"ip_address"`
	NumOfCPU          int    `json:"num_of_cpu"`
	MemoryAllocated   int    `json:"memory_allocated"`
	MemoryAllocations int    `json:"memory_allocations"`
}

func main() {

	var mem runtime.MemStats
	runtime.ReadMemStats(&mem)

	var numOfCPU int = runtime.NumCPU()
	var totalMemoryAllocated uint64 = mem.Alloc
	var totalMemoryAllocations uint64 = mem.Mallocs

	var routeIP string = "http://localhost:8080/api/v1/metric"
	ipAddress := "80.209.228.5"
	jsonString := fmt.Sprintf(`{"ip_address": "%s", "num_of_cpu": %v, "memory_allocated": %v, "memory_allocations": %v}`,
		ipAddress, numOfCPU, totalMemoryAllocated, totalMemoryAllocations)
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

	defer res.Body.Close()

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
	fmt.Println("Mmeory Allocations:", post.MemoryAllocations)
}

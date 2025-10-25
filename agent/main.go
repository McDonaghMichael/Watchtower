package main

import (
	"fmt"
	"runtime"
)

func main() {

	var mem runtime.MemStats
	runtime.ReadMemStats(&mem)

	var numOfCPU int = runtime.NumCPU()
	var totalMemoryAllocated uint64 = mem.TotalAlloc
	var totalMemoryAllocations uint64 = mem.Mallocs

	fmt.Println(numOfCPU)
	fmt.Println(totalMemoryAllocated)
	fmt.Println(totalMemoryAllocations)
}

import requests

def get_metric_training_data():
    data = requests.get("http://localhost:8080/api/v1/metrics/server/10?limit=10000")
    jsonData = data.json()

    dataArray = []

    for x in jsonData:
        dataObj = {
            "id": x["id"],
            "num_of_cpu": x["num_of_cpu"],
            "cpu_usage": x["cpu_usage"],
            "memory_allocated": x["memory_allocated"],
            "memory_allocations": x["memory_allocations"],
            "memory_usage_percent": x["memory_usage_percent"],
            "disk_usage_total": x["disk_usage_total"],
            "disk_usage_used": x["disk_usage_used"],
            "disk_usage_free": x["disk_usage_free"],
            "swap_total": x["swap_total"],
            "swap_free": x["swap_free"],
            "swap_used": x["swap_used"],
            "cache_memory": x["cache_memory"],
            "buffer_memory": x["buffer_memory"],
            "ssh_connections": x["ssh_connections"],
            "http_connections": x["http_connections"],
            "https_connections": x["https_connections"],
            "timestamp": x["timestamp"],
        }

        dataArray.append(dataObj)
    
    return dataArray
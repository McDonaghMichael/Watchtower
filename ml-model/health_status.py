import requests


def get_health_status_timestamps():
    limit = 100
    data = requests.get("http://localhost:8080/api/v1/health/server/10?limit=1000")
    jsonData = data.json()

    timestamps = []

    # Loop through each health status
    for index in range(1, len(jsonData)):


        # If the status is offline
        if jsonData[index]["status"] == 0:

            
         
            # Only proceed if the previous index is offline as we will be backtracking from only
            # the point in which the server is offline
            previous_index = index + 1
            
            
            if previous_index > 0:

                # Store the timestamp of when the server went from online to offline
                if jsonData[previous_index]["status"] == 1:
                    print("\n\n",jsonData[index]["id"])
                    print(jsonData[index + 1]["status"])
                   
                    timestamps.append({"id": jsonData[index]["id"], "status": jsonData[index]["status"],"timestamp": jsonData[index]["timestamp"] })

    print(timestamps)

    return timestamps
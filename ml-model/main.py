import pandas as pd
import torch
import torch.nn as nn
import sklearn
import openpyxl
from sklearn.preprocessing import StandardScaler
from datetime import datetime
import metric_training_data
import health_status

from datetime import datetime, timezone

def get_metric_training_data():
    health_status_timestamps = health_status.get_health_status_timestamps()
    metric_data = metric_training_data.get_metric_training_data()

    # Sort both arrays by timestamp with proper timezone-aware parsing
    health_status_timestamps.sort(key=lambda x: datetime.fromisoformat(x["timestamp"].replace('Z', '+00:00')))
    metric_data.sort(key=lambda x: datetime.fromisoformat(x["timestamp"].replace('Z', '+00:00')))

    # Convert to timezone-aware datetime objects
    health_times = [datetime.fromisoformat(hs["timestamp"].replace('Z', '+00:00')) for hs in health_status_timestamps]
    metric_times = [datetime.fromisoformat(m["timestamp"].replace('Z', '+00:00')) for m in metric_data]

    results = []

    metrics_to_train = []

    for i, health_time in enumerate(health_times):
        # Define the time window for this health check (make start_time timezone-aware)
        if i == 0:
            # Use the earliest metric time or a very early timezone-aware datetime
            start_time = metric_times[0].replace(tzinfo=timezone.utc) if metric_times else datetime.min.replace(tzinfo=timezone.utc)
        else:
            start_time = health_times[i-1]
        
        # Find metrics that fall in this specific window
        metrics_in_window = [
            metric_data[j] for j, metric_time in enumerate(metric_times)
            if start_time <= metric_time < health_time
        ]
        
        results.append({
            'health_check_index': i,
            'health_check_time': health_time,
            'health_check_data': health_status_timestamps[i],
            'metrics_count': len(metrics_in_window),
            'metrics': metrics_in_window,
            'time_window_start': start_time,
            'time_window_end': health_time
        })
        
        print(f"Health check {i} at {health_time}: {len(metrics_in_window)} metrics")
        print(f"  Time window: {start_time} to {health_time}")

    # Process each health check's metrics independently
    for result in results:
        print(f"\n--- Processing health check {result['health_check_index']} ---")
        print(f"Health status: {result['health_check_data']['status']} at {result['health_check_time']}")
        print(f"Metrics found: {result['metrics_count']}")
        
        for metric in result['metrics']:
            metrics_to_train.append(metric)
    return metrics_to_train

print(get_metric_training_data()[0])
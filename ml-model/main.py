import pandas as pd
import torch
import torch.nn as nn
import sklearn
import openpyxl
from sklearn.preprocessing import StandardScaler

import requests

def get_metric_training_data():
    data = requests.get("http://80.208.227.58:8080/api/v1/metrics/server/2")
    jsonData = data.json()

    dataArray = []

    for x in jsonData:
        dataObj = {
            "id": x["id"],
            "num_of_cpu": x["num_of_cpu"],
            "memory_allocated": x["memory_allocated"],
            "memory_allocations": x["memory_allocations"],
            "disk_usage_total": x["disk_usage_total"],
            "disk_usage_used": x["disk_usage_used"],
            "disk_usage_free": x["disk_usage_free"],
            "ssh_connections": x["ssh_connections"],
            "http_connections": x["http_connections"],
            "https_connections": x["https_connections"],
        }

        dataArray.append(dataObj)
    
    return dataArray

df = pd.DataFrame(get_metric_training_data())

input_values = ['memory_allocated', 'memory_allocations']
output_values= ['memory_allocated', 'memory_allocations', 'disk_usage_total','disk_usage_used','disk_usage_free']

x = df[input_values].values
y = df[output_values].values

x_scaler = StandardScaler()
y_scaler = StandardScaler()
x_scaled = x_scaler.fit_transform(x)
y_scaled = y_scaler.fit_transform(y)

x_tensor = torch.tensor(x_scaled, dtype=torch.float32)
y_tensor = torch.tensor(y_scaled, dtype=torch.float32)

model = nn.Sequential(
    nn.Linear(2,4),
    nn.ReLU(),
    nn.Linear(4,5)
)

# Using the Mean Squared Error Loss function for regression tasks
criterion = nn.MSELoss()  
optimizer = torch.optim.SGD(model.parameters(), lr=0.01)

for epoch in range(2000):
    optimizer.zero_grad()
    y_pred = model(x_tensor)
    loss = criterion(y_pred, y_tensor)
    loss.backward()
    optimizer.step()

    if (epoch + 1) % 100 == 0:
        print(f'Epoch {epoch+1}, Loss: {loss.item():.4f}')

test_input = torch.tensor([[730288, 1008803]], dtype=torch.float32)
test_scaled = torch.tensor(x_scaler.transform([[730288, 1008803]]), dtype=torch.float32)
pred = model(test_scaled)
predictions = y_scaler.inverse_transform(pred.detach().numpy())

print("=== OUTCOME FROM TRAINING MODEL ===")
print("\n-> MEMORY")
print(f"Memory Allocated: {predictions[0][0]}")
print(f"Mmeory Allocations: {predictions[0][1]}")

print("\n-> DISK")
print(f"Disk Total: {predictions[0][2]}")
print(f"Disk Used: {predictions[0][3]}")
print(f"Disk Free: {predictions[0][4]}")

print("\n=== OUTCOME FROM TRAINING MODEL ===\n\n")





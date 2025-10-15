import pandas as pd
import torch
import torch.nn as nn
import sklearn
import openpyxl
from sklearn.preprocessing import StandardScaler

# Open up and load the data from the excel file, in the future this will be training from data from the database!!!
df = pd.read_excel('data.xlsx')

input_values = ['memory_usage', 'disk_usage']
output_values= ['cpu_usage', 'disk_usage']

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
    nn.Linear(4,2)
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

test_input = torch.tensor([[60.0, 20.5]], dtype=torch.float32)
test_scaled = torch.tensor(x_scaler.transform([[60.0, 20.5]]), dtype=torch.float32)
pred = model(test_scaled)
predictions = y_scaler.inverse_transform(pred.detach().numpy())


print("Predicted CPU usage for memory_usage=60:")
print(f"Predicted CPU usage: {predictions[0][0]:.2f}%")
print(f"Predicted Disk usage: {predictions[0][1]:.2f}%")

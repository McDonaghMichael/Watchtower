import pandas as pd
import torch
import torch.nn as nn
import sklearn
import openpyxl
print(openpyxl.__version__)


from sklearn.preprocessing import StandardScaler

df = pd.read_excel('data.xlsx')

x = df[['memory_usage']].values

y = df[['cpu_usage']].values.reshape(-1, 1)

scaler = StandardScaler()
x_scaled = scaler.fit_transform(x)


x_tensor = torch.tensor(x_scaled, dtype=torch.float32)
y_tensor = torch.tensor(y, dtype=torch.float32)


model = nn.Sequential(
    nn.Linear(1, 1),
)

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

test_memory_usage = torch.tensor([[60.0]], dtype=torch.float32)
test_memory_usage_scaled = torch.tensor(scaler.transform([[60.0]]), dtype=torch.float32)
pred_cpu = model(test_memory_usage_scaled)
print("Predicted CPU usage for memory_usage=60:", pred_cpu.item())

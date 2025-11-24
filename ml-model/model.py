import pandas as pd
import torch
import torch.nn as nn
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
import main
from sklearn.metrics import mean_absolute_error, r2_score
import torch.onnx

df = pd.DataFrame(main.get_metric_training_data())

input_values = [
    'num_of_cpu', 'cpu_usage', 'memory_allocated', 'memory_allocations', 
    'memory_usage_percent', 'disk_usage_total', 'disk_usage_used', 
    'disk_usage_free', 'swap_total', 'swap_free', 'swap_used', 
    'cache_memory', 'buffer_memory', 'ssh_connections', 'http_connections', 
    'https_connections'
]

output_values = ['memory_allocated', 'memory_allocations', 'disk_usage_total', 'disk_usage_used', 'disk_usage_free']

x = df[input_values].values
y = df[output_values].values

print(f"Input shape: {x.shape}") 
print(f"Output shape: {y.shape}")


x_train, x_test, y_train, y_test = train_test_split(x, y, test_size=0.2, random_state=42)


x_scaler = StandardScaler()
y_scaler = StandardScaler()
x_train_scaled = x_scaler.fit_transform(x_train)
y_train_scaled = y_scaler.fit_transform(y_train)
x_test_scaled = x_scaler.transform(x_test)
y_test_scaled = y_scaler.transform(y_test)


x_train_tensor = torch.tensor(x_train_scaled, dtype=torch.float32)
y_train_tensor = torch.tensor(y_train_scaled, dtype=torch.float32)
x_test_tensor = torch.tensor(x_test_scaled, dtype=torch.float32)
y_test_tensor = torch.tensor(y_test_scaled, dtype=torch.float32)


model = nn.Sequential(
    nn.Linear(16, 64),
    nn.ReLU(),
    nn.Linear(64, 32),
    nn.ReLU(),
    nn.Linear(32, 5) 
)

print(f"Model architecture: {model}")

criterion = nn.MSELoss()  
optimizer = torch.optim.Adam(model.parameters(), lr=0.001)


for epoch in range(2000):
    model.train()
    optimizer.zero_grad()
    y_pred = model(x_train_tensor)
    loss = criterion(y_pred, y_train_tensor)
    loss.backward()
    optimizer.step()

    if (epoch + 1) % 100 == 0:
        print(f'Epoch {epoch+1}, Loss: {loss.item():.4f}')


print("\n" + "="*50)
print("MODEL TESTING RESULTS")
print("="*50)


model.eval()
with torch.no_grad():
    test_pred_scaled = model(x_test_tensor)
    test_pred = y_scaler.inverse_transform(test_pred_scaled.numpy())
    test_actual = y_scaler.inverse_transform(y_test_scaled)
    
    test_loss = criterion(test_pred_scaled, y_test_tensor)
    print(f"Test Loss: {test_loss.item():.4f}")


print("\n--- SINGLE PREDICTION EXAMPLE ---")
sample_idx = 0
sample_input = x_test[sample_idx].reshape(1, -1)
sample_actual = y_test[sample_idx]

sample_input_scaled = x_scaler.transform(sample_input)
sample_input_tensor = torch.tensor(sample_input_scaled, dtype=torch.float32)

with torch.no_grad():
    prediction_scaled = model(sample_input_tensor)
    prediction = y_scaler.inverse_transform(prediction_scaled.numpy())

print("Input features:")
for i, feature in enumerate(input_values):
    print(f"  {feature}: {sample_input[0][i]}")

print("\nACTUAL vs PREDICTED:")
print(f"{'Metric':<20} {'Actual':<15} {'Predicted':<15} {'Error':<10}")
print("-" * 60)
for i, metric in enumerate(output_values):
    actual = sample_actual[i]
    pred = prediction[0][i]
    error = abs(actual - pred)
    print(f"{metric:<20} {actual:<15.2f} {pred:<15.2f} {error:<10.2f}")

custom_input = np.array([[ 
    12,                  
    4,                   
    14828118016,        
    50288087040,         
    26.43,               
    166848364544,        
    111357399040,         
    53827334144,          
    8589930496,          
    8589930496,          
    0,                    
    18431418368,          
    18952192,             
    0,                    
    0,                    
    0                     
]])

custom_input_scaled = x_scaler.transform(custom_input)
custom_input_tensor = torch.tensor(custom_input_scaled, dtype=torch.float32)

with torch.no_grad():
    custom_pred_scaled = model(custom_input_tensor)
    custom_pred = y_scaler.inverse_transform(custom_pred_scaled.numpy())

print("\n-> MEMORY")
print(f"Memory Allocated: {custom_pred[0][0]:.2f} (input: {custom_input[0][2]})")
print(f"Memory Allocations: {custom_pred[0][1]:.2f} (input: {custom_input[0][3]})")

print("\n-> DISK")
print(f"Disk Total: {custom_pred[0][2]:.2f} (input: {custom_input[0][5]})")
print(f"Disk Used: {custom_pred[0][3]:.2f} (input: {custom_input[0][6]})")
print(f"Disk Free: {custom_pred[0][4]:.2f} (input: {custom_input[0][7]})")

with torch.no_grad():
    all_pred_scaled = model(x_test_tensor)
    all_pred = y_scaler.inverse_transform(all_pred_scaled.numpy())

mae = mean_absolute_error(y_test, all_pred)
r2 = r2_score(y_test, all_pred)

print(f"\n=== MODEL PERFORMANCE ===")
print(f"Mean Absolute Error: {mae:.2f}")
print(f"R² Score: {r2:.4f}")


model.eval()

batch_size = 1
dummy_input = torch.randn(batch_size, 16, dtype=torch.float32)

# Export to ONNX
onnx_path = "server_metrics_model.onnx"

torch.onnx.export(
    model,                    # Your trained model
    dummy_input,              # Dummy input for tracing
    onnx_path,               # Output file path
    export_params=True,      # Store trained parameters
    opset_version=14,        # ONNX opset version
    do_constant_folding=True, # Optimize constants
    input_names=['input'],   # Input name
    output_names=['output'], # Output name
    dynamic_axes={           # Dynamic axes for variable batch size
        'input': {0: 'batch_size'},
        'output': {0: 'batch_size'}
    }
)
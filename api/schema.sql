CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(20),
  description VARCHAR(100),
  administrator INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS servers (
  id SERIAL PRIMARY KEY,
  server_name VARCHAR(100) NOT NULL,
  ip_address VARCHAR(15) UNIQUE NOT NULL,
  ssh_username VARCHAR(50) NOT NULL,
  ssh_private_key TEXT NOT NULL,
  ssh_port INT DEFAULT 22,
  operating_system VARCHAR(50),
  environment VARCHAR(20) CHECK (environment IN ('production', 'staging', 'development', 'testing')),
  location VARCHAR(50),
  description TEXT,
  monitoring_interval INT DEFAULT 5,
  cpu_threshold INT DEFAULT 90,
  memory_threshold INT DEFAULT 90,
  disk_threshold INT DEFAULT 90,
  status VARCHAR(20) DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'warning')),
  last_ping TIMESTAMP,
  message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS metrics (
  id SERIAL PRIMARY KEY,
  server_id INT REFERENCES servers(id) ON DELETE CASCADE,
  num_of_cpu INT,
  cpu_usage FLOAT,                 
  memory_allocated BIGINT,
  memory_allocations BIGINT,
  memory_usage_percent FLOAT, 
  swap_used BIGINT,              
  swap_total BIGINT,          
  swap_free BIGINT,           
  cache_memory BIGINT,           
  buffer_memory BIGINT,
  disk_usage_total BIGINT,
  disk_usage_used BIGINT,
  disk_usage_free BIGINT,
  ssh_connections INT,
  http_connections INT,
  https_connections INT,
  uptime_seconds BIGINT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS health_status (
  id SERIAL PRIMARY KEY,
  server_id INT REFERENCES servers(id) ON DELETE CASCADE,
  status INT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS groups (
    group_id SERIAL PRIMARY KEY,
    server_id INT NOT NULL REFERENCES servers(id) ON DELETE CASCADE
);


CREATE TABLE IF NOT EXISTS conditions (
    condition_id SERIAL PRIMARY KEY,
    group_id INT NOT NULL REFERENCES groups(group_id) ON DELETE CASCADE,
    metric VARCHAR(255),
    operator VARCHAR(3) CHECK (operator IN ('>', '<', '>=', '<=', '=', '!=')),
    value DECIMAL(10,2)
);

CREATE TABLE IF NOT EXISTS actions (
    action_id SERIAL PRIMARY KEY,
    group_id INT NOT NULL REFERENCES groups(group_id) ON DELETE CASCADE,
    action VARCHAR(255),
    value VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS metrics_used_for_condtionals (
  id SERIAL PRIMARY KEY,
  condition_id SERIAL NOT NULL REFERENCES conditions(condition_id) ON DELETE CASCADE,
  metric_id SERIAL NOT NULL REFERENCES metrics(id) ON DELETE CASCADE
)
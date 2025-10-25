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
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS metrics (
  id SERIAL PRIMARY KEY,
  ip_address VARCHAR(15) REFERENCES servers(ip_address) ON DELETE CASCADE,
  num_of_cpu INT,
  memory_allocated INT,
  memory_allocations INT,
  disk_usage_total BIGINT,
  disk_usage_used BIGINT,
  disk_usage_free BIGINT,
  ssh_connections INT,
  http_connections INT,
  https_connections INT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
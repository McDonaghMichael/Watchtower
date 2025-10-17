CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(20),
  description VARCHAR(100),
  administrator INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS servers (
  id SERIAL PRIMARY KEY,
  server_name VARCHAR(100) NOT NULL,
  ip_address VARCHAR(15) NOT NULL,
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

CREATE TABLE IF NOT EXISTS server_metrics (
  id SERIAL PRIMARY KEY,
  server_id INT REFERENCES servers(id) ON DELETE CASCADE,
  cpu_usage FLOAT,
  memory_usage FLOAT,
  disk_usage FLOAT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS server_events (
  id SERIAL PRIMARY KEY,
  server_id INT REFERENCES servers(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  description TEXT,
  severity VARCHAR(20) CHECK (severity IN ('info', 'warning', 'critical')),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(20) UNIQUE NOT NULL,
  description VARCHAR(100),
  administrator INT DEFAULT 0,
  color VARCHAR(7) DEFAULT '#10a37f'
);

-- Ensure unique constraint exists even if the table was created before the UNIQUE change
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'roles_name_key'
    ) THEN
        ALTER TABLE roles ADD CONSTRAINT roles_name_key UNIQUE (name);
    END IF;
END$$;

ALTER TABLE roles ADD COLUMN IF NOT EXISTS color VARCHAR(7) DEFAULT '#10a37f';
UPDATE roles SET color = COALESCE(color, '#10a37f');

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  department VARCHAR(100),
  phone VARCHAR(50),
  is_active BOOLEAN DEFAULT TRUE,
  permissions TEXT,
  avatar_url TEXT,
  profile_color VARCHAR(7),
  role_id INT REFERENCES roles(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
ALTER TABLE servers ADD COLUMN IF NOT EXISTS agent_token VARCHAR(64);

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
);

-- Seed base roles
INSERT INTO roles (name, description, administrator)
VALUES
  ('admin', 'Full administrative access', 1),
  ('user', 'Standard user', 0),
  ('operator', 'Manage servers and events', 0),
  ('viewer', 'Read-only access', 0)
ON CONFLICT (name) DO NOTHING;

-- Permissions and role mapping
CREATE TABLE IF NOT EXISTS permissions (
  id SERIAL PRIMARY KEY,
  key VARCHAR(50) UNIQUE NOT NULL,
  description VARCHAR(150) NOT NULL
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id INT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id INT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- Seed baseline permissions
INSERT INTO permissions (key, description) VALUES
  ('manage_roles', 'Create, update, delete roles'),
  ('manage_accounts', 'Create, update, delete accounts'),
  ('manage_servers', 'Create, update, delete servers'),
  ('manage_events', 'Create, update, delete server events/actions'),
  ('view_audit_logs', 'View audit logs'),
  ('backup_read', 'View and download backups'),
  ('backup_write', 'Create and manage backups'),
  ('backup_schedule', 'Manage automatic backup schedules'),
  ('manage_sessions', 'View and revoke active sessions'),
  ('support_manage', 'Respond to and manage support tickets')
ON CONFLICT (key) DO NOTHING;

-- Grant all permissions to admin
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'admin'
ON CONFLICT DO NOTHING;

-- Default permissions for operator
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.key IN ('manage_servers','manage_events')
WHERE r.name = 'operator'
ON CONFLICT DO NOTHING;

-- Default permissions for viewer
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.key IN ('view_audit_logs')
WHERE r.name = 'viewer'
ON CONFLICT DO NOTHING;

-- Audit logging table
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  resource VARCHAR(100),
  resource_id INT,
  metadata JSONB,
  ip_address VARCHAR(64),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Backup tracking
CREATE TABLE IF NOT EXISTS backups (
  id SERIAL PRIMARY KEY,
  filename TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS backup_config (
  id INT PRIMARY KEY DEFAULT 1,
  enabled BOOLEAN DEFAULT FALSE,
  interval_minutes INT DEFAULT 1440,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO backup_config (id, enabled, interval_minutes)
VALUES (1, FALSE, 1440)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE backup_config ADD COLUMN IF NOT EXISTS interval_ms BIGINT DEFAULT 86400000;
ALTER TABLE backup_config ADD COLUMN IF NOT EXISTS backup_location TEXT DEFAULT './backups';

CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  ip_address VARCHAR(64),
  user_agent TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tickets (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'open',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ticket_messages (
  id SERIAL PRIMARY KEY,
  ticket_id INT REFERENCES tickets(id) ON DELETE CASCADE,
  user_id INT REFERENCES users(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

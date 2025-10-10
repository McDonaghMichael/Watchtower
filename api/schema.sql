CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(20),
  description VARCHAR(100),
  administrator INT DEFAULT 0
);
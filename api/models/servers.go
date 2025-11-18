package models

import "time"

type Server struct {
	ID              int        `json:"id"`
	ServerName      string     `json:"server_name"`
	IPAddress       string     `json:"ip_address"`
	SSHUsername     string     `json:"ssh_username"`
	SSHPrivateKey   string     `json:"ssh_private_key,omitempty"`
	SSHPort         int        `json:"ssh_port"`
	OperatingSystem string     `json:"operating_system"`
	Environment     string     `json:"environment"`
	Location        string     `json:"location"`
	Description     string     `json:"description"`
	Status          string     `json:"status"`
	LastPing        *time.Time `json:"last_ping"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`
	Message         *string    `json:"message"`
}

package models

import "time"

type User struct {
	ID           int       `json:"id"`
	Email        string    `json:"email"`
	Username     string    `json:"username"`
	FirstName    string    `json:"first_name"`
	LastName     string    `json:"last_name"`
	Department   string    `json:"department"`
	Phone        string    `json:"phone"`
	IsActive     bool      `json:"is_active"`
	Permissions  string    `json:"permissions"`
	AvatarURL    string    `json:"avatar_url"`
	ProfileColor string    `json:"profile_color"`
	RoleID       int       `json:"role_id"`
	RoleName     string    `json:"role"`
	RoleColor    string    `json:"role_color"`
	RolePerms    []string  `json:"role_permissions"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
	PasswordHash string    `json:"-"`
}

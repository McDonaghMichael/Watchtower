package models

type Permission struct {
	ID          int    `json:"id"`
	Key         string `json:"key"`
	Description string `json:"description"`
}

type Role struct {
	ID            int      `json:"id"`
	Name          string   `json:"name"`
	Description   string   `json:"description"`
	Administrator bool     `json:"administrator"`
	Color         string   `json:"color"`
	Permissions   []string `json:"permissions"`
}

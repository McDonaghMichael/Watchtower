package database

import (
	"context"
	"fmt"
	"os"
	"strings"
	"watchtower/api/utils"
)

// FirstRunSetup checks if any users exist. If not, it prompts to create the
// initial admin account directly in the database.
func FirstRunSetup() {
	ctx := context.Background()

	var count int
	if err := Pool.QueryRow(ctx, "SELECT COUNT(*) FROM users").Scan(&count); err != nil {
		utils.GetConsole().PrintError("Failed to check users: %v", err)
		return
	}
	if count > 0 {
		return
	}

	utils.GetConsole().PrintWarning("No admin account found — running first-time setup.")
	fmt.Println()

	var email, username, pw string

	if e := os.Getenv("ADMIN_EMAIL"); e != "" {
		email = e
		if u := os.Getenv("ADMIN_USERNAME"); u != "" {
			username = u
		} else {
			username = strings.Split(email, "@")[0]
		}
		pw = os.Getenv("ADMIN_PASSWORD")
		if pw == "" {
			utils.GetConsole().PrintError("ADMIN_EMAIL set but ADMIN_PASSWORD is missing.")
			os.Exit(1)
		}
		utils.GetConsole().PrintSecondary("Creating admin account from environment variables.")
	} else {
		email = promptConfig("Admin email", "")
		defaultUsername := strings.Split(email, "@")[0]
		username = promptConfig("Admin username", defaultUsername)

		fmt.Print("Admin password: ")
		pw, _ = readPassword()
		fmt.Println()
		fmt.Print("Confirm password: ")
		pw2, _ := readPassword()
		fmt.Println()

		if pw != pw2 {
			utils.GetConsole().PrintError("Passwords do not match. Cannot continue.")
			os.Exit(1)
		}
	}

	hashed, err := utils.HashPassword(pw)
	if err != nil {
		utils.GetConsole().PrintError("Failed to hash password: %v", err)
		os.Exit(1)
	}

	var roleID int
	err = Pool.QueryRow(ctx, `
		INSERT INTO roles (name, description, administrator, color)
		VALUES ('admin', 'Full administrative access', 1, '#10a37f')
		ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
		RETURNING id`).Scan(&roleID)
	if err != nil {
		utils.GetConsole().PrintError("Failed to resolve admin role: %v", err)
		os.Exit(1)
	}

	_, err = Pool.Exec(ctx, `
		INSERT INTO users (email, username, password_hash, is_active, role_id, created_at, updated_at)
		VALUES ($1, $2, $3, TRUE, $4, NOW(), NOW())`,
		email, username, hashed, roleID)
	if err != nil {
		utils.GetConsole().PrintError("Failed to create admin user: %v", err)
		os.Exit(1)
	}

	utils.GetConsole().PrintSuccess("Admin account created: %s (%s)", username, email)
	fmt.Println()
}

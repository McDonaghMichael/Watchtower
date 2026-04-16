package database

import (
	"bufio"
	"context"
	"database/sql"
	"fmt"
	"io/ioutil"
	"os"
	"strings"
	"watchtower/api/utils"

	"github.com/jackc/pgx/v5/pgxpool"
	_ "modernc.org/sqlite"
	"golang.org/x/term"
)

var Pool *pgxpool.Pool

const configDBPath = "config.db"

// stdinScanner is shared across all interactive prompts so they don't compete.
var stdinScanner = bufio.NewScanner(os.Stdin)

func Connect() {
	utils.GetConsole().PrintSecondary("Connecting to database.")

	host, port, user, password, name := resolveDBConfig()
	utils.SetDBCredentials(host, port, user, password, name)

	connStr := fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=disable",
		user, password, host, port, name)

	var err error
	Pool, err = pgxpool.New(context.Background(), connStr)
	if err != nil {
		utils.GetConsole().PrintError("Unable to connect: %v", err)
		return
	}

	sqlBytes, err := ioutil.ReadFile("schema.sql")
	if err != nil {
		utils.GetConsole().PrintError("Unable to import schema.sql: %v", err)
		return
	}

	_, err = Pool.Exec(context.Background(), string(sqlBytes))
	if err != nil {
		utils.GetConsole().PrintError("Error executing SQL script: %v", err)
		return
	}

	utils.GetConsole().PrintSuccess("Executed schema.sql successfully")
	utils.GetConsole().PrintSuccess("Connected to PostgreSQL!")
}

// resolveDBConfig returns DB credentials, checking in order:
// 1. config.db (persisted config), 2. environment variables, 3. interactive prompt.
func resolveDBConfig() (host, port, user, password, name string) {
	if _, err := os.Stat(configDBPath); err == nil {
		h, p, u, pw, n, err := loadConfig()
		if err == nil && h != "" && u != "" {
			utils.GetConsole().PrintSecondary("Loaded database config from config.db")
			return h, p, u, pw, n
		}
		utils.GetConsole().PrintWarning("config.db found but could not be read: %v", err)
	}

	if h := os.Getenv("DB_HOST"); h != "" {
		utils.GetConsole().PrintSecondary("Loaded database config from environment variables.")
		host = h
		if p := os.Getenv("DB_PORT"); p != "" {
			port = p
		} else {
			port = "5432"
		}
		user = os.Getenv("DB_USER")
		password = os.Getenv("DB_PASSWORD")
		name = os.Getenv("DB_NAME")
		return
	}

	utils.GetConsole().PrintWarning("No config.db found — prompting for database credentials.")
	fmt.Println()

	host = promptConfig("PostgreSQL host", "localhost")
	port = promptConfig("PostgreSQL port", "5432")
	user = promptConfig("PostgreSQL user", "")
	fmt.Print("PostgreSQL password: ")
	pw, _ := readPassword()
	fmt.Println()
	password = pw
	name = promptConfig("PostgreSQL database name", "watchtower")

	if err := saveConfig(host, port, user, password, name); err != nil {
		utils.GetConsole().PrintWarning("Could not save config.db: %v", err)
	} else {
		utils.GetConsole().PrintSuccess("Database config saved to config.db")
	}
	return
}

func loadConfig() (host, port, user, password, name string, err error) {
	db, err := sql.Open("sqlite", configDBPath)
	if err != nil {
		return
	}
	defer db.Close()

	get := func(key string) string {
		var val string
		db.QueryRow(`SELECT value FROM config WHERE key = ?`, key).Scan(&val)
		return val
	}

	host = get("db_host")
	port = get("db_port")
	user = get("db_user")
	password = get("db_password")
	name = get("db_name")
	return
}

func saveConfig(host, port, user, password, name string) error {
	db, err := sql.Open("sqlite", configDBPath)
	if err != nil {
		return err
	}
	defer db.Close()

	_, err = db.Exec(`CREATE TABLE IF NOT EXISTS config (key TEXT PRIMARY KEY, value TEXT)`)
	if err != nil {
		return err
	}

	entries := map[string]string{
		"db_host":     host,
		"db_port":     port,
		"db_user":     user,
		"db_password": password,
		"db_name":     name,
	}
	for k, v := range entries {
		_, err = db.Exec(
			`INSERT INTO config (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
			k, v,
		)
		if err != nil {
			return err
		}
	}
	return nil
}

// promptConfig prints a prompt and reads a line using bufio.Scanner,
// which correctly handles \r\n, \r, and \n on all platforms.
func promptConfig(label, defaultValue string) string {
	for {
		if defaultValue != "" {
			fmt.Printf("%s [%s]: ", label, defaultValue)
		} else {
			fmt.Printf("%s: ", label)
		}
		stdinScanner.Scan()
		text := strings.TrimSpace(stdinScanner.Text())
		if text == "" {
			if defaultValue != "" {
				return defaultValue
			}
			fmt.Println("Value required.")
			continue
		}
		return text
	}
}

func readPassword() (string, error) {
	pw, err := term.ReadPassword(int(os.Stdin.Fd()))
	return string(pw), err
}

package database

import (
	"context"
	"fmt"
	"io/ioutil"
	"os"
	"watchtower/api/utils"

	"github.com/jackc/pgx/v5/pgxpool"
)

var Pool *pgxpool.Pool

func Connect() {
	utils.GetConsole().PrintSecondary("Connecting to database.")

	dbHost := os.Getenv("DB_HOST")
	if dbHost == "" {
		dbHost = "localhost"
		utils.GetConsole().PrintWarning("DB_HOST is undefined, using localhost instead.")
	}
	dbUser := os.Getenv("DB_USER")
	if dbUser == "" {
		dbUser = "sysadmin"
		utils.GetConsole().PrintWarning("DB_USER is undefined, using sysadmin instead.")
	}
	dbPassword := os.Getenv("DB_PASSWORD")
	if dbPassword == "" {
		dbPassword = "Galway123"
		utils.GetConsole().PrintWarning("DB_PASSWORD is undefined, using Galway123 instead.")
	}
	dbName := os.Getenv("DB_NAME")
	if dbName == "" {
		dbName = "watchtower"
		utils.GetConsole().PrintWarning("DB_NAME is undefined, using watchtower instead.")
	}

	connStr := fmt.Sprintf("postgres://%s:%s@%s:5432/%s?sslmode=disable",
		dbUser, dbPassword, dbHost, dbName)
	err := error(nil)
	Pool, err = pgxpool.New(context.Background(), connStr)
	if err != nil {
		utils.GetConsole().PrintError("Unable to connect: %v", err)
	}

	sqlBytes, err := ioutil.ReadFile("schema.sql")
	if err != nil {
		utils.GetConsole().PrintError("Unable to import schema.sql: %v", err)
	}

	sqlScript := string(sqlBytes)

	_, err = Pool.Exec(context.Background(), sqlScript)
	if err != nil {
		utils.GetConsole().PrintError("Error executing SQL script: %v", err)
		return
	}

	utils.GetConsole().PrintSuccess("Executed schema.sql successfully")

	if err != nil {
		utils.GetConsole().PrintError("Unable to connect: %v", err)
	}
	utils.GetConsole().PrintSuccess("Connected to PostgreSQL!")

}

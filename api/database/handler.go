package database

import (
	"context"
	"fmt"
	"io/ioutil"
	"log"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
)

var Pool *pgxpool.Pool

func Connect() {
	dbHost := os.Getenv("DB_HOST")
	if dbHost == "" {
		dbHost = "localhost"
	}
	dbUser := os.Getenv("DB_USER")
	if dbUser == "" {
		dbUser = "sysadmin"
	}
	dbPassword := os.Getenv("DB_PASSWORD")
	if dbPassword == "" {
		dbPassword = "sysadmin123"
	}
	dbName := os.Getenv("DB_NAME")
	if dbName == "" {
		dbName = "watchtower"
	}

	connStr := fmt.Sprintf("postgres://%s:%s@%s:5432/%s?sslmode=disable",
		dbUser, dbPassword, dbHost, dbName)
	err := error(nil)
	Pool, err = pgxpool.New(context.Background(), connStr)
	if err != nil {
		log.Fatal("Unable to connect:", err)
	}

	sqlBytes, err := ioutil.ReadFile("schema.sql")
	if err != nil {
		panic(err)
	}

	sqlScript := string(sqlBytes)

	_, err = Pool.Exec(context.Background(), sqlScript)
	if err != nil {
		fmt.Println("Error executing SQL script:", err)
		return
	}

	fmt.Println("Database schema and seed data imported successfully!")

	if err != nil {
		fmt.Println(err)
	}

	log.Println("Connected to PostgreSQL!")
}

package database

import (
	"context"
	"fmt"
	"io/ioutil"
	"log"

	"github.com/jackc/pgx/v5/pgxpool"
)

var Pool *pgxpool.Pool

func Connect() {
	connStr := "postgres://sysadmin:sysadmin123@localhost:5432/watchtower?sslmode=disable"
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

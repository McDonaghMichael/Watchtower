package database

import (
	"context"
	"fmt"
	"io/ioutil"
	"log"

	"github.com/jackc/pgx/v5"
)

func Connect() {
	connStr := "postgres://sysadmin:sysadmin123@localhost:5432/watchtower?sslmode=disable"
	conn, err := pgx.Connect(context.Background(), connStr)
	if err != nil {
		log.Fatal("Unable to connect:", err)
	}

	defer conn.Close(context.Background())

	sqlBytes, err := ioutil.ReadFile("schema.sql")
	if err != nil {
		panic(err)
	}

	sqlScript := string(sqlBytes)

	_, err = conn.Exec(context.Background(), sqlScript)
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

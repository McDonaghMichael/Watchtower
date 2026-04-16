package main

import (
	"log"
	"time"
	"watchtower/api/utils"

	"github.com/jackc/pgx/v5/pgxpool"
)

func startBackupScheduler(pool *pgxpool.Pool) {
	if pool == nil {
		return
	}
	go func() {
		for {
			enabled, intervalMs, _, err := utils.GetBackupConfig(pool)
			if err != nil {
				time.Sleep(time.Minute)
				continue
			}
			if !enabled || intervalMs <= 0 {
				time.Sleep(time.Minute * 5)
				continue
			}

			next, err := utils.NextDue(pool)
			if err != nil {
				time.Sleep(time.Minute)
				continue
			}
			if time.Now().After(next) {
				if _, _, err := utils.CreateBackup(pool); err != nil {
					log.Printf("Auto backup failed: %v\n", err)
				} else {
					log.Printf("Auto backup completed at %v\n", time.Now())
				}
			}
			time.Sleep(time.Minute)
		}
	}()
}

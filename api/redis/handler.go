package redis

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"time"
	"watchtower/api/models"
	"watchtower/api/utils"

	"github.com/redis/go-redis/v9"
)

var ctx = context.Background()

var Rdb *redis.Client

func Init() {
	utils.GetConsole().PrintSecondary("Connecting to Redis.")

	host := os.Getenv("REDIS_HOST")
	if host == "" {
		host = "localhost"
		utils.GetConsole().PrintWarning("REDIS_HOST is undefined, using localhost instead.")

	}

	port := os.Getenv("REDIS_PORT")
	if port == "" {
		port = "6379"
		utils.GetConsole().PrintWarning("REDIS_PORT is undefined, using 6379 instead.")

	}

	addr := fmt.Sprintf("%s:%s", host, port)

	Rdb = redis.NewClient(&redis.Options{
		Addr: addr,
	})

	_, err := Rdb.Ping(ctx).Result()
	if err != nil {
		panic(err)
	}

		utils.GetConsole().PrintSuccess("Connected to Redis!")

}

func StoreMetrics(serverID int, metric models.Metrics) {
	key := fmt.Sprintf("server:%d:metrics", serverID)

	jsonData, err := json.Marshal(metric)
	if err != nil {
		fmt.Println("JSON marshal error:", err)
		return
	}

	_, err = Rdb.LPush(ctx, key, jsonData).Result()
	if err != nil {
		fmt.Println("Redis LPUSH error:", err)
		return
	}

	err = Rdb.Expire(ctx, key, 24*time.Hour).Err()
	if err != nil {
		fmt.Println("Redis EXPIRE error:", err)
	}

	vals, _ := Rdb.LRange(ctx, key, 0, -1).Result()
	for i, v := range vals {
		var m models.Metrics
		if err := json.Unmarshal([]byte(v), &m); err != nil {
			fmt.Println("JSON unmarshal error:", err)
			continue
		}
		fmt.Printf("%d: %+v\n", i+1, m)
	}
}

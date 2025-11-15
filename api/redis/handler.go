package redis

import (
	"context"
	"encoding/json"
	"fmt"
	"time"
	"watchtower/api/models"

	"github.com/redis/go-redis/v9"
)

var ctx = context.Background()

var Rdb *redis.Client

func Init() {
	Rdb = redis.NewClient(&redis.Options{
		Addr: "localhost:6379",
	})
	_, err := Rdb.Ping(ctx).Result()
	if err != nil {
		panic(err)
	}
	fmt.Println("Connected to Redis!")
}

func ExampleClient() {

	Rdb.LPush(ctx, "test", "t1", time.Hour*1).Err()

	val, err := Rdb.Get(ctx, "test").Result()

	if err == redis.Nil {
		fmt.Println("key does not exist")
	} else if err != nil {
		fmt.Println("Redis error:", err)
	}

	fmt.Println("Redis val:", val)

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

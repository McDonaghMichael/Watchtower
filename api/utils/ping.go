package utils

import (
	"fmt"
	"net"
	"time"
)

func Ping(host string) ([]byte, error) {
	conn, err := net.DialTimeout("tcp", fmt.Sprintf("%s:22", host), 5*time.Second)
	if err != nil {
		return nil, err
	}
	conn.Close()
	return []byte("ok"), nil
}

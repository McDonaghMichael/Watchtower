package utils

import "os/exec"

func Ping(host string) ([]byte, error) {
	output, err := exec.Command("ping", "-c", "3", host).CombinedOutput()
	return output, err
}

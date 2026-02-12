package main

import (
	"bufio"
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	"golang.org/x/term"
)

type bootstrapResponse struct {
	Token string `json:"token"`
	User  struct {
		ID       int    `json:"id"`
		Email    string `json:"email"`
		Username string `json:"username"`
		Role     string `json:"role"`
	} `json:"user"`
}

func main() {
	reader := bufio.NewReader(os.Stdin)

	apiURL := prompt(reader, "API base URL", "http://localhost:8080/api/v1")
	email := prompt(reader, "Admin email", "")
	username := prompt(reader, "Admin username", defaultUsername(email))
	password := promptPassword("Admin password")
	confirm := promptPassword("Confirm password")

	if password != confirm {
		fmt.Println("Passwords do not match. Aborting.")
		return
	}

	payload, _ := json.Marshal(map[string]string{
		"email":       strings.TrimSpace(email),
		"username":    strings.TrimSpace(username),
		"password":    password,
		"first_name":  "",
		"last_name":   "",
		"department":  "",
		"phone":       "",
		"permissions": "",
	})

	client := &http.Client{Timeout: 15 * time.Second}
	endpoint := strings.TrimRight(apiURL, "/") + "/auth/bootstrap"

	fmt.Printf("\nCreating initial admin at %s ...\n", endpoint)
	resp, err := client.Post(endpoint, "application/json", bytes.NewBuffer(payload))
	if err != nil {
		fmt.Printf("Request failed: %v\n", err)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusForbidden {
		fmt.Println("An admin already exists. Please login instead.")
		return
	}

	if resp.StatusCode != http.StatusCreated {
		var body map[string]interface{}
		if err := json.NewDecoder(resp.Body).Decode(&body); err == nil {
			if msg, ok := body["error"].(string); ok {
				fmt.Printf("Setup failed. Status %d: %s\n", resp.StatusCode, msg)
				return
			}
		}
		fmt.Printf("Setup failed. Status code: %d\n", resp.StatusCode)
		return
	}

	var result bootstrapResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		fmt.Printf("Unable to parse response: %v\n", err)
		return
	}

	fmt.Println("\n✅ Admin bootstrap complete.")
	fmt.Printf("User: %s (%s)\n", result.User.Username, result.User.Email)
	fmt.Println("Keep this token safe for CLI or dashboard login:")
	fmt.Println(result.Token)
}

func prompt(reader *bufio.Reader, label, defaultValue string) string {
	for {
		fmt.Printf("%s", label)
		if defaultValue != "" {
			fmt.Printf(" [%s]", defaultValue)
		}
		fmt.Print(": ")
		text, _ := reader.ReadString('\n')
		text = strings.TrimSpace(text)
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

func promptPassword(label string) string {
	fmt.Printf("%s: ", label)
	bytes, err := term.ReadPassword(int(os.Stdin.Fd()))
	fmt.Println()
	if err != nil {
		fmt.Printf("Error reading password: %v\n", err)
		return ""
	}
	return string(bytes)
}

func defaultUsername(email string) string {
	parts := strings.Split(email, "@")
	if len(parts) > 0 && parts[0] != "" {
		return parts[0]
	}
	return "admin"
}

package authentication

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
	"watchtower/cli/ui/global"

	"github.com/gdamore/tcell/v2"
	"github.com/rivo/tview"
)

var authToken string

func DisplayAuthMenu() {
	box := tview.NewBox().SetBorder(true).
		SetTitle("Watchtower").
		SetBackgroundColor(tcell.Color102)

	list := tview.NewList().
		AddItem("Login", "Gain access to your system account", '>', func() {
			DisplayLoginForm()
		}).
		AddItem("Troubleshooting", "View guides to help resolve account issues", '>', nil).
		SetSelectedTextColor(tcell.Color100).
		SetShortcutColor(tcell.Color102).
		SetSecondaryTextColor(tcell.Color102)

	flex := tview.NewFlex().
		SetDirection(tview.FlexRow).
		AddItem(box, 0, 1, false).
		AddItem(list, 0, 3, true)
	if err := tview.NewApplication().SetRoot(flex, true).Run(); err != nil {
		panic(err)
	}
}

func DisplayInitialSetup() {
	box := tview.NewBox().SetBorder(true).
		SetTitle("Watchtower").
		SetBackgroundColor(tcell.Color102)

	list := tview.NewList().
		AddItem("Register Account Details", "Setup system admin account", '>', nil).
		AddItem("Migrate Database", "Migrate previous database setup to this database", '>', func() {
			DisplayAccountSetup()
		}).
		SetSelectedTextColor(tcell.Color100).
		SetShortcutColor(tcell.Color102).
		SetSecondaryTextColor(tcell.Color102)

	flex := tview.NewFlex().
		SetDirection(tview.FlexRow).
		AddItem(box, 2, 1, false).
		AddItem(list, 0, 4, true)
	if err := tview.NewApplication().SetRoot(flex, true).Run(); err != nil {
		panic(err)
	}
}

func DisplayLoginForm() {
	app := tview.NewApplication()

	apiURL := "http://localhost:8080/api/v1"
	email := ""
	password := ""

	form := tview.NewForm().
		SetFieldBackgroundColor(tcell.ColorDarkGray).
		SetFieldTextColor(tcell.ColorWhite).
		SetLabelColor(tcell.ColorDarkGray).
		SetButtonBackgroundColor(tcell.ColorDarkGray).
		SetButtonStyle(tcell.StyleDefault.Bold(true))

	form.AddInputField("API URL", apiURL, 40, nil, func(text string) { apiURL = text })
	form.AddInputField("Email", email, 40, nil, func(text string) { email = text })
	form.AddPasswordField("Password", password, 40, '*', func(text string) { password = text })
	form.AddButton("Login", func() {
		token, err := loginRequest(apiURL, email, password)
		if err != nil {
			modal := tview.NewModal().
				SetText(fmt.Sprintf("Login failed: %v", err)).
				AddButtons([]string{"Close"}).
				SetBackgroundColor(tcell.Color102).
				SetDoneFunc(func(buttonIndex int, buttonLabel string) {
					app.SetRoot(form, true)
				})
			app.SetRoot(modal, true)
			return
		}
		authToken = token
		modal := tview.NewModal().
			SetText("Login successful. Token stored for this session.").
			AddButtons([]string{"Continue"}).
			SetBackgroundColor(tcell.Color102).
			SetDoneFunc(func(buttonIndex int, buttonLabel string) {
				app.Stop()
				global.DisplayAccountMenu()
			})
		app.SetRoot(modal, true)
	})
	form.AddButton("Cancel", func() { app.Stop() })

	flex := tview.NewFlex().
		SetDirection(tview.FlexRow).
		AddItem(form, 0, 1, true)

	if err := app.EnableMouse(true).SetRoot(flex, true).Run(); err != nil {
		panic(err)
	}
}

func loginRequest(apiURL, email, password string) (string, error) {
	client := &http.Client{Timeout: 10 * time.Second}

	payload, _ := json.Marshal(map[string]string{
		"email":    email,
		"password": password,
	})

	resp, err := client.Post(apiURL+"/auth/login", "application/json", bytes.NewBuffer(payload))
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("status %d", resp.StatusCode)
	}

	var data struct {
		Token string `json:"token"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return "", err
	}

	return data.Token, nil
}

func DisplayAccountSetup() {
	box := tview.NewBox().SetBorder(true).SetTitle("Account Setup").SetBackgroundColor(tcell.Color102)

	form := tview.NewForm().
		AddInputField("Email", "", 20, nil, nil).
		SetFieldBackgroundColor(tcell.ColorDarkGray).
		SetFieldTextColor(tcell.ColorWhite).
		SetLabelColor(tcell.ColorDarkGray).
		AddPasswordField("Password", "", 20, '*', nil).
		AddPasswordField("Confirm Password", "", 20, '*', nil).
		AddButton("SAVE", func() {
			DisplayAuthMenu()
		}).
		SetButtonBackgroundColor(tcell.ColorDarkGray).
		SetButtonStyle(tcell.StyleDefault.Bold(true))

	flex := tview.NewFlex().
		SetDirection(tview.FlexRow).
		AddItem(box, 2, 1, false).
		AddItem(form, 0, 2, true)

	if err := tview.NewApplication().SetRoot(flex, true).EnableMouse(true).Run(); err != nil {
		panic(err)
	}
}

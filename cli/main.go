package main

import (
	"github.com/gdamore/tcell/v2"
	"github.com/rivo/tview"
)

func main() {
	displayInitialSetup()
}

func displayAuthMenu() {
	box := tview.NewBox().SetBorder(true).
		SetTitle("Watchtower").
		SetBackgroundColor(tcell.Color102)

	list := tview.NewList().
		AddItem("Login", "Gain access to you'r system account", '>', nil).
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

func displayInitialSetup() {
	box := tview.NewBox().SetBorder(true).
		SetTitle("Watchtower").
		SetBackgroundColor(tcell.Color102)

	list := tview.NewList().
		AddItem("Register Account Details", "Setup system admin account", '>', nil).
		AddItem("Migrate Database", "Migrate previous database setup to this database", '>', func() {
			displayAccountSetup()
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

func displayAccountSetup() {
	box := tview.NewBox().SetBorder(true).SetTitle("Account Setup").SetBackgroundColor(tcell.Color102)

	form := tview.NewForm().
		AddInputField("Email", "", 20, nil, nil).
		SetFieldBackgroundColor(tcell.ColorDarkGray).
		SetFieldTextColor(tcell.ColorWhite).
		SetLabelColor(tcell.ColorDarkGray).
		AddPasswordField("Password", "", 20, '*', nil).
		AddPasswordField("Confirm Password", "", 20, '*', nil).
		AddButton("SAVE", func() {
			displayAuthMenu()
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

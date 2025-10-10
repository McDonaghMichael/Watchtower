package main

import (
	"watchtower/cli/ui/authentication"

	"github.com/gdamore/tcell/v2"
	"github.com/rivo/tview"
)

func DisplayInitialSetup() {
	box := tview.NewBox().SetBorder(true).
		SetTitle("Watchtower").
		SetBackgroundColor(tcell.Color102)

	list := tview.NewList().
		AddItem("Register Account Details", "Setup system admin account", '>', nil).
		AddItem("Migrate Database", "Migrate previous database setup to this database", '>', func() {
			authentication.DisplayAccountSetup()
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

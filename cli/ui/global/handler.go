package global

import (
	"github.com/gdamore/tcell/v2"
	"github.com/rivo/tview"
)

func DisplayAccountMenu() {
	box := tview.NewBox().SetBorder(true).
		SetTitle("Watchtower").
		SetBackgroundColor(tcell.Color102)

	list := tview.NewList().
		AddItem("Accounts", "Manage accounts associated with the system", '>', nil).
		AddItem("Servers", "Manage servers the server is connected to", '>', nil).
		AddItem("Audit Logs", "View the logs of each action performed on this server and the associated servers", '>', nil).
		AddItem("Records", "View the database data records", '>', nil).
		AddItem("Settings", "Change the main server settings", '>', nil).
		SetSelectedTextColor(tcell.Color100).
		SetShortcutColor(tcell.Color102).
		SetSecondaryTextColor(tcell.Color102)

	flex := tview.NewFlex().
		SetDirection(tview.FlexRow).
		AddItem(box, 0, 1, false).
		AddItem(list, 0, 2, true)
	if err := tview.NewApplication().EnableMouse(true).SetRoot(flex, true).Run(); err != nil {
		panic(err)
	}
}

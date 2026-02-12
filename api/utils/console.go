// utils/console.go
package utils

import (
	"fmt"
	"github.com/fatih/color"
	"sync"
)

var (
	instance *Console
	once     sync.Once
)

type Console struct {
	// Tag colors
	infoTag      *color.Color
	successTag   *color.Color
	warningTag   *color.Color
	errorTag     *color.Color
	secondaryTag *color.Color

	// Message colors
	infoMsg      *color.Color
	successMsg   *color.Color
	warningMsg   *color.Color
	errorMsg     *color.Color
	secondaryMsg *color.Color

	// Additional colors
	lightGray *color.Color
	darkGray  *color.Color
	muted     *color.Color
}

func GetConsole() *Console {
	once.Do(func() {
		instance = &Console{
			// Tag colors (bright/bold for tags)
			infoTag:      color.New(color.FgCyan, color.Bold),
			successTag:   color.New(color.FgGreen, color.Bold),
			warningTag:   color.New(color.FgYellow, color.Bold),
			errorTag:     color.New(color.FgRed, color.Bold),
			secondaryTag: color.New(color.FgHiBlack, color.Bold), // Dim gray tag

			// Message colors
			infoMsg:      color.New(color.FgHiWhite),
			successMsg:   color.New(color.FgHiWhite),
			warningMsg:   color.New(color.FgHiWhite),
			errorMsg:     color.New(color.FgHiRed),
			secondaryMsg: color.New(color.FgHiBlack), // Dim gray message

			// Utility colors
			lightGray: color.New(color.FgHiWhite),
			darkGray:  color.New(color.FgHiBlack),
			muted:     color.New(color.Faint, color.FgHiBlack),
		}
	})
	return instance
}

// Primary logging methods
func (c *Console) PrintInfo(format string, args ...interface{}) {
	message := fmt.Sprintf(format, args...)
	c.infoTag.Printf("[INFO] ")
	c.infoMsg.Printf("%s\n", message)
}

func (c *Console) PrintSuccess(format string, args ...interface{}) {
	message := fmt.Sprintf(format, args...)
	c.successTag.Printf("[SUCCESS] ")
	c.successMsg.Printf("%s\n", message)
}

func (c *Console) PrintWarning(format string, args ...interface{}) {
	message := fmt.Sprintf(format, args...)
	c.warningTag.Printf("[WARNING] ")
	c.warningMsg.Printf("%s\n", message)
}

func (c *Console) PrintError(format string, args ...interface{}) {
	message := fmt.Sprintf(format, args...)
	c.errorTag.Printf("[ERROR] ")
	c.errorMsg.Printf("%s\n", message)
}

// Secondary/utility logging methods
func (c *Console) PrintSecondary(format string, args ...interface{}) {
	message := fmt.Sprintf(format, args...)
	c.secondaryTag.Printf("[SECONDARY] ")
	c.secondaryMsg.Printf("%s\n", message)
}

func (c *Console) PrintDebug(format string, args ...interface{}) {
	message := fmt.Sprintf(format, args...)
	c.secondaryTag.Printf("[DEBUG] ")
	c.secondaryMsg.Printf("%s\n", message)
}

func (c *Console) PrintDetail(format string, args ...interface{}) {
	message := fmt.Sprintf(format, args...)
	c.secondaryTag.Printf("[DETAIL] ")
	c.secondaryMsg.Printf("%s\n", message)
}

// Alternative with just a light gray message (no tag)
func (c *Console) PrintLightGray(format string, args ...interface{}) {
	message := fmt.Sprintf(format, args...)
	c.lightGray.Printf("%s\n", message)
}

func (c *Console) PrintDarkGray(format string, args ...interface{}) {
	message := fmt.Sprintf(format, args...)
	c.darkGray.Printf("%s\n", message)
}

func (c *Console) PrintMuted(format string, args ...interface{}) {
	message := fmt.Sprintf(format, args...)
	c.muted.Printf("%s\n", message)
}

// Shorthand methods (no Print prefix)
func (c *Console) Info(format string, args ...interface{}) {
	c.PrintInfo(format, args...)
}

func (c *Console) Success(format string, args ...interface{}) {
	c.PrintSuccess(format, args...)
}

func (c *Console) Warning(format string, args ...interface{}) {
	c.PrintWarning(format, args...)
}

func (c *Console) Error(format string, args ...interface{}) {
	c.PrintError(format, args...)
}

func (c *Console) Secondary(format string, args ...interface{}) {
	c.PrintSecondary(format, args...)
}

func (c *Console) Debug(format string, args ...interface{}) {
	c.PrintDebug(format, args...)
}

func (c *Console) Detail(format string, args ...interface{}) {
	c.PrintDetail(format, args...)
}

// Global convenience functions (optional - for direct usage without GetConsole())
func PrintInfo(format string, args ...interface{}) {
	GetConsole().PrintInfo(format, args...)
}

func PrintSuccess(format string, args ...interface{}) {
	GetConsole().PrintSuccess(format, args...)
}

func PrintWarning(format string, args ...interface{}) {
	GetConsole().PrintWarning(format, args...)
}

func PrintError(format string, args ...interface{}) {
	GetConsole().PrintError(format, args...)
}

func PrintSecondary(format string, args ...interface{}) {
	GetConsole().PrintSecondary(format, args...)
}

func PrintDebug(format string, args ...interface{}) {
	GetConsole().PrintDebug(format, args...)
}

func PrintLightGray(format string, args ...interface{}) {
	GetConsole().PrintLightGray(format, args...)
}

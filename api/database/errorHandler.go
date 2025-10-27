package database

import (
	"context"
)

func UpdateServerWarningStatus(err error, id int) {
	Pool.Exec(context.Background(),
		"UPDATE servers SET status = $1, message = $2 WHERE id = $3",
		"warning", "SSH connection failed: "+err.Error(), id,
	)
}

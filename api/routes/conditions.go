package routes

import (
	"context"
	"fmt"
	"net/http"
	"watchtower/api/database"

	"github.com/gin-gonic/gin"
)

type Group struct {
	GroupID  int `json:"group_id"`
	ServerID int `json:"server_id"`
}

type Condition struct {
	ConditionID int     `json:"condition_id"`
	GroupID     int     `json:"group_id"`
	Metric      string  `json:"metric"`
	Operator    string  `json:"operator"`
	Value       float64 `json:"value"`
}

type ConditionUpdate struct {
	ConditionID *int   `json:"condition_id"`
	GroupID     int    `json:"group_id"`
	Metric      string `json:"metric"`
	Operator    string `json:"operator"`
	Value       int    `json:"value"`
	Delete      bool   `json:"delete"`
}

type Action struct {
	ActionID int    `json:"action_id"`
	GroupID  int    `json:"group_id"`
	Action   string `json:"action"`
	Value    string `json:"value"`
}

type ActionUpdate struct {
	ActionID int    `json:"action_id"`
	GroupID  int    `json:"group_id"`
	Action   string `json:"action"`
	Value    string `json:"value"`
	Delete   bool   `json:"delete"`
}

func addGroup() gin.HandlerFunc {
	return func(c *gin.Context) {

		var group Group

		if err := c.ShouldBindJSON(&group); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		err := database.Pool.QueryRow(
			context.Background(),
			`INSERT INTO groups (
                server_id
            ) VALUES ($1) RETURNING group_id`,
			group.ServerID,
		).Scan(&group.GroupID)

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusCreated, group)
	}
}

func GetGroupsByServerId() gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")

		var groups []Group

		rows, err := database.Pool.Query(context.Background(),
			`SELECT 
                group_id,
                server_id
             FROM groups
             WHERE server_id = $1`,
			id,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		defer rows.Close()

		for rows.Next() {
			var g Group
			if err := rows.Scan(
				&g.GroupID,
				&g.ServerID,
			); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}

			groups = append(groups, g)
		}

		if len(groups) == 0 {
			c.JSON(http.StatusNotFound, gin.H{})
			return
		}

		c.JSON(http.StatusOK, groups)
	}
}

func GetConditionsByGroupId() gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")

		var conditions []Condition

		rows, err := database.Pool.Query(context.Background(),
			`SELECT group_id, condition_id, metric, operator, value FROM conditions WHERE group_id = $1 `, id,
		)

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		defer rows.Close()

		for rows.Next() {
			var con Condition
			if err := rows.Scan(
				&con.GroupID,
				&con.ConditionID,
				&con.Metric,
				&con.Operator,
				&con.Value,
			); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"errror": err.Error()})
				return
			}

			conditions = append(conditions, con)
		}

		if len(conditions) == 0 {
			c.JSON(http.StatusOK, gin.H{})
			return
		}

		c.JSON(http.StatusOK, conditions)
	}
}

func addCondition() gin.HandlerFunc {
	return func(c *gin.Context) {
		var cond Condition

		if err := c.ShouldBindJSON(&cond); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		err := database.Pool.QueryRow(
			context.Background(),
			`INSERT INTO conditions (group_id, metric, operator, value)
             VALUES ($1, $2, $3, $4)
             RETURNING condition_id`,
			cond.GroupID,
			cond.Metric,
			cond.Operator,
			cond.Value,
		).Scan(&cond.ConditionID)

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusCreated, cond)
	}
}

func GetConditionsByServer() gin.HandlerFunc {
	return func(c *gin.Context) {
		serverID := c.Param("id")

		rows, err := database.Pool.Query(
			context.Background(),
			`
            SELECT cond.condition_id, cond.group_id, cond.metric, cond.operator, cond.value
            FROM conditions cond
            JOIN groups g ON g.group_id = cond.group_id
            WHERE g.server_id = $1
            ORDER BY cond.group_id, cond.condition_id
            `,
			serverID,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		defer rows.Close()

		var conditions []Condition
		for rows.Next() {
			var cond Condition
			if err := rows.Scan(&cond.ConditionID, &cond.GroupID, &cond.Metric, &cond.Operator, &cond.Value); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			conditions = append(conditions, cond)
		}

		c.JSON(http.StatusOK, conditions)
	}
}

func UpdateConditionsByServer() gin.HandlerFunc {
	return func(c *gin.Context) {
		serverID := c.Param("id")

		var conditions []ConditionUpdate
		if err := c.ShouldBindJSON(&conditions); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		tx, err := database.Pool.Begin(context.Background())
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		defer tx.Rollback(context.Background())

		for _, cond := range conditions {
			if cond.ConditionID != nil {
				if cond.Delete {
					// DELETE existing condition
					_, err = tx.Exec(
						context.Background(),
						`DELETE FROM conditions c
                         USING groups g
                         WHERE c.group_id = g.group_id
                           AND g.server_id = $1
                           AND c.condition_id = $2`,
						serverID, *cond.ConditionID,
					)
					if err != nil {
						c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
						return
					}
				} else {
					// UPDATE existing condition
					_, err = tx.Exec(
						context.Background(),
						`UPDATE conditions c
                         SET metric = $1, operator = $2, value = $3
                         FROM groups g
                         WHERE c.group_id = g.group_id
                           AND g.server_id = $4
                           AND c.condition_id = $5`,
						cond.Metric, cond.Operator, cond.Value, serverID, *cond.ConditionID,
					)
					if err != nil {
						c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
						return
					}
				}
			} else if !cond.Delete {
				// INSERT new condition
				_, err = tx.Exec(
					context.Background(),
					`INSERT INTO conditions (group_id, metric, operator, value)
                     SELECT $1, $2, $3, $4
                     WHERE EXISTS (SELECT 1 FROM groups g WHERE g.group_id = $1 AND g.server_id = $5)`,
					cond.GroupID, cond.Metric, cond.Operator, cond.Value, serverID,
				)
				if err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
					return
				}
			}
		}

		if err := tx.Commit(context.Background()); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Conditions upserted/deleted successfully"})
	}
}

func addAction() gin.HandlerFunc {
	return func(c *gin.Context) {
		var action Action

		if err := c.ShouldBindJSON(&action); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		err := database.Pool.QueryRow(
			context.Background(),
			`INSERT INTO actions (group_id, action, value)
             VALUES ($1, $2, $3)
             RETURNING action_id`,
			action.GroupID,
			action.Action,
			action.Value,
		).Scan(&action.ActionID)

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusCreated, action)
	}
}

func GetActionsByGroupId() gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")

		var actions []Action

		rows, err := database.Pool.Query(context.Background(),
			`SELECT group_id, action_id, action, value FROM actions WHERE group_id = $1 `, id,
		)

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		defer rows.Close()

		for rows.Next() {
			var acc Action
			if err := rows.Scan(
				&acc.GroupID,
				&acc.ActionID,
				&acc.Action,
				&acc.Value,
			); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"errror": err.Error()})
				return
			}

			actions = append(actions, acc)
		}

		if len(actions) == 0 {
			c.JSON(http.StatusOK, gin.H{})
			return
		}

		c.JSON(http.StatusOK, actions)
	}
}

func UpdateActionsByServer() gin.HandlerFunc {
	return func(c *gin.Context) {
		serverID := c.Param("id")

		var actions []ActionUpdate
		if err := c.ShouldBindJSON(&actions); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		tx, err := database.Pool.Begin(context.Background())
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		defer tx.Rollback(context.Background())

		for _, act := range actions {
			// DELETE
			if act.ActionID != 0 && act.Delete {
				cmd, err := tx.Exec(
					context.Background(),
					`DELETE FROM actions a
					 USING groups g
					 WHERE a.group_id = g.group_id
					   AND g.server_id = $1
					   AND a.action_id = $2`,
					serverID, act.ActionID,
				)

				if err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
					return
				}

				rows := cmd.RowsAffected()
				fmt.Println("DELETE rows:", rows)
				continue
			}

			// UPDATE
			if act.ActionID != 0 && !act.Delete {
				cmd, err := tx.Exec(
					context.Background(),
					`UPDATE actions a
					 SET action = $1, value = $2
					 FROM groups g
					 WHERE a.group_id = g.group_id
					   AND g.server_id = $3
					   AND a.action_id = $4`,
					act.Action, act.Value, serverID, act.ActionID,
				)

				if err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
					return
				}

				rows := cmd.RowsAffected()
				fmt.Println("UPDATE rows:", rows)
				continue
			}

			// INSERT — must check EXISTS
			if act.ActionID == 0 && !act.Delete {
				cmd, err := tx.Exec(
					context.Background(),
					`INSERT INTO actions (group_id, action, value)
                     SELECT $1, $2, $3
                     WHERE EXISTS (SELECT 1 FROM groups g WHERE g.group_id = $1 AND g.server_id = $4)`,
					act.GroupID, act.Action, act.Value, serverID,
				)

				if err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
					return
				}

				rows := cmd.RowsAffected()
				fmt.Println("INSERT rows:", rows)
			}
		}

		if err := tx.Commit(context.Background()); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Actions upserted/deleted successfully"})
	}
}

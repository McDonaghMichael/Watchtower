package routes

import (
	"net/http"
	"strconv"
	"watchtower/api/database"
	"watchtower/api/models"
	"watchtower/api/utils"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
)

type roleRequest struct {
	Name          string   `json:"name" binding:"required"`
	Description   string   `json:"description"`
	Administrator bool     `json:"administrator"`
	Color         string   `json:"color"`
	Permissions   []string `json:"permissions"`
}

func ListPermissions() gin.HandlerFunc {
	return func(c *gin.Context) {
		rows, err := database.Pool.Query(c, `SELECT id, key, description FROM permissions ORDER BY key ASC`)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list permissions"})
			return
		}
		defer rows.Close()
		var perms []models.Permission
		for rows.Next() {
			var p models.Permission
			if err := rows.Scan(&p.ID, &p.Key, &p.Description); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to read permissions"})
				return
			}
			perms = append(perms, p)
		}
		c.JSON(http.StatusOK, perms)
	}
}

func ListRoles() gin.HandlerFunc {
	return func(c *gin.Context) {
		rows, err := database.Pool.Query(c, `SELECT id, name, description, COALESCE(administrator,0), COALESCE(color, '#10a37f') FROM roles ORDER BY id ASC`)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list roles"})
			return
		}
		defer rows.Close()

		var roles []models.Role
		for rows.Next() {
			var r models.Role
			var adminInt int
			if err := rows.Scan(&r.ID, &r.Name, &r.Description, &adminInt, &r.Color); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to read role"})
				return
			}
			r.Administrator = adminInt == 1
			perms, _ := getPermissionsByRole(c, r.ID)
			if perms == nil {
				perms = []string{}
			}
			r.Permissions = perms
			roles = append(roles, r)
		}
		c.JSON(http.StatusOK, roles)
	}
}

func CreateRole() gin.HandlerFunc {
	return func(c *gin.Context) {
		var req roleRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
			return
		}
		var roleID int
		err := database.Pool.QueryRow(c, `
			INSERT INTO roles (name, description, administrator, color)
			VALUES ($1, $2, $3, $4) RETURNING id`,
			req.Name, req.Description, boolToInt(req.Administrator), chooseColor(req.Color),
		).Scan(&roleID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create role"})
			return
		}

		if err := setRolePermissions(c, roleID, req.Permissions); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to set permissions"})
			return
		}

		utils.LogAudit(c, database.Pool, c.GetInt("userID"), "create_role", "role", &roleID, map[string]interface{}{"name": req.Name})
		c.JSON(http.StatusCreated, gin.H{"id": roleID})
	}
}

func GetRole() gin.HandlerFunc {
	return func(c *gin.Context) {
		id, _ := strconv.Atoi(c.Param("id"))
		role, err := fetchRole(c, id)
		if err != nil {
			if err == pgx.ErrNoRows {
				c.JSON(http.StatusNotFound, gin.H{"error": "role not found"})
			} else {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load role"})
			}
			return
		}
		c.JSON(http.StatusOK, role)
	}
}

func UpdateRole() gin.HandlerFunc {
	return func(c *gin.Context) {
		id, _ := strconv.Atoi(c.Param("id"))
		var req roleRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
			return
		}

		_, err := database.Pool.Exec(c, `
			UPDATE roles SET name=$1, description=$2, administrator=$3, color=$4 WHERE id=$5`,
			req.Name, req.Description, boolToInt(req.Administrator), chooseColor(req.Color), id,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update role"})
			return
		}

		if err := setRolePermissions(c, id, req.Permissions); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to set permissions"})
			return
		}

		utils.LogAudit(c, database.Pool, c.GetInt("userID"), "update_role", "role", &id, map[string]interface{}{"name": req.Name})
		c.Status(http.StatusOK)
	}
}

func DeleteRole() gin.HandlerFunc {
	return func(c *gin.Context) {
		id, _ := strconv.Atoi(c.Param("id"))
		_, err := database.Pool.Exec(c, "DELETE FROM roles WHERE id=$1", id)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete role"})
			return
		}
		utils.LogAudit(c, database.Pool, c.GetInt("userID"), "delete_role", "role", &id, nil)
		c.Status(http.StatusNoContent)
	}
}

func fetchRole(c *gin.Context, id int) (models.Role, error) {
	var r models.Role
	var adminInt int
	err := database.Pool.QueryRow(c, `SELECT id, name, description, COALESCE(administrator,0), COALESCE(color, '#10a37f') FROM roles WHERE id=$1`, id).
		Scan(&r.ID, &r.Name, &r.Description, &adminInt, &r.Color)
	if err != nil {
		return r, err
	}
	r.Administrator = adminInt == 1
	perms, _ := getPermissionsByRole(c, r.ID)
	if perms == nil {
		perms = []string{}
	}
	r.Permissions = perms
	return r, nil
}

func setRolePermissions(c *gin.Context, roleID int, permKeys []string) error {
	tx, err := database.Pool.Begin(c)
	if err != nil {
		return err
	}
	defer tx.Rollback(c)

	_, err = tx.Exec(c, "DELETE FROM role_permissions WHERE role_id=$1", roleID)
	if err != nil {
		return err
	}

	for _, key := range permKeys {
		var pid int
		err := tx.QueryRow(c, "SELECT id FROM permissions WHERE key=$1", key).Scan(&pid)
		if err != nil {
			return err
		}
		_, err = tx.Exec(c, "INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)", roleID, pid)
		if err != nil {
			return err
		}
	}
	return tx.Commit(c)
}

func boolToInt(b bool) int {
	if b {
		return 1
	}
	return 0
}

func chooseColor(c string) string {
	if c == "" {
		return "#10a37f"
	}
	return c
}

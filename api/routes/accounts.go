package routes

import (
	"context"
	"errors"
	"net/http"
	"strconv"
	"strings"
	"time"
	"watchtower/api/database"
	"watchtower/api/models"
	"watchtower/api/utils"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
)

type accountRequest struct {
	Email        string `json:"email" binding:"required,email"`
	Username     string `json:"username" binding:"required"`
	Password     string `json:"password,omitempty"`
	FirstName    string `json:"first_name"`
	LastName     string `json:"last_name"`
	Department   string `json:"department"`
	Phone        string `json:"phone"`
	AvatarURL    string `json:"avatar_url"`
	ProfileColor string `json:"profile_color"`
	IsActive     *bool  `json:"is_active"`
	Permissions  string `json:"permissions"`
	Role         string `json:"role"`
}

func ListAccounts() gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx := c.Request.Context()
		rows, err := database.Pool.Query(ctx, `
			SELECT u.id, u.email, u.username, u.password_hash, COALESCE(u.first_name, ''), COALESCE(u.last_name, ''),
			       COALESCE(u.department, ''), COALESCE(u.phone, ''), u.is_active, COALESCE(u.permissions, ''),
			       COALESCE(u.avatar_url, ''), COALESCE(u.profile_color, ''),
			       COALESCE(u.role_id, 0), COALESCE(r.name, ''), COALESCE(r.color, '#10a37f'), u.created_at, u.updated_at
			FROM users u
			LEFT JOIN roles r ON u.role_id = r.id
			ORDER BY u.id ASC`)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to query users"})
			return
		}
		defer rows.Close()

		var users []models.User
		for rows.Next() {
			user, scanErr := scanUser(rows)
			if scanErr != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to read user"})
				return
			}
			user.PasswordHash = ""
			users = append(users, user)
		}
		c.JSON(http.StatusOK, users)
	}
}

func GetAccount() gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx := c.Request.Context()
		requesterRole := c.GetString("userRole")
		requesterID := c.GetInt("userID")
		targetID, _ := strconv.Atoi(c.Param("id"))

		if requesterRole != "admin" && requesterID != targetID {
			c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
			return
		}

		user, err := findUserByID(ctx, targetID)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
			} else {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load user"})
			}
			return
		}
		user.PasswordHash = ""
		c.JSON(http.StatusOK, user)
	}
}

func CreateAccount() gin.HandlerFunc {
	return func(c *gin.Context) {
		var req accountRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
			return
		}
		if strings.TrimSpace(req.Password) == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "password is required"})
			return
		}

		ctx := c.Request.Context()
		roleID, err := ensureRole(ctx, req.Role)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "unable to resolve role"})
			return
		}

		hashed, err := utils.HashPassword(req.Password)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "unable to hash password"})
			return
		}

		isActive := true
		if req.IsActive != nil {
			isActive = *req.IsActive
		}

		var user models.User
		err = database.Pool.QueryRow(ctx, `
			INSERT INTO users (email, username, password_hash, first_name, last_name, department, phone, avatar_url, profile_color, is_active, permissions, role_id, created_at, updated_at)
			VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW(),NOW())
			RETURNING id, created_at, updated_at`,
			req.Email, req.Username, hashed, req.FirstName, req.LastName, req.Department, req.Phone, req.AvatarURL, req.ProfileColor, isActive, req.Permissions, roleID,
		).Scan(&user.ID, &user.CreatedAt, &user.UpdatedAt)

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create user"})
			return
		}

		user.Email = req.Email
		user.Username = req.Username
		user.FirstName = req.FirstName
		user.LastName = req.LastName
		user.Department = req.Department
		user.Phone = req.Phone
		user.AvatarURL = req.AvatarURL
		user.ProfileColor = req.ProfileColor
		user.IsActive = isActive
		user.Permissions = req.Permissions
		user.RoleID = roleID
		user.RoleName, _ = lookupRoleName(ctx, roleID)
		user.PasswordHash = ""

		c.JSON(http.StatusCreated, gin.H{"user": user})
	}
}

func UpdateAccount() gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx := c.Request.Context()
		requesterRole := c.GetString("userRole")
		requesterID := c.GetInt("userID")
		targetID, _ := strconv.Atoi(c.Param("id"))

		if requesterRole != "admin" && requesterID != targetID {
			c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
			return
		}

		existing, err := findUserByID(ctx, targetID)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
			} else {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load user"})
			}
			return
		}

		var req accountRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
			return
		}

		roleID := existing.RoleID
		if req.Role != "" {
			roleID, err = ensureRole(ctx, req.Role)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "unable to resolve role"})
				return
			}
		}

		passwordHash := existing.PasswordHash
		if strings.TrimSpace(req.Password) != "" {
			passwordHash, err = utils.HashPassword(req.Password)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "unable to hash password"})
				return
			}
		}

		isActive := existing.IsActive
		if req.IsActive != nil {
			isActive = *req.IsActive
		}

		_, err = database.Pool.Exec(ctx, `
			UPDATE users
			SET email=$1, username=$2, password_hash=$3, first_name=$4, last_name=$5, department=$6,
			    phone=$7, avatar_url=$8, profile_color=$9, is_active=$10, permissions=$11, role_id=$12, updated_at=NOW()
			WHERE id=$13`,
			chooseString(req.Email, existing.Email),
			chooseString(req.Username, existing.Username),
			passwordHash,
			chooseString(req.FirstName, existing.FirstName),
			chooseString(req.LastName, existing.LastName),
			chooseString(req.Department, existing.Department),
			chooseString(req.Phone, existing.Phone),
			chooseString(req.AvatarURL, existing.AvatarURL),
			chooseString(req.ProfileColor, existing.ProfileColor),
			isActive,
			chooseString(req.Permissions, existing.Permissions),
			roleID,
			targetID,
		)

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update user"})
			return
		}

		updated, _ := findUserByID(ctx, targetID)
		updated.PasswordHash = ""
		c.JSON(http.StatusOK, updated)
	}
}

func DeleteAccount() gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx := c.Request.Context()
		requesterRole := c.GetString("userRole")
		if requesterRole != "admin" {
			c.JSON(http.StatusForbidden, gin.H{"error": "admin only"})
			return
		}

		id, _ := strconv.Atoi(c.Param("id"))
		_, err := database.Pool.Exec(ctx, "DELETE FROM users WHERE id=$1", id)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete user"})
			return
		}
		utils.LogAudit(c, database.Pool, c.GetInt("userID"), "delete_account", "user", &id, nil)
		c.Status(http.StatusNoContent)
	}
}

func Login() gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx := c.Request.Context()
		var req struct {
			Email    string `json:"email" binding:"required,email"`
			Password string `json:"password" binding:"required"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
			return
		}

		user, err := findUserByEmail(ctx, req.Email)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
			} else {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "login failed"})
			}
			return
		}

		if err := utils.CheckPasswordHash(req.Password, user.PasswordHash); err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
			return
		}

		var sessionID int
		tokenString := ""
		tokenIP := c.ClientIP()
		ua := c.Request.UserAgent()
		err = database.Pool.QueryRow(ctx, `
			INSERT INTO sessions (user_id, token, ip_address, user_agent)
			VALUES ($1, '', $2, $3) RETURNING id`, user.ID, tokenIP, ua).Scan(&sessionID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create session"})
			return
		}

		user.RolePerms, _ = fetchPermissions(ctx, user.RoleID)

		token, err := utils.GenerateJWT(user, sessionID, 24*time.Hour)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate token"})
			return
		}
		tokenString = token
		_, _ = database.Pool.Exec(ctx, "UPDATE sessions SET token=$1 WHERE id=$2", tokenString, sessionID)

		user.PasswordHash = ""
		utils.LogAudit(c, database.Pool, user.ID, "login", "user", &user.ID, nil)
		c.JSON(http.StatusOK, gin.H{
			"token": tokenString,
			"user":  user,
		})
	}
}

func Me() gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetInt("userID")
		ctx := c.Request.Context()
		user, err := findUserByID(ctx, userID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load profile"})
			return
		}
		user.RolePerms, _ = fetchPermissions(ctx, user.RoleID)
		user.PasswordHash = ""
		utils.LogAudit(c, database.Pool, userID, "view_profile", "user", &userID, nil)
		c.JSON(http.StatusOK, user)
	}
}

// BootstrapAdmin allows creation of the first admin account when no users exist.
func BootstrapAdmin() gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx := c.Request.Context()

		var count int
		if err := database.Pool.QueryRow(ctx, "SELECT COUNT(*) FROM users").Scan(&count); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to check existing users"})
			return
		}

		if count > 0 {
			c.JSON(http.StatusForbidden, gin.H{"error": "admin already initialized"})
			return
		}

		var req accountRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
			return
		}
		if strings.TrimSpace(req.Password) == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "password is required"})
			return
		}

		req.Role = "admin" // enforce admin role for bootstrap

		roleID, err := ensureRole(ctx, req.Role)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "unable to resolve role"})
			return
		}

		hashed, err := utils.HashPassword(req.Password)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "unable to hash password"})
			return
		}

		isActive := true
		if req.IsActive != nil {
			isActive = *req.IsActive
		}

		var user models.User
		err = database.Pool.QueryRow(ctx, `
			INSERT INTO users (email, username, password_hash, first_name, last_name, department, phone, avatar_url, profile_color, is_active, permissions, role_id, created_at, updated_at)
			VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW(),NOW())
			RETURNING id, created_at, updated_at`,
			req.Email, req.Username, hashed, req.FirstName, req.LastName, req.Department, req.Phone, req.AvatarURL, req.ProfileColor, isActive, req.Permissions, roleID,
		).Scan(&user.ID, &user.CreatedAt, &user.UpdatedAt)

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create admin"})
			return
		}

		user.Email = req.Email
		user.Username = req.Username
		user.FirstName = req.FirstName
		user.LastName = req.LastName
		user.Department = req.Department
		user.Phone = req.Phone
		user.IsActive = isActive
		user.Permissions = req.Permissions
		user.RoleID = roleID
		user.RoleName, _ = lookupRoleName(ctx, roleID)
		user.PasswordHash = ""

		var sessionID int
		tokenIP := c.ClientIP()
		ua := c.Request.UserAgent()
		if err := database.Pool.QueryRow(ctx, `INSERT INTO sessions (user_id, token, ip_address, user_agent) VALUES ($1,'',$2,$3) RETURNING id`, user.ID, tokenIP, ua).Scan(&sessionID); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create session"})
			return
		}

		token, tokenErr := utils.GenerateJWT(user, sessionID, 24*time.Hour)
		if tokenErr != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate token"})
			return
		}
		_, _ = database.Pool.Exec(ctx, "UPDATE sessions SET token=$1 WHERE id=$2", token, sessionID)

		c.JSON(http.StatusCreated, gin.H{
			"token": token,
			"user":  user,
		})
	}
}

func scanUser(row pgx.Row) (models.User, error) {
	var user models.User
	err := row.Scan(
		&user.ID,
		&user.Email,
		&user.Username,
		&user.PasswordHash,
		&user.FirstName,
		&user.LastName,
		&user.Department,
		&user.Phone,
		&user.IsActive,
		&user.Permissions,
		&user.AvatarURL,
		&user.ProfileColor,
		&user.RoleID,
		&user.RoleName,
		&user.RoleColor,
		&user.CreatedAt,
		&user.UpdatedAt,
	)
	return user, err
}

func findUserByEmail(ctx context.Context, email string) (models.User, error) {
	row := database.Pool.QueryRow(ctx, `
		SELECT u.id, u.email, u.username, u.password_hash, COALESCE(u.first_name, ''), COALESCE(u.last_name, ''),
		       COALESCE(u.department, ''), COALESCE(u.phone, ''), u.is_active, COALESCE(u.permissions, ''),
		       COALESCE(u.avatar_url, ''), COALESCE(u.profile_color, ''),
		       COALESCE(u.role_id, 0), COALESCE(r.name, ''), COALESCE(r.color, '#10a37f'), u.created_at, u.updated_at
		FROM users u
		LEFT JOIN roles r ON u.role_id = r.id
		WHERE u.email=$1`, email)
	user, err := scanUser(row)
	if err != nil {
		return user, err
	}
	user.RolePerms, _ = fetchPermissions(ctx, user.RoleID)
	return user, nil
}

func findUserByID(ctx context.Context, id int) (models.User, error) {
	row := database.Pool.QueryRow(ctx, `
		SELECT u.id, u.email, u.username, u.password_hash, COALESCE(u.first_name, ''), COALESCE(u.last_name, ''),
		       COALESCE(u.department, ''), COALESCE(u.phone, ''), u.is_active, COALESCE(u.permissions, ''),
		       COALESCE(u.avatar_url, ''), COALESCE(u.profile_color, ''),
		       COALESCE(u.role_id, 0), COALESCE(r.name, ''), COALESCE(r.color, '#10a37f'), u.created_at, u.updated_at
		FROM users u
		LEFT JOIN roles r ON u.role_id = r.id
		WHERE u.id=$1`, id)
	user, err := scanUser(row)
	if err != nil {
		return user, err
	}
	user.RolePerms, _ = fetchPermissions(ctx, user.RoleID)
	return user, nil
}

func ensureRole(ctx context.Context, role string) (int, error) {
	name := strings.ToLower(strings.TrimSpace(role))
	if name == "" {
		name = "user"
	}
	var id int
	err := database.Pool.QueryRow(ctx, "SELECT id FROM roles WHERE name=$1", name).Scan(&id)
	if err == nil {
		return id, nil
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		return 0, err
	}
	err = database.Pool.QueryRow(ctx, `
		INSERT INTO roles (name, description, administrator, color)
		VALUES ($1, '', CASE WHEN $1='admin' THEN 1 ELSE 0 END, '#10a37f')
		RETURNING id`, name).Scan(&id)
	return id, err
}

func lookupRoleName(ctx context.Context, id int) (string, error) {
	var name string
	err := database.Pool.QueryRow(ctx, "SELECT name FROM roles WHERE id=$1", id).Scan(&name)
	return name, err
}

func fetchPermissions(ctx context.Context, roleID int) ([]string, error) {
	rows, err := database.Pool.Query(ctx, `
		SELECT p.key FROM role_permissions rp
		JOIN permissions p ON rp.permission_id = p.id
		WHERE rp.role_id = $1`, roleID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var perms []string
	for rows.Next() {
		var key string
		if err := rows.Scan(&key); err != nil {
			return nil, err
		}
		perms = append(perms, key)
	}
	return perms, nil
}

func chooseString(candidate, fallback string) string {
	if strings.TrimSpace(candidate) != "" {
		return candidate
	}
	return fallback
}


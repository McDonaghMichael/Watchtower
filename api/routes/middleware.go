package routes

import (
	"net/http"
	"strings"
	"watchtower/api/database"
	"watchtower/api/utils"

	"github.com/gin-gonic/gin"
)

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		// Fallback: EventSource/SSE cannot set headers, so accept ?token= query param.
		if authHeader == "" {
			if t := c.Query("token"); t != "" {
				authHeader = "Bearer " + t
			}
		}
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "missing token"})
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		claims, err := utils.ParseJWT(tokenString)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
			return
		}

		c.Set("userID", claims.UserID)
		c.Set("userRole", claims.Role)
		c.Set("userRoleID", claims.RoleID)
		c.Set("sessionID", claims.SessionID)

		// load permissions for this role
		perms, err := getPermissionsByRole(c, claims.RoleID)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "failed to load permissions"})
			return
		}
		c.Set("permissions", perms)

		// session validity
		if claims.SessionID != 0 {
			var active bool
			err = database.Pool.QueryRow(c, "SELECT active FROM sessions WHERE id=$1", claims.SessionID).Scan(&active)
			if err != nil || !active {
				c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "session revoked"})
				return
			}
			database.Pool.Exec(c, "UPDATE sessions SET last_seen=NOW() WHERE id=$1", claims.SessionID)
		}
		c.Next()
	}
}

func RequireRoles(roles ...string) gin.HandlerFunc {
	allowed := map[string]struct{}{}
	for _, r := range roles {
		allowed[r] = struct{}{}
	}
	return func(c *gin.Context) {
		role := c.GetString("userRole")
		if _, ok := allowed[role]; !ok {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "forbidden"})
			return
		}
		c.Next()
	}
}

func RequirePermissions(perms ...string) gin.HandlerFunc {
	need := map[string]struct{}{}
	for _, p := range perms {
		need[p] = struct{}{}
	}
	return func(c *gin.Context) {
		val, exists := c.Get("permissions")
		if !exists {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "forbidden"})
			return
		}
		userPerms, ok := val.([]string)
		if !ok {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "forbidden"})
			return
		}
		for _, p := range userPerms {
			if _, ok := need[p]; ok {
				c.Next()
				return
			}
		}
		c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "forbidden"})
	}
}

func getPermissionsByRole(c *gin.Context, roleID int) ([]string, error) {
	rows, err := database.Pool.Query(c, `
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

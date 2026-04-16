package utils

import (
	"encoding/json"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

func LogAudit(c *gin.Context, pool *pgxpool.Pool, userID int, action, resource string, resourceID *int, metadata map[string]interface{}) {
	metaBytes, _ := json.Marshal(metadata)
	ip := c.ClientIP()
	ua := c.Request.UserAgent()

	_, _ = pool.Exec(c, `
		INSERT INTO audit_logs (user_id, action, resource, resource_id, metadata, ip_address, user_agent)
		VALUES ($1, $2, $3, $4, $5, $6, $7)`,
		userID, action, resource, resourceID, metaBytes, ip, ua,
	)
}

// AuditQueryParams for filtering audit logs
type AuditQueryParams struct {
	Action     string `form:"action"`
	UserID     int    `form:"user_id"`
	Resource   string `form:"resource"`
	ResourceID int    `form:"resource_id"`
	Since      string `form:"since"`
	Until      string `form:"until"`
	Limit      int    `form:"limit"`
}

func ParseAuditQuery(c *gin.Context) AuditQueryParams {
	var q AuditQueryParams
	_ = c.ShouldBindQuery(&q)
	if q.Limit == 0 || q.Limit > 500 {
		q.Limit = 100
	}
	return q
}

package routes

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func SetupAPIRoutes(r *gin.RouterGroup) {

	// Public auth routes
	r.POST("/auth/login", Login())
	r.POST("/auth/bootstrap", BootstrapAdmin())
	r.GET("/auth/permissions", ListPermissions())

	// Authenticated routes
	auth := r.Group("")
	auth.Use(AuthMiddleware())

	auth.GET("/me", Me())

	// Account Routes
	admin := auth.Group("")
	admin.Use(RequireRoles("admin"))
	admin.GET("/accounts", ListAccounts())   // List all accounts
	admin.POST("/accounts", CreateAccount()) // Create a new account

	auth.GET("/accounts/:id", GetAccount())    // Find account given the ID (self or admin)
	auth.PUT("/accounts/:id", UpdateAccount()) // Update the account given the ID (self or admin)
	auth.DELETE("/accounts/:id", DeleteAccount())

	// Roles & Permissions
	admin.GET("/roles", ListRoles())
	admin.POST("/roles", CreateRole())
	admin.GET("/roles/:id", GetRole())
	admin.PUT("/roles/:id", UpdateRole())
	admin.DELETE("/roles/:id", DeleteRole())

	// Audit Logs
	auth.GET("/audit-logs", RequirePermissions("view_audit_logs"), ListAuditLogs())

	// Backups
	auth.GET("/backups/config", RequirePermissions("backup_read"), GetBackupConfigHandler())
	auth.POST("/backups/schedule", RequirePermissions("backup_schedule"), SetBackupSchedule())
	auth.GET("/backups", RequirePermissions("backup_read"), ListBackups())
	auth.POST("/backups/create", RequirePermissions("backup_write"), CreateManualBackup())
	auth.GET("/backups/download/:id", RequirePermissions("backup_read"), DownloadBackup())
	auth.DELETE("/backups/:id", RequirePermissions("backup_write"), DeleteBackup())

	// Sessions
	auth.GET("/sessions", RequirePermissions("manage_sessions"), ListSessions())
	auth.DELETE("/sessions/:id", RequirePermissions("manage_sessions"), RevokeSession())

	// Tickets
	auth.POST("/tickets", CreateTicket())
	auth.GET("/tickets", ListTickets())
	auth.GET("/tickets/:id", GetTicket())
	auth.POST("/tickets/:id/reply", ReplyTicket())
	auth.PATCH("/tickets/:id/status", RequirePermissions("support_manage"), UpdateTicketStatus())

	// ========== Server Routes ==========
	auth.GET("/servers", GetServers())       // List all servers
	auth.GET("/server/:id", GetServerByID()) // Find server given the ID
	auth.PUT("/server/:id", UpdateServer())  // Update the server given the ID
	auth.POST("/server/ping/:id", UpdateLastPingServer())
	auth.POST("/server", AddServer())          // Create a new server
	auth.DELETE("/server/:id", DeleteServer()) // Delete the server given the ID

	// ========== Metrics Routes ==========
	auth.POST("/metric", AddMetric())
	auth.GET("/metrics/server/:id", GetMetricsByServerID()) // Gets metrics by server ID

	auth.GET("/risk/server/:id", GetRiskScoreByServerId()) // Gets risk score by server ID

	// ========== Health Routes ==========
	auth.POST("/health", addHealthStatus())
	auth.GET("/health/server/:id", GetHealthStatusByServerID())
	auth.GET("/health", GetLatestHealthStatusAllServers())

	// Agent install/update + live progress stream
	auth.POST("/server/:id/install", RequirePermissions("manage_servers"), InstallAgent())
	auth.GET("/server/:id/install/stream", RequirePermissions("manage_servers"), StreamInstallProgress())

	// ========== Group Routes ==========
	auth.POST("/group", addGroup())
	auth.GET("/group/server/:id", GetGroupsByServerId())

	// ========== Conditions for Groups Routes ==========
	auth.POST("/condition", addCondition())
	auth.GET("/condition/group/:id", GetConditionsByGroupId())
	auth.GET("/condition/server/:id", GetConditionsByServer())
	auth.PUT("/condition/server/:id", UpdateConditionsByServer())

	// ========== Actions for Groups Routes ==========
	auth.POST("/action", addAction())
	auth.GET("/action/group/:id", GetActionsByGroupId())
	auth.PUT("/action/server/:id", UpdateActionsByServer())

}

func getDefault() gin.HandlerFunc {
	return func(c *gin.Context) {

		c.JSON(http.StatusOK, "Default")
	}
}

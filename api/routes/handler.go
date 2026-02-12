package routes

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func SetupAPIRoutes(r *gin.RouterGroup) {

	// Public auth routes
	r.POST("/auth/login", Login())
	r.POST("/auth/bootstrap", BootstrapAdmin())

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

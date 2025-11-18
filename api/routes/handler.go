package routes

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func SetupAPIRoutes(r *gin.RouterGroup) {

	r.GET("/health", getHealth())

	// ========== Account Routes ==========
	r.GET("/accounts", getDefault())       // List all accounts
	r.GET("/account/:id", getDefault())    // Find account given the ID
	r.POST("/account/:id", getDefault())   // Update the account given the ID
	r.POST("/account", getDefault())       // Create a new account
	r.DELETE("/account/:id", getDefault()) // Delete the account given the ID

	// ========== Server Routes ==========
	r.GET("/servers", GetServers())       // List all servers
	r.GET("/server/:id", GetServerByID()) // Find server given the ID
	//r.GET("/server/:id/metrics", getDefault())  // Get server metrics given the ID
	//r.GET("/server/:id/health", getDefault())   // Get server health given the ID
	//r.POST("/server/:id/execute", getDefault()) // Execute command on server given the ID
	r.PUT("/server/:id", UpdateServer()) // Update the server given the ID
	r.POST("/server/ping/:id", UpdateLastPingServer())
	r.GET("/server/status/:id", GetServerStatus())
	r.POST("/server", AddServer())          // Create a new server
	r.DELETE("/server/:id", DeleteServer()) // Delete the server given the ID

	// ========== Metrics Routes ==========
	r.POST("/metric", AddMetric())
	r.GET("/metrics/server/:id", GetMetricsByServerID()) // Gets metrics by server ID

	// ========== Health Routes ==========
	r.POST("/health", addHealthStatus())
	r.GET("/health/server/:id", GetHealthStatusByServerID())

	// ========== Group Routes ==========
	r.POST("/group", addGroup())
	r.GET("/group/server/:id", GetGroupsByServerId())

	// ========== Conditions for Groups Routes ==========
	r.POST("/condition", addCondition())
	r.GET("/condition/group/:id", GetConditionsByGroupId())
	r.GET("/condition/server/:id", GetConditionsByServer())
	r.PUT("/condition/server/:id", UpdateConditionsByServer())

	// ========== Actions for Groups Routes ==========
	r.POST("/action", addAction())
	r.GET("/action/group/:id", GetActionsByGroupId())
	r.PUT("/action/server/:id", UpdateActionsByServer())

}

func getHealth() gin.HandlerFunc {
	return func(c *gin.Context) {

		c.JSON(http.StatusOK, "All good")
	}
}

func getDefault() gin.HandlerFunc {
	return func(c *gin.Context) {

		c.JSON(http.StatusOK, "Default")
	}
}

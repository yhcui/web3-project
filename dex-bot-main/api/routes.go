package api

import (
	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

// SetupRoutes 设置路由
func SetupRoutes(r *gin.Engine, handler *Handler) {
	// Swagger 文档
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	// 健康检查
	r.GET("/health", handler.HealthCheck)

	// API v1 路由组
	v1 := r.Group("/api/v1")
	{
		// 流动性池相关
		pools := v1.Group("/pools")
		{
			pools.GET("", handler.ListPools)                // 获取池子列表
			pools.GET("/:pool_address", handler.GetPoolByAddress) // 获取单个池子
			pools.GET("/token", handler.GetTokenPools)      // 获取代币的所有池子
		}

		// 路由查询相关
		routes := v1.Group("/routes")
		{
			routes.GET("/direct", handler.FindDirectRoute)      // 直接路由
			routes.GET("/multi-hop", handler.FindMultiHopRoute) // 多跳路由
		}

		// 统计信息
		v1.GET("/stats", handler.GetStats)
	}
}


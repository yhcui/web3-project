package api

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// Response 通用响应结构
type Response struct {
	Code    int         `json:"code"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

// Pool 流动性池结构
type Pool struct {
	ID            int     `json:"id"`
	PoolAddress   string  `json:"pool_address"`
	DexName       string  `json:"dex_name"`
	DexRouter     string  `json:"dex_router"`
	ChainID       int     `json:"chain_id"`
	Token0Address string  `json:"token0_address"`
	Token0Symbol  string  `json:"token0_symbol"`
	Token1Address string  `json:"token1_address"`
	Token1Symbol  string  `json:"token1_symbol"`
	Reserve0      string  `json:"reserve0"`
	Reserve1      string  `json:"reserve1"`
	LiquidityUSD  float64 `json:"liquidity_usd"`
	FeeRate       float64 `json:"fee_rate"`
	IsActive      bool    `json:"is_active"`
}

// Route 交易路由
type Route struct {
	Pools       []Pool   `json:"pools"`
	TokenPath   []string `json:"token_path"`
	TotalFee    float64  `json:"total_fee"`
	AvgLiquidity float64 `json:"avg_liquidity"`
}

// Handler API 处理器
type Handler struct {
	bot *DexBot
}

// NewHandler 创建新的处理器
func NewHandler(bot *DexBot) *Handler {
	return &Handler{bot: bot}
}

// HealthCheck godoc
// @Summary 健康检查
// @Description 检查服务是否正常运行
// @Tags System
// @Produce json
// @Success 200 {object} Response
// @Router /health [get]
func (h *Handler) HealthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, Response{
		Code:    200,
		Message: "DEX Bot is running",
		Data: gin.H{
			"status": "healthy",
		},
	})
}

// ListPools godoc
// @Summary 获取流动性池列表
// @Description 根据链 ID 和 DEX 名称获取流动性池列表
// @Tags Pools
// @Produce json
// @Param chain_id query int false "链 ID (1=Ethereum, 56=BSC)"
// @Param dex_name query string false "DEX 名称 (Uniswap V2, PancakeSwap V2)"
// @Param limit query int false "返回数量限制" default(20)
// @Success 200 {object} Response{data=[]Pool}
// @Router /api/v1/pools [get]
func (h *Handler) ListPools(c *gin.Context) {
	chainIDStr := c.Query("chain_id")
	dexName := c.Query("dex_name")
	limitStr := c.DefaultQuery("limit", "20")

	limit, err := strconv.Atoi(limitStr)
	if err != nil {
		limit = 20
	}

	pools, err := h.bot.ListPools(chainIDStr, dexName, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, Response{
			Code:    500,
			Message: "查询失败: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, Response{
		Code:    200,
		Message: "success",
		Data:    pools,
	})
}

// GetPoolByAddress godoc
// @Summary 根据地址获取流动性池
// @Description 根据池子地址和链 ID 获取流动性池详情
// @Tags Pools
// @Produce json
// @Param pool_address path string true "池子地址"
// @Param chain_id query int true "链 ID"
// @Success 200 {object} Response{data=Pool}
// @Router /api/v1/pools/{pool_address} [get]
func (h *Handler) GetPoolByAddress(c *gin.Context) {
	poolAddress := c.Param("pool_address")
	chainIDStr := c.Query("chain_id")

	if chainIDStr == "" {
		c.JSON(http.StatusBadRequest, Response{
			Code:    400,
			Message: "缺少 chain_id 参数",
		})
		return
	}

	chainID, err := strconv.Atoi(chainIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Code:    400,
			Message: "无效的 chain_id",
		})
		return
	}

	pool, err := h.bot.GetPoolByAddress(poolAddress, chainID)
	if err != nil {
		c.JSON(http.StatusNotFound, Response{
			Code:    404,
			Message: "未找到池子: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, Response{
		Code:    200,
		Message: "success",
		Data:    pool,
	})
}

// FindDirectRoute godoc
// @Summary 查找直接交易路由
// @Description 查找两个代币之间的直接交易路由（单跳）
// @Tags Routes
// @Produce json
// @Param chain_id query int true "链 ID (1=Ethereum, 56=BSC)"
// @Param token_in query string true "输入代币地址"
// @Param token_out query string true "输出代币地址"
// @Success 200 {object} Response{data=[]Pool}
// @Router /api/v1/routes/direct [get]
func (h *Handler) FindDirectRoute(c *gin.Context) {
	chainIDStr := c.Query("chain_id")
	tokenIn := c.Query("token_in")
	tokenOut := c.Query("token_out")

	if chainIDStr == "" || tokenIn == "" || tokenOut == "" {
		c.JSON(http.StatusBadRequest, Response{
			Code:    400,
			Message: "缺少必要参数: chain_id, token_in, token_out",
		})
		return
	}

	chainID, err := strconv.Atoi(chainIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Code:    400,
			Message: "无效的 chain_id",
		})
		return
	}

	pools, err := h.bot.FindDirectRoute(chainID, tokenIn, tokenOut)
	if err != nil {
		c.JSON(http.StatusInternalServerError, Response{
			Code:    500,
			Message: "查询失败: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, Response{
		Code:    200,
		Message: "success",
		Data:    pools,
	})
}

// FindMultiHopRoute godoc
// @Summary 查找多跳交易路由
// @Description 查找两个代币之间的多跳交易路由
// @Tags Routes
// @Produce json
// @Param chain_id query int true "链 ID (1=Ethereum, 56=BSC)"
// @Param token_in query string true "输入代币地址"
// @Param token_out query string true "输出代币地址"
// @Param min_liquidity query number false "最小流动性" default(10000)
// @Success 200 {object} Response{data=[]Route}
// @Router /api/v1/routes/multi-hop [get]
func (h *Handler) FindMultiHopRoute(c *gin.Context) {
	chainIDStr := c.Query("chain_id")
	tokenIn := c.Query("token_in")
	tokenOut := c.Query("token_out")
	minLiquidityStr := c.DefaultQuery("min_liquidity", "10000")

	if chainIDStr == "" || tokenIn == "" || tokenOut == "" {
		c.JSON(http.StatusBadRequest, Response{
			Code:    400,
			Message: "缺少必要参数: chain_id, token_in, token_out",
		})
		return
	}

	chainID, err := strconv.Atoi(chainIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Code:    400,
			Message: "无效的 chain_id",
		})
		return
	}

	minLiquidity, err := strconv.ParseFloat(minLiquidityStr, 64)
	if err != nil {
		minLiquidity = 10000
	}

	routes, err := h.bot.FindTwoHopRoute(chainID, tokenIn, tokenOut, minLiquidity)
	if err != nil {
		c.JSON(http.StatusInternalServerError, Response{
			Code:    500,
			Message: "查询失败: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, Response{
		Code:    200,
		Message: "success",
		Data:    routes,
	})
}

// GetTokenPools godoc
// @Summary 获取代币的所有池子
// @Description 根据代币地址获取所有包含该代币的流动性池
// @Tags Pools
// @Produce json
// @Param chain_id query int true "链 ID"
// @Param token_address query string true "代币地址"
// @Success 200 {object} Response{data=[]Pool}
// @Router /api/v1/pools/token [get]
func (h *Handler) GetTokenPools(c *gin.Context) {
	chainIDStr := c.Query("chain_id")
	tokenAddress := c.Query("token_address")

	if chainIDStr == "" || tokenAddress == "" {
		c.JSON(http.StatusBadRequest, Response{
			Code:    400,
			Message: "缺少必要参数: chain_id, token_address",
		})
		return
	}

	chainID, err := strconv.Atoi(chainIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Code:    400,
			Message: "无效的 chain_id",
		})
		return
	}

	pools, err := h.bot.GetTokenPools(chainID, tokenAddress)
	if err != nil {
		c.JSON(http.StatusInternalServerError, Response{
			Code:    500,
			Message: "查询失败: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, Response{
		Code:    200,
		Message: "success",
		Data:    pools,
	})
}

// GetStats godoc
// @Summary 获取统计信息
// @Description 获取系统统计信息，包括池子数量、总流动性等
// @Tags System
// @Produce json
// @Success 200 {object} Response
// @Router /api/v1/stats [get]
func (h *Handler) GetStats(c *gin.Context) {
	stats, err := h.bot.GetStats()
	if err != nil {
		c.JSON(http.StatusInternalServerError, Response{
			Code:    500,
			Message: "查询失败: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, Response{
		Code:    200,
		Message: "success",
		Data:    stats,
	})
}


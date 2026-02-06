package api

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

// Response 通用响应结构
type Response struct {
	Code    int         `json:"code"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

// Handler API 处理器
type Handler struct {
	quote *Quote
}

// NewHandler 创建新的处理器
func NewHandler(quote *Quote) *Handler {
	return &Handler{
		quote: quote,
	}
}

// QuoteRequest quote 请求结构
type QuoteRequest struct {
	TokenIn     string `json:"tokenIn" binding:"required"`
	TokenOut    string `json:"tokenOut" binding:"required"`
	AmountIn    string `json:"amountIn" binding:"required"`
	PoolAddress string `json:"poolAddress,omitempty"` // 可选：指定池子地址
}

// QuoteResponse quote 响应结构
type QuoteResponse struct {
	AmountOut       string  `json:"amountOut"`       // 输出金额
	AmountIn        string  `json:"amountIn"`        // 输入金额
	PoolAddress     string  `json:"poolAddress"`     // 使用的池子地址
	PriceImpact     float64 `json:"priceImpact"`     // 价格影响百分比
	NewSqrtPriceX96 string  `json:"newSqrtPriceX96"` // 交易后的价格
	NewTick         int64   `json:"newTick"`         // 交易后的tick
	InitialPrice    string  `json:"initialPrice"`    // 初始价格
	FinalPrice      string  `json:"finalPrice"`      // 最终价格
	CrossedTicks    int     `json:"crossedTicks"`    // 跨越的tick数量
	Success         bool    `json:"success"`
	Simulated       bool    `json:"simulated"`
}

// GetQuote godoc
// @Summary 获取交易报价（Uniswap V3模型）
// @Description 根据输入代币、输出代币和输入金额计算输出金额，支持跨多个tick区间的精确计算
// @Tags Quote
// @Accept json
// @Produce json
// @Param request body QuoteRequest true "报价请求"
// @Success 200 {object} Response{data=QuoteResponse}
// @Failure 400 {object} Response
// @Failure 404 {object} Response
// @Failure 500 {object} Response
// @Router /api/v1/quote [post]
func (h *Handler) GetQuote(c *gin.Context) {
	var req QuoteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Code:    400,
			Message: "参数错误: " + err.Error(),
		})
		return
	}

	var poolAddress string

	// 如果指定了池子地址，直接使用；否则查找最佳池子
	if req.PoolAddress != "" {
		poolAddress = req.PoolAddress
	} else {
		pool, err := h.quote.FindBestPool(req.TokenIn, req.TokenOut)
		if err != nil {
			c.JSON(http.StatusNotFound, Response{
				Code:    404,
				Message: "未找到交易对池子: " + err.Error(),
			})
			return
		}
		poolAddress = pool.Address

		// 检查找到的池子是否有流动性
		if pool.Liquidity == "0" || pool.Liquidity == "" {
			c.JSON(http.StatusBadRequest, Response{
				Code:    400,
				Message: fmt.Sprintf("找到的池子 %s 流动性为0，无法进行交易", poolAddress),
			})
			return
		}
	}

	// 使用V3模型计算报价（支持跨多个tick区间）
	result, err := h.quote.CalculateQuoteV3(poolAddress, req.TokenIn, req.AmountIn)
	if err != nil {
		c.JSON(http.StatusInternalServerError, Response{
			Code:    500,
			Message: "计算报价失败: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, Response{
		Code:    200,
		Message: "success",
		Data: QuoteResponse{
			AmountOut:       result.AmountOut,
			AmountIn:        result.AmountIn,
			PoolAddress:     poolAddress,
			PriceImpact:     result.PriceImpact,
			NewSqrtPriceX96: result.NewSqrtPriceX96,
			NewTick:         result.NewTick,
			InitialPrice:    result.InitialPrice,
			FinalPrice:      result.FinalPrice,
			CrossedTicks:    result.CrossedTicks,
			Success:         true,
			Simulated:       true,
		},
	})
}

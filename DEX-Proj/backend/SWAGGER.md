# Swagger API 文档

## 概述

本项目使用 Swagger (OpenAPI) 自动生成 API 文档。文档基于代码中的注释自动生成。

## 查看文档

启动服务后，访问以下地址查看 Swagger UI：

```
http://localhost:8080/swagger/index.html
```

## 生成文档

如果修改了 API 代码或注释，需要重新生成 Swagger 文档：

```bash
cd backend
swag init -g main.go -o docs
```

## 文档文件

生成的文档文件位于 `docs/` 目录：

- `docs.go` - Go 代码文件，包含文档定义
- `swagger.json` - JSON 格式的 OpenAPI 规范
- `swagger.yaml` - YAML 格式的 OpenAPI 规范

## API 接口

当前 API 提供以下接口：

### POST /api/v1/quote

获取交易报价（Uniswap V3 模型）

**请求体：**
```json
{
  "tokenIn": "0x...",
  "tokenOut": "0x...",
  "amountIn": "1000000000000000000",
  "poolAddress": "0x..."  // 可选
}
```

**响应：**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "amountOut": "950000000000000000",
    "amountIn": "1000000000000000000",
    "poolAddress": "0x...",
    "priceImpact": 2.5,
    "newSqrtPriceX96": "2018382873588440326581633304624437",
    "newTick": 202919,
    "initialPrice": "1539300000000000000",
    "finalPrice": "1578000000000000000",
    "crossedTicks": 3,
    "success": true,
    "simulated": true
  }
}
```

## Swagger 注释格式

在代码中使用以下格式添加 Swagger 注释：

```go
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
    // ...
}
```

## 常用注释标签

- `@Summary` - API 简要描述
- `@Description` - API 详细描述
- `@Tags` - API 分组标签
- `@Accept` - 接受的请求内容类型
- `@Produce` - 返回的内容类型
- `@Param` - 参数说明
- `@Success` - 成功响应说明
- `@Failure` - 失败响应说明
- `@Router` - 路由定义

## 更多信息

- [Swagger 官方文档](https://swagger.io/docs/)
- [swaggo/swag 文档](https://github.com/swaggo/swag)


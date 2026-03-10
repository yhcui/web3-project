# GitBitEX API 接口文档

## 用户认证接口 (UserController)

| 方法 | 路径 | 说明 | 参数 |
|------|------|------|------|
| GET | `/api/users/self` | 获取当前用户信息 | - |
| PUT | `/api/users/self` | 更新用户资料 | nickName, twoStepVerificationType |
| POST | `/api/users/accessToken` | 用户登录 | email, password |
| DELETE | `/api/users/accessToken` | 用户登出 | - |
| POST | `/api/users` | 用户注册 | email, password |

## 账户接口 (AccountController)

| 方法 | 路径 | 说明 | 参数 |
|------|------|------|------|
| GET | `/api/accounts` | 获取账户余额 | currency[] (可选) |

## 订单接口 (OrderController)

| 方法 | 路径 | 说明 | 参数 |
|------|------|------|------|
| POST | `/api/orders` | 下单 | productId, type, side, size, price(可选), funds(可选), timeInForce(可选) |
| DELETE | `/api/orders/{orderId}` | 撤销单个订单 | orderId (路径参数) |
| DELETE | `/api/orders` | 撤销所有订单 | productId(可选), side(可选) |
| GET | `/api/orders` | 查询订单列表 | productId(可选), status(可选), page, pageSize |

## 产品接口 (ProductController)

| 方法 | 路径 | 说明 | 参数 |
|------|------|------|------|
| GET | `/api/products` | 获取所有交易对 | - |
| GET | `/api/products/{productId}/trades` | 获取成交记录 | productId (路径参数) |
| GET | `/api/products/{productId}/candles` | 获取 K 线数据 | productId, granularity, limit |
| GET | `/api/products/{productId}/book` | 获取订单簿 | productId, level (1/2/3) |

## 应用接口 (AppController)

| 方法 | 路径 | 说明 | 参数 |
|------|------|------|------|
| GET | `/api/apps` | 获取用户的应用列表 | - |
| POST | `/api/apps` | 创建应用 (生成 API Key) | name |
| DELETE | `/api/apps/{appId}` | 删除应用 | appId (路径参数) |

## 管理接口 (AdminController)

> 注意：这些接口仅用于演示，不应向外部用户开放

| 方法 | 路径 | 说明 | 参数 |
|------|------|------|------|
| GET | `/api/admin/createUser` | 创建用户 | email, password |
| GET | `/api/admin/deposit` | 充值 | userId, currency, amount |
| PUT | `/api/admin/products` | 添加交易对 | baseCurrency, quoteCurrency |

## 验证码接口 (CodeController)

| 方法 | 路径 | 说明 | 参数 |
|------|------|------|------|
| POST | `/api/codes` | 获取验证码 (待实现) | - |

## 配置接口 (ConfigController)

| 方法 | 路径 | 说明 | 参数 |
|------|------|------|------|
| GET | `/configs` | 获取配置 (待实现) | - |

## 首页接口 (HomeController)

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/trade/*` | 前端页面路由 |
| GET | `/account/*` | 前端页面路由 |

## WebSocket Feed 接口

WebSocket 端点用于实时推送市场数据和账户更新

### 订阅消息类型

- `subscribe` - 订阅频道
- `unsubscribe` - 取消订阅

### 频道类型

- `ticker` - Ticker 行情
- `candles` - K 线
- `level2` - 订单簿
- `orders` - 订单更新
- `account` - 账户更新

## 监控端点

| 端点 | 说明 |
|------|------|
| `/actuator/health` | 健康检查 |
| `/actuator/metrics` | 指标数据 |
| `/actuator/prometheus` | Prometheus 格式指标 (端口 7002) |

## API 文档

- Swagger UI: `/swagger-ui/index.html`

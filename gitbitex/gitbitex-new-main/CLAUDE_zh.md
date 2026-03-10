# CLAUDE.md (中文版)

本文件为 Claude Code (claude.ai/code) 在此代码库中工作提供指导。

## 构建与运行

```bash
# 构建（跳过测试）
mvn clean package -Dmaven.test.skip=true

# 运行
cd target
java -jar gitbitex-0.0.1-SNAPSHOT.jar

# 启动依赖服务 (Redis, MongoDB 副本集，Kafka)
docker compose up -d
```

## 架构概览

GitBitEX 是一个开源加密货币交易所，核心为内存撮合引擎，支持每秒 10 万 + 订单处理。

### 核心模块

#### 1. 撮合引擎 (`matchingengine/`)
内存撮合引擎，支持快照/恢复功能。

**处理的命令（通过 Kafka）：**
- `PlaceOrderCommand` - 下单
- `CancelOrderCommand` - 撤单
- `DepositCommand` - 充值
- `PutProductCommand` - 添加交易对

**核心类：**
- `MatchingEngine` - 主撮合引擎
- `MatchingEngineThread` - 命令处理线程
- `MatchingEngineLoader` - 引擎加载器
- `OrderBook` - 每个交易对的订单簿（L3 数据）
- `AccountBook` - 账户资金管理
- `ProductBook` - 交易对管理

#### 2. 市场数据 (`marketdata/`)
消费撮合引擎消息，持久化数据并生成各类市场数据。

**核心线程：**
- `OrderPersistenceThread` - 订单持久化
- `TradePersistenceThread` - 成交持久化
- `TickerThread` -  ticker 数据生成
- `CandleMakerThread` - K 线生成
- `OrderBookSnapshotThread` - 订单簿快照管理

**数据实体 (`entity/`)：**
- `OrderEntity`, `TradeEntity`, `Fill` - 订单与成交
- `AccountEntity`, `Bill` - 账户与账单
- `Candle`, `Ticker` - K 线与 ticker
- `ProductEntity`, `User` - 交易对与用户

**数据访问 (`repository/`)：**
- 各实体对应的 MongoDB Repository

**管理器 (`manager/`)：**
- `OrderManager`, `TradeManager`, `AccountManager` 等

#### 3. WebSocket 推送 (`feed/`)
向客户端推送实时市场数据和账户更新。

**核心类：**
- `FeedTextWebSocketHandler` - WebSocket 处理器
- `SessionManager` - 会话管理
- `AuthHandshakeInterceptor` - 握手鉴权
- `FeedMessageListener` - 消息监听

**消息类型 (`message/`)：**
- `TickerFeedMessage`, `CandleFeedMessage` - 行情数据
- `L2SnapshotFeedMessage`, `L2UpdateFeedMessage` - 订单簿数据
- `OrderFeedMessage`, `AccountFeedMessage` - 订单与账户

#### 4. 钱包模块 (`wallet/`)
集成 Coinbase，处理充值/提现（向撮合引擎发送命令）。

#### 5. API 接口 (`openapi/`)
RESTful API 控制器。

### 数据流

```
用户/API → 命令 → Kafka → 撮合引擎 → 消息 → Kafka
                                   ↓
                           市场数据消费者
                      (持久化到 MongoDB，生成 K线/ticker)
                                   ↓
                            WebSocket 推送给客户端
```

### 基础设施

| 组件 | 用途 | 端口 |
|------|------|------|
| MongoDB | 数据持久化（副本集 3 节点） | 30001-30003 |
| Kafka | 命令/消息总线 | 19092 |
| Redis | 会话/缓存 | 6379 |
| Mongo Express | MongoDB Web 管理界面 | 8082 |

### 配置项

编辑 `src/main/resources/application.properties`：

| 配置项 | 说明 |
|--------|------|
| `mongodb.uri` | MongoDB 副本集连接字符串 |
| `kafka.bootstrap-servers` | Kafka 地址 |
| `redis.address` | Redis 连接地址 |
| `server.port` | API 端口（默认 80） |
| `management.server.port` | 监控端点端口（7002） |

### 常用命令

```bash
# 添加新交易对
curl -X PUT -H "Content-Type:application/json" \
  http://127.0.0.1/api/admin/products \
  -d '{"baseCurrency":"BTC","quoteCurrency":"USDT"}'

# 查看监控指标
http://127.0.0.1:7002/actuator/prometheus

# API 文档
http://127.0.0.1/swagger-ui/index.html
```

### 关键性能指标 (Prometheus)

| 指标 | 说明 |
|------|------|
| `gbe_matching_engine_command_processed_total` | 撮合引擎处理命令数 |
| `gbe_matching_engine_modified_object_created_total` | 待持久化的修改对象数 |
| `gbe_matching_engine_modified_object_saved_total` | 已保存的修改对象数 |
| `gbe_matching_engine_snapshot_taker_modified_objects_queue_size` | 待写入快照的对象队列大小 |

### 技术栈

- **框架**: Spring Boot 2.6.4
- **语言**: Java 17
- **数据库**: MongoDB 5.0 (副本集)
- **消息队列**: Kafka 3.4.0
- **缓存**: Redis 7.0
- **JSON**: FastJSON 2.0.32
- **工具**: Lombok, OkHttp, Guava, Redisson

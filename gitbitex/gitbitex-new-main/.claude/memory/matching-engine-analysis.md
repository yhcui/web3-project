# 撮合引擎实现分析

## 概述

GitBitEx 撮合引擎是一个全内存的高性能订单撮合系统，支持每秒 10 万 + 订单处理。引擎通过 Kafka 接收命令并发送消息，实现与其他组件的解耦。

## 架构组件

### 1. MatchingEngineThread - Kafka 消费者

**文件**: `matchingengine/MatchingEngineThread.java`

撮合引擎线程，负责从 Kafka 读取命令并提交给撮合引擎执行。

**核心方法**:
- `doSubscribe()`: 订阅 `matching-engine-command` Topic
- `doPoll()`: 从 Kafka 拉取命令并执行
- `onPartitionsAssigned()`: 分区分配时从快照恢复 offset

```java
// 消费并处理命令
@Override
protected void doPoll() {
    consumer.poll(Duration.ofSeconds(5))
            .forEach(x -> matchingEngine.executeCommand(x.value(), x.offset()));
}
```

### 2. MatchingEngineLoader - 引擎加载器

**文件**: `matchingengine/MatchingEngineLoader.java`

负责从快照中加载撮合引擎实例，并每分钟定期刷新。

**核心功能**:
- 启动时从快照创建 MatchingEngine 实例
- 每分钟定期刷新预加载的引擎实例
- 提供线程安全的引擎实例获取

### 3. MatchingEngine - 撮合引擎核心

**文件**: `matchingengine/MatchingEngine.java`

撮合引擎核心类，负责处理各类命令并分发到具体处理逻辑。

**支持的命令类型**:
| 命令 | 说明 | 处理方法 |
|------|------|----------|
| PlaceOrderCommand | 下单命令 | executeCommand() |
| CancelOrderCommand | 撤单命令 | executeCommand() |
| DepositCommand | 充值命令 | executeCommand() |
| PutProductCommand | 添加交易对命令 | executeCommand() |

**核心字段**:
- `orderBooks`: 订单簿映射 (productId → OrderBook)
- `productBook`: 交易对簿
- `accountBook`: 账户簿
- `messageSender`: 消息发送器
- `messageSequence`: 消息序列号计数器

### 4. OrderBook - 订单簿 (核心撮合逻辑)

**文件**: `matchingengine/OrderBook.java`

订单簿类，撮合引擎的核心组件，负责订单的撮合成交。

#### placeOrder() - 下单撮合流程

```
1. 检查交易对是否存在
   ↓
2. 冻结用户资金 (买单冻结计价币种，卖单冻结基础币种)
   ↓
3. 发送订单接收消息 (RECEIVED 状态)
   ↓
4. 遍历对手方订单簿 (买单遍历卖单，卖单遍历买单)
   ↓
5. 价格交叉检查 (isPriceCrossed)
   - 市价单：直接匹配
   - 限价买单：订单价格 >= 对手方价格
   - 限价卖单：订单价格 <= 对手方价格
   ↓
6. 执行 trade() 撮合成交
   - 计算成交量 (取双方剩余量最小值)
   - 更新双方订单剩余数量
   - 创建 Trade 记录
   ↓
7. 账户资金交换 (exchange)
   ↓
8. 发送订单和成交通知
   ↓
9. 未完全成交则加入订单簿 (LIMIT 订单)
   或标记为 FILLED/CANCELLED (MARKET 订单)
```

#### cancelOrder() - 撤单流程

```
1. 从 orderById 映射中移除订单
   ↓
2. 从订单簿 (Depth) 中移除
   ↓
3. 标记订单状态为 CANCELLED
   ↓
4. 发送订单取消消息
   ↓
5. 解冻资金 (unhold)
```

### 5. Depth - 订单深度

**文件**: `matchingengine/Depth.java`

继承自 `TreeMap<BigDecimal, PriceGroupedOrderCollection>`，按价格分组的订单集合。

**特点**:
- 使用 TreeMap 保证价格有序
- 买单使用逆序 (价格从高到低)
- 卖单使用正序 (价格从低到高)
- 同一价格的订单使用 PriceGroupedOrderCollection 管理

### 6. AccountBook - 账户簿

**文件**: `matchingengine/AccountBook.java`

管理所有用户的账户余额，处理充值、冻结、解冻和资金交换。

**核心方法**:
| 方法 | 说明 |
|------|------|
| hold() | 冻结资金 (下单时调用) |
| unhold() | 解冻资金 (撤单或部分成交后调用) |
| deposit() | 充值 |
| exchange() | 交易双方资金交换 |

**exchange() 资金流向**:
```
买单 (BUY):
- 吃单方：获得基础币种，扣除计价币种
- 挂单方：失去基础币种，获得计价币种

卖单 (SELL):
- 吃单方：失去基础币种，获得计价币种
- 挂单方：获得基础币种，扣除计价币种
```

## 数据流

```
┌─────────────────────────────────────────────────────────┐
│                  Kafka Command Topic                     │
│             (matching-engine-command)                    │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              MatchingEngineThread                        │
│  - Kafka 消费者                                          │
│  - 拉取命令 → matchingEngine.executeCommand()            │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                  MatchingEngine                          │
│  - 命令分发                                              │
│  - 路由到 OrderBook / AccountBook                        │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                     OrderBook                            │
│  - 核心撮合逻辑                                          │
│  - 订单管理                                              │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                    AccountBook                           │
│  - 资金冻结/解冻                                         │
│  - 交易双方资金交换                                      │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              MessageSender (Kafka)                       │
│  发送到 matching-engine-message Topic:                   │
│  - OrderMessage (订单状态)                               │
│  - TradeMessage (成交记录)                               │
│  - AccountMessage (账户变化)                             │
└─────────────────────────────────────────────────────────┘
```

## 消息机制

### 发送的消息类型

| 消息类型 | 说明 | 触发时机 |
|----------|------|----------|
| CommandStartMessage | 命令开始 | 处理命令前 |
| CommandEndMessage | 命令结束 | 处理命令后 |
| OrderMessage | 订单状态变化 | 订单创建/成交/取消 |
| TradeMessage | 成交记录 | 订单撮合成交 |
| AccountMessage | 账户变化 | 充值/冻结/解冻/交易 |

### 序列号管理

- `messageSequence`: 全局消息序列号 (AtomicLong)
- `orderSequence`: 订单序列号 (每个 OrderBook 独立)
- `tradeSequence`: 成交序列号 (每个 OrderBook 独立)
- `orderBookSequence`: 订单簿序列号 (每个 OrderBook 独立)

## 快照恢复机制

### 恢复流程

1. MatchingEngineLoader 从快照创建新引擎实例
2. 恢复引擎状态 (EngineState)
   - 命令偏移量 (commandOffset)
   - 消息序列号 (messageSequence)
3. 恢复交易对数据 (Product)
4. 恢复账户数据 (Account)
5. 恢复订单簿数据 (Order)

### 持久化

- 快照通过 EngineSnapshotManager 管理
- 定期将引擎状态写入 MongoDB
- 支持从任意 offset 重放命令

## 关键特性

- ✅ **全内存撮合**: 订单簿和账户数据全部在内存中
- ✅ **高性能**: 支持 100,000+ 订单/秒
- ✅ **价格优先时间优先**: 标准的订单撮合规则
- ✅ **市价/限价单**: 支持两种订单类型
- ✅ **快照恢复**: 支持从快照恢复状态
- ✅ **消息通知**: 完整的状态变更通知机制
- ✅ **Kafka 解耦**: 命令和消息通过 Kafka 传递
- ✅ **分布式支持**: 支持多实例部署 (通过 Kafka 分区)

## 相关文件清单

### 核心撮合
- `MatchingEngine.java` - 撮合引擎核心
- `MatchingEngineThread.java` - Kafka 消费者线程
- `MatchingEngineLoader.java` - 引擎加载器
- `OrderBook.java` - 订单簿和撮合逻辑
- `Depth.java` - 订单深度管理

### 账户和资金
- `AccountBook.java` - 账户管理
- `Account.java` - 账户实体
- `ProductBook.java` - 交易对管理
- `Product.java` - 交易对实体

### 订单
- `Order.java` - 订单实体
- `Trade.java` - 成交记录

### 命令
- `Command.java` - 命令基类
- `PlaceOrderCommand.java` - 下单命令
- `CancelOrderCommand.java` - 撤单命令
- `DepositCommand.java` - 充值命令
- `PutProductCommand.java` - 添加交易对命令

### 消息
- `Message.java` - 消息基类
- `OrderMessage.java` - 订单消息
- `TradeMessage.java` - 成交消息
- `AccountMessage.java` - 账户消息
- `CommandStartMessage.java` - 命令开始消息
- `CommandEndMessage.java` - 命令结束消息

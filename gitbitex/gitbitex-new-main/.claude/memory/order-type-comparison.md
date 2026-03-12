# OrderType 对比文档

## 概述

`OrderType` 定义了加密货币交易所中订单的两种基本类型：**限价单 (LIMIT)** 和 **市价单 (MARKET)**。这两种订单类型在交易行为、撮合逻辑和使用场景上有显著区别。

## 枚举定义

```java
package com.gitbitex.enums;

public enum OrderType {
    /**
     * 限价单 (Limit Order)
     * 用户指定具体价格，只会在指定价格或更优价格成交
     */
    LIMIT,

    /**
     * 市价单 (Market Order)
     * 不指定价格，以当前市场最优价格立即成交
     */
    MARKET,
}
```

---

## 1. LIMIT (限价单)

### 定义
用户指定具体价格和数量的订单。订单只会在指定价格或更优价格时成交。

### 业务场景

| 场景 | 说明 |
|------|------|
| **控制成本** | 用户希望以特定价格或更优价格成交，不愿接受不利价格 |
| **挂单等待** | 不急于成交，愿意在订单簿中等待市场价格到达目标位 |
| **提供流动性** | 挂入订单簿，成为 Maker(挂单方)，通常享受更低手续费 |
| **量化策略** | 网格交易、套利策略等需要精确控制价格的场景 |

### 代码逻辑

**下单处理** (`OrderController.java:165-168`):
```java
case LIMIT -> {
    // 限价单需要指定价格和数量
    size = size.setScale(product.getBaseScale(), RoundingMode.DOWN);
    price = price.setScale(product.getQuoteScale(), RoundingMode.DOWN);
    // 买单冻结：价格 × 数量
    funds = side == OrderSide.BUY ? size.multiply(price) : BigDecimal.ZERO;
}
```

**撮合行为** (`OrderBook.java:153-156`):
```java
// 限价单未完全成交时，加入订单簿等待后续成交
if (takerOrder.getType() == OrderType.LIMIT &&
    takerOrder.getRemainingSize().compareTo(BigDecimal.ZERO) > 0) {
    addOrder(takerOrder);  // 加入订单簿
    takerOrder.setStatus(OrderStatus.OPEN);
}
```

**价格交叉检查** (`OrderBook.java:264-268`):
```java
if (takerOrder.getSide() == OrderSide.BUY) {
    return takerOrder.getPrice().compareTo(makerOrderPrice) >= 0;  // 买价 >= 卖价
} else {
    return takerOrder.getPrice().compareTo(makerOrderPrice) <= 0;  // 卖价 <= 买价
}
```

### 示例

```
场景：BTC/USDT 当前市场价格 50,000

【限价买单】
订单：LIMIT BUY, 价格 49,000, 数量 1 BTC
结果:
  - 当前卖价 > 49,000 → 不成交，挂入订单簿等待
  - 当卖价跌至 49,000 或更低时 → 开始成交

【限价卖单】
订单：LIMIT SELL, 价格 51,000, 数量 1 BTC
结果:
  - 当前买价 < 51,000 → 不成交，挂入订单簿等待
  - 当买价涨至 51,000 或更高时 → 开始成交
```

---

## 2. MARKET (市价单)

### 定义
不指定价格，以当前市场最优价格立即成交的订单。优先级是快速成交，而非价格优劣。

### 业务场景

| 场景 | 说明 |
|------|------|
| **快速成交** | 用户急于买入/卖出，不希望等待 |
| **不计成本** | 优先级是立即成交，可接受一定范围内的价格波动 |
| **消耗流动性** | 作为 Taker(吃单方)，吃掉订单簿中的挂单 |
| **止损/追涨** | 需要立即执行交易，避免错过时机 |

### 代码逻辑

**下单处理** (`OrderController.java:170-178`):
```java
case MARKET -> {
    price = BigDecimal.ZERO;  // 市价单价格为 0
    if (side == OrderSide.BUY) {
        // 市价买单指定的是资金量，而非币量
        size = BigDecimal.ZERO;
        funds = funds.setScale(product.getQuoteScale(), RoundingMode.DOWN);
    } else {
        // 市价卖单指定的是币量
        size = size.setScale(product.getBaseScale(), RoundingMode.DOWN);
        funds = BigDecimal.ZERO;
    }
}
```

**撮合行为** (`OrderBook.java:203-209`):
```java
if (takerOrder.getSide() == OrderSide.BUY && takerOrder.getType() == OrderType.MARKET) {
    // 市价买单不指定价格，按对手方价格计算可买数量
    takerSize = takerOrder.getRemainingFunds().divide(price, 4, RoundingMode.DOWN);
} else {
    takerSize = takerOrder.getRemainingSize();
}
```

**价格交叉检查** (`OrderBook.java:261-262`):
```java
if (takerOrder.getType() == OrderType.MARKET) {
    return true;  // 市价单直接与任何价格匹配
}
```

**最终状态** (`OrderBook.java:157-163`):
```java
// 市价单永远不会加入订单簿
if (takerOrder.getType() == OrderType.LIMIT && ...) {
    // ... 限价单逻辑
} else {
    if (takerOrder.getRemainingSize().compareTo(BigDecimal.ZERO) > 0) {
        takerOrder.setStatus(OrderStatus.CANCELLED);  // 未完全成交则取消
    } else {
        takerOrder.setStatus(OrderStatus.FILLED);  // 完全成交
    }
}
```

### 示例

```
场景：BTC/USDT 订单簿如下

卖单队列 (从低到高):
  50,001 USDT  0.5 BTC
  50,002 USDT  1.0 BTC
  50,003 USDT  2.0 BTC

买单队列 (从高到低):
  49,999 USDT  0.5 BTC
  49,998 USDT  1.0 BTC
  49,997 USDT  2.0 BTC

【市价买单】
订单：MARKET BUY, 资金 10,000 USDT
撮合过程:
  1. 成交 0.5 BTC @ 50,001 = 25,000.5 USDT (剩余资金 74,999.5)
  2. 成交 1.0 BTC @ 50,002 = 50,002 USDT (剩余资金 24,997.5)
  3. 成交 0.49 BTC @ 50,003 = 24,997.5 USDT (资金用完)
结果：获得 1.99 BTC，花费 10,000 USDT

【市价卖单】
订单：MARKET SELL, 数量 1 BTC
撮合过程:
  1. 成交 0.5 BTC @ 49,999 = 24,999.5 USDT (剩余数量 0.5)
  2. 成交 0.5 BTC @ 49,998 = 24,999 USDT (全部成交)
结果：卖出 1 BTC，获得 49,998.5 USDT
```

---

## 对比总结表

| 特性 | LIMIT (限价单) | MARKET (市价单) |
|------|---------------|-----------------|
| **价格指定** | ✅ 用户指定 | ❌ 不指定 (市场最优价) |
| **成交速度** | 可能等待 | 立即成交 |
| **加入订单簿** | ✅ 是 (成为 Maker) | ❌ 否 (作为 Taker) |
| **未成交部分** | 保持 OPEN 状态继续等待 | 直接 CANCELLED |
| **资金冻结 (买单)** | price × size | funds (指定金额) |
| **资金冻结 (卖单)** | size (币量) | size (币量) |
| **价格交叉检查** | 限价与对手方价格比较 | 始终为 true |
| **手续费角色** | 通常为 Maker(较低) | 通常为 Taker(较高) |
| **流动性** | 提供流动性 | 消耗流动性 |
| **使用场景** | 控制成本、挂单、量化策略 | 快速进出、止损、追涨杀跌 |

---

## 相关数据结构

### PlaceOrderCommand

```java
public class PlaceOrderCommand extends Command {
    private String productId;       // 交易对 ID
    private String orderId;         // 订单 ID
    private String userId;          // 用户 ID
    private OrderType orderType;    // 订单类型 (LIMIT/MARKET)
    private OrderSide orderSide;    // 订单方向 (BUY/SELL)
    private BigDecimal size;        // 订单数量
    private BigDecimal price;       // 订单价格 (市价单为 null)
    private BigDecimal funds;       // 资金 (市价买单使用)
    private Date time;              // 下单时间
}
```

### Order (内存中的订单)

```java
public class Order {
    private String id;              // 订单 ID
    private String productId;       // 交易对 ID
    private String userId;          // 用户 ID
    private OrderType type;         // 订单类型
    private OrderSide side;         // 订单方向
    private BigDecimal price;       // 价格
    private BigDecimal size;        // 数量
    private BigDecimal funds;       // 资金
    private BigDecimal filledSize;  // 已成交量
    private OrderStatus status;     // 订单状态
    private Date time;              // 下单时间
}
```

---

## 涉及的核心文件

| 文件 | 说明 |
|------|------|
| `enums/OrderType.java` | 订单类型枚举定义 |
| `openapi/controller/OrderController.java` | API 下单接口处理 |
| `matchingengine/OrderBook.java` | 核心撮合逻辑 |
| `matchingengine/Order.java` | 内存订单实体 |
| `matchingengine/command/PlaceOrderCommand.java` | 下单命令 |
| `marketdata/entity/OrderEntity.java` | 持久化订单实体 |
| `matchingengine/message/OrderReceivedMessage.java` | 订单接收消息 |
| `matchingengine/message/OrderDoneMessage.java` | 订单完成消息 |

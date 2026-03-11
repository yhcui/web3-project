package com.gitbitex.matchingengine;

import com.alibaba.fastjson.JSON;
import com.gitbitex.enums.OrderSide;
import com.gitbitex.enums.OrderStatus;
import com.gitbitex.enums.OrderType;
import com.gitbitex.matchingengine.message.OrderMessage;
import com.gitbitex.matchingengine.message.TradeMessage;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Comparator;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.atomic.AtomicLong;

/**
 * 订单簿类
 * 撮合引擎核心组件，负责订单的撮合成交
 */
@Getter
@Slf4j
public class OrderBook {
    /** 交易对 ID */
    private final String productId;
    /** 交易对簿 */
    private final ProductBook productBook;
    /** 账户簿 */
    private final AccountBook accountBook;
    /** 卖单深度 */
    private final Depth asks = new Depth(Comparator.naturalOrder());
    /** 买单深度 */
    private final Depth bids = new Depth(Comparator.reverseOrder());
    /** 订单 ID 映射 */
    private final Map<String, Order> orderById = new HashMap<>();
    /** 消息发送器 */
    private final MessageSender messageSender;
    /** 消息序列号计数器 */
    private final AtomicLong messageSequence;
    /** 订单序列号 */
    private long orderSequence;
    /** 成交序列号 */
    private long tradeSequence;
    /** 订单簿序列号 */
    private long orderBookSequence;

    /**
     * 构造订单簿
     * @param productId 交易对 ID
     * @param orderSequence 订单序列号
     * @param tradeSequence 成交序列号
     * @param orderBookSequence 订单簿序列号
     * @param accountBook 账户簿
     * @param productBook 交易对簿
     * @param messageSender 消息发送器
     * @param messageSequence 消息序列号计数器
     */
    public OrderBook(String productId,
                     long orderSequence, long tradeSequence, long orderBookSequence,
                     AccountBook accountBook, ProductBook productBook, MessageSender messageSender, AtomicLong messageSequence) {
        this.productId = productId;
        this.productBook = productBook;
        this.accountBook = accountBook;
        this.orderSequence = orderSequence;
        this.tradeSequence = tradeSequence;
        this.orderBookSequence = orderBookSequence;
        this.messageSender = messageSender;
        this.messageSequence = messageSequence;
    }

    /**
     * 下单
     * 下单 → 资金冻结 → 订单接收 → 价格匹配 → 成交处理 → 剩余处理
     * 设计亮点
     * 1. 双重迭代器模式
     * 2. 价格时间优先原则 通过 Depth 的数据结构保证价格优先 同价位订单按时间顺序匹配（由 PriceGroupedOrderCollection 保证）
     * 3. 状态机驱动  RECEIVED → OPEN/FILLED/CANCELLED/REJECTE
     * 4. 事件驱动架构  每个关键步骤都发送消息
     * ⚠️ 潜在问题
     * 1. 市价单的精度损失
     * 2. 性能瓶颈 单层循环嵌套，最坏情况 O(n×m)
     * 2. 并发安全 依赖外部线程同步（MatchingEngineThread 单线程消费） 没有内部锁机制
     *
     *  这段代码实现了一个经典的限价订单簿撮合算法，具有以下特征：
     * ✅ 价格优先、时间优先
     * ✅ 支持限价单和市价单
     * ✅ 剩余限价单自动挂单
     * ✅ 完整的状态管理和事件通知
     * ✅ 资金安全（先冻结后交易）
     * 是一个简洁但功能完整的撮合引擎核心实现。
     * @param takerOrder 吃单订单
     */
    public void placeOrder(Order takerOrder) {
        var product = productBook.getProduct(productId);
        if (product == null) {
            logger.warn("order rejected, reason: PRODUCT_NOT_FOUND");
            return;
        }

        /*
            分配序列号与资金冻结
            买单：冻结计价货币（如 USDT）
            卖单：冻结基础货币（如 BTC）
            资金不足时，订单状态设为 REJECTED 并发送消息
         */
        takerOrder.setSequence(++orderSequence);

        boolean ok;
        if (takerOrder.getSide() == OrderSide.BUY) {
            ok = accountBook.hold(takerOrder.getUserId(), product.getQuoteCurrency(), takerOrder.getRemainingFunds());
        } else {
            ok = accountBook.hold(takerOrder.getUserId(), product.getBaseCurrency(), takerOrder.getRemainingSize());
        }
        if (!ok) {
            logger.warn("order rejected, reason: INSUFFICIENT_FUNDS: {}", JSON.toJSONString(takerOrder));
            takerOrder.setStatus(OrderStatus.REJECTED);
            messageSender.send(orderMessage(takerOrder.clone()));
            return;
        }

        // order received 订单接收确认 向市场广播订单已接收 此时订单还未进入订单簿
        takerOrder.setStatus(OrderStatus.RECEIVED);
        messageSender.send(orderMessage(takerOrder.clone()));

        // start matching
        // 吃单是买单 → 匹配卖单（asks）
        // 吃单是卖单 → 匹配买单（bids）
        var makerDepth = takerOrder.getSide() == OrderSide.BUY ? asks : bids;
        var depthEntryItr = makerDepth.entrySet().iterator();
        // 使用带标签的循环（MATCHING:），用于从内层直接跳出外层
        MATCHING:
        // 外层循环：遍历价格档位
        // 按照价格优先顺序遍历（卖单从低到高，买单从高到低）
        while (depthEntryItr.hasNext()) {
            var entry = depthEntryItr.next();
            var price = entry.getKey();     // 价格档位
            var orders = entry.getValue();  // 该价位的订单集合

            // check whether there is price crossing between the taker and the maker
            // 价格交叉检查
            // 限价单：检查买入价是否 ≥ 卖出价
            // 市价单：始终返回 true（见 261-263 行）
            // 如果价格不交叉，停止匹配
            if (!isPriceCrossed(takerOrder, price)) {
                break;
            }

            // 内层循环：逐个匹配订单
            var orderItr = orders.entrySet().iterator();
            while (orderItr.hasNext()) {
                var orderEntry = orderItr.next();
                var makerOrder = orderEntry.getValue();

                // make trade
                // 调用 trade() 方法执行成交. 如果返回 null（吃单数量为 0），完全退出匹配
                Trade trade = trade(takerOrder, makerOrder);
                if (trade == null) {
                    break MATCHING;  //无法成交，直接退出整个匹配
                }

                // exchange account funds
                // 资金划转 在两个账户之间转移资产 基于成交数量和金额计算
                accountBook.exchange(takerOrder.getUserId(), makerOrder.getUserId(), product.getBaseCurrency(),
                        product.getQuoteCurrency(), takerOrder.getSide(), trade.getSize(), trade.getFunds());

                // if the maker order is filled or cancelled, remove it from the order book.
                // 处理完成的挂单 只有完全成交或取消的订单才会被移除 部分成交的订单会保留在订单簿中
                if (makerOrder.getStatus() == OrderStatus.FILLED || makerOrder.getStatus() == OrderStatus.CANCELLED) {
                    orderItr.remove(); // 从价格档位移除
                    orderById.remove(makerOrder.getId()); // 从订单映射移除
                    unholdOrderFunds(makerOrder, product); // 解冻剩余资金
                }
                // 发送成交通知.发送挂单状态更新 发送成交记录

                orderBookSequence++;
                messageSender.send(orderMessage(makerOrder.clone()));
                messageSender.send(tradeMessage(trade));
            }
            // 清理空价格档 如果某个价位的所有订单都被消耗，删除该价位
            // remove price line with empty order list
            if (orders.isEmpty()) {
                depthEntryItr.remove();
            }
        }
        /*
            | 订单类型 | 剩余数量 | 处理方式 | 状态 |
            |---------|---------|---------|------|
            | 限价单 | > 0 | 加入订单簿 | OPEN |
            | 市价单 | > 0 | 取消剩余 | CANCELLED |
            | 任意 | = 0 | 完成 | FILLED |
         */
        // If the taker order is not fully filled, put the taker order into the order book, otherwise mark
        // the order as done,The market order will never be added to the order book, and the market order without
        // fully filled will be cancelled
        // 处理吃单剩余数量
        if (takerOrder.getType() == OrderType.LIMIT && takerOrder.getRemainingSize().compareTo(BigDecimal.ZERO) > 0) {
            addOrder(takerOrder);
            takerOrder.setStatus(OrderStatus.OPEN);
            orderBookSequence++;
        } else {
            if (takerOrder.getRemainingSize().compareTo(BigDecimal.ZERO) > 0) {
                takerOrder.setStatus(OrderStatus.CANCELLED); // 市价单未完全成交→取消
            } else {
                takerOrder.setStatus(OrderStatus.FILLED); // 完全成交
            }
            unholdOrderFunds(takerOrder, product);// 解冻资金
        }

        messageSender.send(orderMessage(takerOrder.clone()));
    }

    /**
     * 撤单
     * @param orderId 订单 ID
     */
    public void cancelOrder(String orderId) {
        var order = orderById.remove(orderId);
        if (order == null) {
            return;
        }

        // remove order from depth
        var depth = order.getSide() == OrderSide.BUY ? bids : asks;
        depth.removeOrder(order);

        order.setStatus(OrderStatus.CANCELLED);

        messageSender.send(orderMessage(order.clone()));

        // un-hold funds
        var product = productBook.getProduct(productId);
        unholdOrderFunds(order, product);
    }

    /**
     * 撮合成交
     * 1. 市价买单的特殊处理（第 248-251 行）
     *  市价买单只指定了要花多少钱（比如 1000 元），而不指定买多少个。所以需要根据挂单价格换算成数量。
     * 2. 成交量确定原则（第 261 行）
     *  采用 "少量成交" 原则：
     *  吃单想吃 10 个，挂单只剩 5 个 → 成交 5 个
     *  吃单想吃 3 个，挂单有 5 个 → 成交 3 个
     * @param takerOrder 吃单订单
     * @param makerOrder 挂单订单
     * @return 成交记录，无法成交返回 null
     */
    private Trade trade(Order takerOrder, Order makerOrder) {
        BigDecimal price = makerOrder.getPrice();
        // 使用挂单的价格作为成交价格（这是交易所的标准做法）

        // === 步骤 1：计算吃单的实际交易数量 ===
        BigDecimal takerSize;
        if (takerOrder.getSide() == OrderSide.BUY && takerOrder.getType() == OrderType.MARKET) {
            // 特殊情况：市价买单
            // 市价单不指定价格，只指定要花费的金额（funds）
            // 所以需要用：金额 ÷ 价格 = 数量
            // 例如：想用 1000 元买 BTC，当前价格 50000 元/BTC → 可买 0.02 BTC
            takerSize = takerOrder.getRemainingFunds().divide(price, 4, RoundingMode.DOWN);
        } else {
            // 其他情况直接使用订单的剩余数量
            // 包括：限价单、市价卖单
            takerSize = takerOrder.getRemainingSize();
        }

        // 如果计算后数量为 0，无法成交
        if (takerSize.compareTo(BigDecimal.ZERO) == 0) {
            return null;
        }

        // === 步骤 2：确定实际成交量 ===
        // 取双方剩余数量的较小值（撮合原则：部分成交）
        // 例如：吃单想买 10 个，挂单只卖 5 个 → 成交 5 个
        BigDecimal tradeSize = takerSize.min(makerOrder.getRemainingSize());

        // 计算成交金额 = 数量 × 价格
        BigDecimal tradeFunds = tradeSize.multiply(price);

        // === 步骤 3：更新订单状态 ===
        // 减少双方的剩余数量
        takerOrder.setRemainingSize(takerOrder.getRemainingSize().subtract(tradeSize));
        makerOrder.setRemainingSize(makerOrder.getRemainingSize().subtract(tradeSize));

        // 减少资金冻结
        if (takerOrder.getSide() == OrderSide.BUY) {
            // 吃单是买单：扣除买方的资金
            takerOrder.setRemainingFunds(takerOrder.getRemainingFunds().subtract(tradeFunds));
        } else {
            // 吃单是卖单：扣除卖方的资金（卖方需要扣除币的数量对应的资金）
            // ⚠️ 这里可能有 bug！卖单应该扣减的是 remainingSize，而不是 funds
            makerOrder.setRemainingFunds(makerOrder.getRemainingFunds().subtract(tradeFunds));
        }

        // 如果挂单完全成交，设置状态为已成交
        if (makerOrder.getRemainingSize().compareTo(BigDecimal.ZERO) == 0) {
            makerOrder.setStatus(OrderStatus.FILLED);
        }

        // === 步骤 4：创建成交记录 ===
        Trade trade = new Trade();
        trade.setSequence(++tradeSequence);           // 成交序列号
        trade.setProductId(productId);                // 交易对 ID
        trade.setSize(tradeSize);                     // 成交数量
        trade.setFunds(tradeFunds);                   // 成交金额
        trade.setPrice(price);                        // 成交价格
        trade.setSide(makerOrder.getSide());          // 挂单的买卖方向
        trade.setTime(takerOrder.getTime());          // 成交时间
        trade.setTakerOrderId(takerOrder.getId());    // 吃单 ID
        trade.setMakerOrderId(makerOrder.getId());    // 挂单 ID

        return trade;
    }


    /**
     * 添加订单到订单簿
     * @param order 订单
     */
    public void addOrder(Order order) {
        var depth = order.getSide() == OrderSide.BUY ? bids : asks;
        depth.addOrder(order);
        orderById.put(order.getId(), order);
    }

    /**
     * 判断是否价格交叉
     * @param takerOrder 吃单订单
     * @param makerOrderPrice 挂单价格
     * @return 是否交叉
     */
    private boolean isPriceCrossed(Order takerOrder, BigDecimal makerOrderPrice) {
        if (takerOrder.getType() == OrderType.MARKET) {
            return true;
        }
        /*
            吃单和卖单的区别
            这里有个概念混淆：
                吃单 (Taker)：是指订单的角色，指主动成交的订单
                卖单 (Sell)：是指订单的方向，与买单 (Buy) 相对
            所以"吃单卖单"这个说法不太准确，应该说：
                吃单（Taker）- 主动成交的订单（可以是买单也可以是卖单）
                挂单（Maker）- 被动等待成交的订单（可以是买单也可以是卖单）
            价格交叉的判断逻辑应该是：
            对于买单（BUY）：
                如果吃单价格 ≥ 挂单价格 → 可以成交
                例如：有人愿意用 100 元买入，而订单簿上有 99 元的卖单 → 成交
            对于卖单（SELL）：
                如果吃单价格 ≤ 挂单价格 → 可以成交
                例如：有人愿意用 99 元卖出，而订单簿上有 100 元的买单 → 成交
         */
        if (takerOrder.getSide() == OrderSide.BUY) {
            // 买单：吃单价格 >= 挂单价格时可以成交
            return takerOrder.getPrice().compareTo(makerOrderPrice) >= 0;
        } else {
            // 卖单：吃单价格 <= 挂单价格时可以成交
            return takerOrder.getPrice().compareTo(makerOrderPrice) <= 0;
        }
    }

    /**
     * 解冻订单资金
     * @param makerOrder 订单
     * @param product 交易对
     */
    private void unholdOrderFunds(Order makerOrder, Product product) {
        if (makerOrder.getSide() == OrderSide.BUY) {
            if (makerOrder.getRemainingFunds().compareTo(BigDecimal.ZERO) > 0) {
                accountBook.unhold(makerOrder.getUserId(), product.getQuoteCurrency(), makerOrder.getRemainingFunds());
            }
        } else {
            if (makerOrder.getRemainingSize().compareTo(BigDecimal.ZERO) > 0) {
                accountBook.unhold(makerOrder.getUserId(), product.getBaseCurrency(), makerOrder.getRemainingSize());
            }
        }
    }


    /**
     * 创建订单消息
     * @param order 订单
     * @return 订单消息
     */
    private OrderMessage orderMessage(Order order) {
        OrderMessage message = new OrderMessage();
        message.setSequence(messageSequence.incrementAndGet());
        message.setOrderBookSequence(orderBookSequence);
        message.setOrder(order);
        return message;
    }

    /**
     * 创建成交消息
     * @param trade 成交
     * @return 成交消息
     */
    private TradeMessage tradeMessage(Trade trade) {
        TradeMessage message = new TradeMessage();
        message.setSequence(messageSequence.incrementAndGet());
        message.setTrade(trade);
        return message;
    }
}

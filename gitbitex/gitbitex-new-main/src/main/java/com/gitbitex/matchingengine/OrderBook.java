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
     * @param takerOrder 吃单订单
     */
    public void placeOrder(Order takerOrder) {
        var product = productBook.getProduct(productId);
        if (product == null) {
            logger.warn("order rejected, reason: PRODUCT_NOT_FOUND");
            return;
        }

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

        // order received
        takerOrder.setStatus(OrderStatus.RECEIVED);
        messageSender.send(orderMessage(takerOrder.clone()));

        // start matching
        var makerDepth = takerOrder.getSide() == OrderSide.BUY ? asks : bids;
        var depthEntryItr = makerDepth.entrySet().iterator();
        MATCHING:
        while (depthEntryItr.hasNext()) {
            var entry = depthEntryItr.next();
            var price = entry.getKey();
            var orders = entry.getValue();

            // check whether there is price crossing between the taker and the maker
            if (!isPriceCrossed(takerOrder, price)) {
                break;
            }

            var orderItr = orders.entrySet().iterator();
            while (orderItr.hasNext()) {
                var orderEntry = orderItr.next();
                var makerOrder = orderEntry.getValue();

                // make trade
                Trade trade = trade(takerOrder, makerOrder);
                if (trade == null) {
                    break MATCHING;
                }

                // exchange account funds
                accountBook.exchange(takerOrder.getUserId(), makerOrder.getUserId(), product.getBaseCurrency(),
                        product.getQuoteCurrency(), takerOrder.getSide(), trade.getSize(), trade.getFunds());

                // if the maker order is filled or cancelled, remove it from the order book.
                if (makerOrder.getStatus() == OrderStatus.FILLED || makerOrder.getStatus() == OrderStatus.CANCELLED) {
                    orderItr.remove();
                    orderById.remove(makerOrder.getId());
                    unholdOrderFunds(makerOrder, product);
                }

                orderBookSequence++;
                messageSender.send(orderMessage(makerOrder.clone()));
                messageSender.send(tradeMessage(trade));
            }

            // remove price line with empty order list
            if (orders.isEmpty()) {
                depthEntryItr.remove();
            }
        }

        // If the taker order is not fully filled, put the taker order into the order book, otherwise mark
        // the order as done,The market order will never be added to the order book, and the market order without
        // fully filled will be cancelled
        if (takerOrder.getType() == OrderType.LIMIT && takerOrder.getRemainingSize().compareTo(BigDecimal.ZERO) > 0) {
            addOrder(takerOrder);
            takerOrder.setStatus(OrderStatus.OPEN);
            orderBookSequence++;
        } else {
            if (takerOrder.getRemainingSize().compareTo(BigDecimal.ZERO) > 0) {
                takerOrder.setStatus(OrderStatus.CANCELLED);
            } else {
                takerOrder.setStatus(OrderStatus.FILLED);
            }
            unholdOrderFunds(takerOrder, product);
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
     * @param takerOrder 吃单订单
     * @param makerOrder 挂单订单
     * @return 成交记录，无法成交返回 null
     */
    private Trade trade(Order takerOrder, Order makerOrder) {
        BigDecimal price = makerOrder.getPrice();

        // get taker size
        BigDecimal takerSize;
        if (takerOrder.getSide() == OrderSide.BUY && takerOrder.getType() == OrderType.MARKET) {
            // The market order does not specify a price, so the size of the maker order needs to be
            // calculated by the price of the maker order
            takerSize = takerOrder.getRemainingFunds().divide(price, 4, RoundingMode.DOWN);
        } else {
            takerSize = takerOrder.getRemainingSize();
        }

        if (takerSize.compareTo(BigDecimal.ZERO) == 0) {
            return null;
        }

        // take the minimum size of taker and maker as trade size
        BigDecimal tradeSize = takerSize.min(makerOrder.getRemainingSize());
        BigDecimal tradeFunds = tradeSize.multiply(price);

        // fill order
        takerOrder.setRemainingSize(takerOrder.getRemainingSize().subtract(tradeSize));
        makerOrder.setRemainingSize(makerOrder.getRemainingSize().subtract(tradeSize));
        if (takerOrder.getSide() == OrderSide.BUY) {
            takerOrder.setRemainingFunds(takerOrder.getRemainingFunds().subtract(tradeFunds));
        } else {
            makerOrder.setRemainingFunds(makerOrder.getRemainingFunds().subtract(tradeFunds));
        }
        if (makerOrder.getRemainingSize().compareTo(BigDecimal.ZERO) == 0) {
            makerOrder.setStatus(OrderStatus.FILLED);
        }

        Trade trade = new Trade();
        trade.setSequence(++tradeSequence);
        trade.setProductId(productId);
        trade.setSize(tradeSize);
        trade.setFunds(tradeFunds);
        trade.setPrice(price);
        trade.setSide(makerOrder.getSide());
        trade.setTime(takerOrder.getTime());
        trade.setTakerOrderId(takerOrder.getId());
        trade.setMakerOrderId(makerOrder.getId());
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
        if (takerOrder.getSide() == OrderSide.BUY) {
            return takerOrder.getPrice().compareTo(makerOrderPrice) >= 0;
        } else {
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

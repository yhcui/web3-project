package com.gitbitex.marketdata.orderbook;

import com.gitbitex.enums.OrderSide;
import com.gitbitex.matchingengine.Depth;
import com.gitbitex.matchingengine.Order;
import lombok.Getter;
import lombok.Setter;

import java.util.Comparator;

/**
 * 订单簿类
 * 用于构建和维护交易对的订单簿
 */
@Getter
public class OrderBook {
    /** 交易对 ID */
    private final String productId;
    /** 卖单深度 */
    private final Depth asks = new Depth(Comparator.naturalOrder());
    /** 买单深度 */
    private final Depth bids = new Depth(Comparator.reverseOrder());
    /** 订单簿序列号 */
    @Setter
    private long sequence;

    /**
     * 构造订单簿
     * @param productId 交易对 ID
     */
    public OrderBook(String productId) {
        this.productId = productId;
    }

    /**
     * 构造订单簿
     * @param productId 交易对 ID
     * @param sequence 序列号
     */
    public OrderBook(String productId, long sequence) {
        this.productId = productId;
        this.sequence = sequence;
    }

    /**
     * 添加订单到订单簿
     * @param order 订单
     */
    public void addOrder(Order order) {
        var depth = order.getSide() == OrderSide.BUY ? bids : asks;
        depth.addOrder(order);
    }

    /**
     * 从订单簿移除订单
     * @param order 订单
     */
    public void removeOrder(Order order) {
        var depth = order.getSide() == OrderSide.BUY ? bids : asks;
        depth.removeOrder(order);
    }
}

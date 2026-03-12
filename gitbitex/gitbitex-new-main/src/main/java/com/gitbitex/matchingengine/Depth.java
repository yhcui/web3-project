package com.gitbitex.matchingengine;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.TreeMap;

/**
 * 深度类
 * 按价格分组的订单集合，用于订单簿的买单和卖单管理
 */
public class Depth extends TreeMap<BigDecimal, PriceGroupedOrderCollection> {

    public Depth(Comparator<BigDecimal> comparator) {
        super(comparator);
    }

    /**
     * 添加订单
     * @param order 订单
     */
    public void addOrder(Order order) {
        this.computeIfAbsent(order.getPrice(), k -> new PriceGroupedOrderCollection()).put(order.getId(), order);
    }

    /**
     * 移除订单
     * @param order 订单
     */
    public void removeOrder(Order order) {
        var orders = get(order.getPrice());
        if (orders == null) {
            return;
        }
        orders.remove(order.getId());
        if (orders.isEmpty()) {
            remove(order.getPrice());
        }
    }
}

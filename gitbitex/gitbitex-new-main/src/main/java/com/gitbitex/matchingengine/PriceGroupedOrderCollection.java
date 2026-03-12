package com.gitbitex.matchingengine;

import lombok.Getter;

import java.math.BigDecimal;
import java.util.LinkedHashMap;

/**
 * 价格分组订单集合
 * 同一价格的所有订单集合
 */
@Getter
public class PriceGroupedOrderCollection extends LinkedHashMap<String, Order> {
    /**
     * 添加订单
     * @param order 订单
     */
    public void addOrder(Order order) {
        put(order.getId(), order);
        //remainingSize = remainingSize.add(order.getRemainingSize());
    }

    public void decrRemainingSize(BigDecimal size) {
        //remainingSize=remainingSize.subtract(size);
    }

    /**
     * 获取剩余订单总数
     * @return 剩余数量
     */
    public BigDecimal getRemainingSize() {
        return values().stream()
                .map(Order::getRemainingSize)
                .reduce(BigDecimal::add)
                .get();
    }
}

package com.gitbitex.marketdata.orderbook;

import java.util.ArrayList;

/**
 * L2 订单簿变动类
 * 记录订单簿中某个价格档位的变动
 */
public class L2OrderBookChange extends ArrayList<Object> {
    /** 默认构造 */
    public L2OrderBookChange() {
    }

    /**
     * 构造变动记录
     * @param side 方向（buy/sell）
     * @param price 价格
     * @param size 数量
     */
    public L2OrderBookChange(String side, String price, String size) {
        this.add(side);
        this.add(price);
        this.add(size);
    }
}

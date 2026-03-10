package com.gitbitex.matchingengine.message;

import com.gitbitex.matchingengine.Order;
import lombok.Getter;
import lombok.Setter;

/**
 * 订单消息
 * 推送订单状态变更信息
 */
@Getter
@Setter
public class OrderMessage extends Message {
    /** 订单簿序列号 */
    private long orderBookSequence;
    /** 订单信息 */
    private Order order;

    public OrderMessage() {
        this.setMessageType(MessageType.ORDER);
    }
}

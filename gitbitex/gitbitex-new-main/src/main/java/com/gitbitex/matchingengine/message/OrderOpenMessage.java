package com.gitbitex.matchingengine.message;

import com.gitbitex.enums.OrderSide;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

/**
 * 订单开放消息
 * 推送新订单挂入订单簿的信息
 */
@Getter
@Setter
public class OrderOpenMessage extends OrderBookMessage {
    /** 订单 ID */
    private String orderId;
    /** 剩余数量 */
    private BigDecimal remainingSize;
    /** 订单价格 */
    private BigDecimal price;
    /** 订单方向 */
    private OrderSide side;
    /** 用户 ID */
    private String userId;

    public OrderOpenMessage() {
        this.setType(MessageType.ORDER_OPEN);
    }

}

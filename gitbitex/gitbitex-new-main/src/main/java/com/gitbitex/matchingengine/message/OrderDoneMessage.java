package com.gitbitex.matchingengine.message;

import com.gitbitex.enums.OrderSide;
import com.gitbitex.enums.OrderType;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

/**
 * 订单完成消息
 * 推送订单完成（成交或取消）的信息
 */
@Getter
@Setter
public class OrderDoneMessage extends OrderBookMessage {
    /** 订单 ID */
    private String orderId;
    /** 剩余数量 */
    private BigDecimal remainingSize;
    /** 剩余资金 */
    private BigDecimal remainingFunds;
    /** 订单价格 */
    private BigDecimal price;
    /** 订单方向 */
    private OrderSide side;
    /** 订单类型 */
    private OrderType orderType;
    /** 完成原因 */
    private String doneReason;
    /** 用户 ID */
    private String userId;

    public OrderDoneMessage() {
        this.setType(MessageType.ORDER_DONE);
    }
}

package com.gitbitex.matchingengine.message;

import com.gitbitex.enums.OrderSide;
import com.gitbitex.enums.OrderType;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.Date;

/**
 * 订单接收消息
 * 推送交易所接收订单的信息
 */
@Getter
@Setter
public class OrderReceivedMessage extends OrderBookMessage {
    /** 订单 ID */
    private String orderId;
    /** 用户 ID */
    private String userId;
    /** 订单数量 */
    private BigDecimal size;
    /** 订单价格 */
    private BigDecimal price;
    /** 订单资金 */
    private BigDecimal funds;
    /** 订单方向 */
    private OrderSide side;
    /** 订单类型 */
    private OrderType orderType;
    /** 客户端订单 ID */
    private String clientOid;
    /** 订单时间 */
    private Date time;

    public OrderReceivedMessage() {
        this.setType(MessageType.ORDER_RECEIVED);
    }
}


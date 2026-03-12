package com.gitbitex.matchingengine.message;

import com.gitbitex.enums.OrderSide;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

/**
 * 订单成交消息
 * 推送订单撮合成交的信息
 */
@Getter
@Setter
public class OrderMatchMessage extends OrderBookMessage {
    /** 交易对 ID */
    private String productId;
    /** 序列号 */
    private long sequence;
    /** 成交 ID */
    private long tradeId;
    /** 吃单者订单 ID */
    private String takerOrderId;
    /** 挂单者订单 ID */
    private String makerOrderId;
    /** 吃单者用户 ID */
    private String takerUserId;
    /** 挂单者用户 ID */
    private String makerUserId;
    /** 成交方向 */
    private OrderSide side;
    /** 成交价格 */
    private BigDecimal price;
    /** 成交数量 */
    private BigDecimal size;
    /** 成交金额 */
    private BigDecimal funds;

    public OrderMatchMessage() {
        this.setType(MessageType.ORDER_MATCH);
    }

}

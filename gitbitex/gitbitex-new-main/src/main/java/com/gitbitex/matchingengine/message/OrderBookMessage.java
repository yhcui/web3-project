package com.gitbitex.matchingengine.message;

import lombok.Getter;
import lombok.Setter;

import java.util.Date;

/**
 * 订单簿消息
 * 推送订单簿变动相关的消息
 */
@Getter
@Setter
public class OrderBookMessage {
    /** 交易对 ID */
    private String productId;
    /** 序列号 */
    private long sequence;
    /** 消息时间 */
    private Date time;
    /** 消息类型 */
    private MessageType type;

    /**
     * 订单簿消息类型枚举
     */
    public enum MessageType {
        /** 订单接收 */
        ORDER_RECEIVED,
        /** 订单开放 */
        ORDER_OPEN,
        /** 订单成交 */
        ORDER_MATCH,
        /** 订单完成 */
        ORDER_DONE,
    }
}

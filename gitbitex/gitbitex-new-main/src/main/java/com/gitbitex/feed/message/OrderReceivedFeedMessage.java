package com.gitbitex.feed.message;

import lombok.Getter;
import lombok.Setter;

/**
 * 订单接收 Feed 消息
 * 推送交易所接收订单的信息
 */
@Getter
@Setter
public class OrderReceivedFeedMessage {
    /** 消息类型 */
    private String type = "received";
    /** 订单时间 */
    private String time;
    /** 交易对 ID */
    private String productId;
    /** 序列号 */
    private long sequence;
    /** 订单 ID */
    private String orderId;
    /** 订单数量 */
    private String size;
    /** 订单价格 */
    private String price;
    /** 订单资金 */
    private String funds;
    /** 订单方向 */
    private String side;
    /** 订单类型 */
    private String orderType;
}

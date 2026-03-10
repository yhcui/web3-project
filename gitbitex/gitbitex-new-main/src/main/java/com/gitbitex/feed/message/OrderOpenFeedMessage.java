package com.gitbitex.feed.message;

import lombok.Getter;
import lombok.Setter;

/**
 * 订单开放 Feed 消息
 * 推送新订单挂入订单簿的信息
 */
@Getter
@Setter
public class OrderOpenFeedMessage {
    /** 消息类型 */
    private String type = "open";
    /** 交易对 ID */
    private String productId;
    /** 序列号 */
    private long sequence;
    /** 订单时间 */
    private String time;
    /** 订单 ID */
    private String orderId;
    /** 剩余数量 */
    private String remainingSize;
    /** 订单价格 */
    private String price;
    /** 订单方向 */
    private String side;
}

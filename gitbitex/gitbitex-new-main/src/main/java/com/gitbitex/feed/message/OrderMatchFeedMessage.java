package com.gitbitex.feed.message;

import lombok.Getter;
import lombok.Setter;

/**
 * 订单成交 Feed 消息
 * 推送订单撮合成交信息
 */
@Getter
@Setter
public class OrderMatchFeedMessage {
    /** 消息类型 */
    private String type = "match";
    /** 交易对 ID */
    private String productId;
    /** 成交 ID */
    private long tradeId;
    /** 序列号 */
    private long sequence;
    /** 吃单者订单 ID */
    private String takerOrderId;
    /** 挂单者订单 ID */
    private String makerOrderId;
    /** 成交时间 */
    private String time;
    /** 成交数量 */
    private String size;
    /** 成交价格 */
    private String price;
    /** 成交方向 */
    private String side;
}

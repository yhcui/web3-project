package com.gitbitex.feed.message;

import lombok.Getter;
import lombok.Setter;

/**
 * 订单状态 Feed 消息
 * 推送订单的完整状态信息
 */
@Getter
@Setter
public class OrderFeedMessage {
    /** 消息类型 */
    private String type = "order";
    /** 交易对 ID */
    private String productId;
    /** 用户 ID */
    private String userId;
    /** 序列号 */
    private String sequence;
    /** 订单 ID */
    private String id;
    /** 订单价格 */
    private String price;
    /** 订单数量 */
    private String size;
    /** 订单资金 */
    private String funds;
    /** 订单方向 */
    private String side;
    /** 订单类型 */
    private String orderType;
    /** 创建时间 */
    private String createdAt;
    /** 成交手续费 */
    private String fillFees;
    /** 已成交数量 */
    private String filledSize;
    /** 成交额 */
    private String executedValue;
    /** 订单状态 */
    private String status;
    /** 是否已结算 */
    private boolean settled;
}

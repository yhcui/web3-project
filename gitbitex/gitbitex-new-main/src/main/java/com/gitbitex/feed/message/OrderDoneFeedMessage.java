package com.gitbitex.feed.message;

import lombok.Getter;
import lombok.Setter;

/**
 * 订单结束 Feed 消息
 * 推送订单完成（成交或取消）的信息
 * 示例格式：
 * {
 * "type": "done",
 * "time": "2014-11-07T08:19:27.028459Z",
 * "product_id": "BTC-USD",
 * "sequence": 10,
 * "price": "200.2",
 * "order_id": "d50ec984-77a8-460a-b958-66f114b0de9b",
 * "reason": "filled", // or "canceled"
 * "side": "sell",
 * "remaining_size": "0"
 * }
 */
@Getter
@Setter
public class OrderDoneFeedMessage {
    /** 消息类型 */
    private String type = "done";
    /** 交易对 ID */
    private String productId;
    /** 序列号 */
    private long sequence;
    /** 订单 ID */
    private String orderId;
    /** 剩余数量 */
    private String remainingSize;
    /** 订单价格 */
    private String price;
    /** 订单方向 */
    private String side;
    /** 结束原因（filled 成交/canceled 取消） */
    private String reason;
    /** 时间戳 */
    private String time;
}



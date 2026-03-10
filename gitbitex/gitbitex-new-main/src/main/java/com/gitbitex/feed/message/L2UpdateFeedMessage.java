package com.gitbitex.feed.message;

import com.gitbitex.marketdata.orderbook.L2OrderBookChange;
import lombok.Getter;
import lombok.Setter;

import java.util.Date;
import java.util.List;

/**
 * L2 订单簿更新 Feed 消息
 * 推送订单簿增量变化数据
 * 示例格式：
 * {
 * "type": "l2update",
 * "product_id": "BTC-USD",
 * "time": "2019-08-14T20:42:27.265Z",
 * "changes": [
 * [
 * "buy",
 * "10101.80000000",
 * "0.162567"
 * ]
 * ]
 * }
 */
@Getter
@Setter
public class L2UpdateFeedMessage {
    /** 消息类型 */
    private String type = "l2update";
    /** 交易对 ID */
    private String productId;
    /** 时间戳 */
    private String time;
    /** 变化列表 */
    private List<L2OrderBookChange> changes;

    /**
     * 构造 L2 更新消息
     */
    public L2UpdateFeedMessage() {
    }

    /**
     * 构造 L2 更新消息
     * @param productId 交易对 ID
     * @param l2OrderBookChanges L2 订单簿变化列表
     */
    public L2UpdateFeedMessage(String productId, List<L2OrderBookChange> l2OrderBookChanges) {
        this.productId = productId;
        this.time = new Date().toInstant().toString();
        this.changes = l2OrderBookChanges;
    }
}

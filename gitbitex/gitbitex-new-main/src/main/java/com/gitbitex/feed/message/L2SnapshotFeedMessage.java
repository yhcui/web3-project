package com.gitbitex.feed.message;

import com.gitbitex.marketdata.orderbook.L2OrderBook;
import lombok.Getter;
import lombok.Setter;
import org.springframework.beans.BeanUtils;

/**
 * L2 订单簿快照 Feed 消息
 * 推送完整的订单簿快照数据
 */
@Getter
@Setter
public class L2SnapshotFeedMessage extends L2OrderBook {
    /** 消息类型 */
    private String type = "snapshot";

    /**
     * 构造 L2 快照消息
     * @param snapshot L2 订单簿快照
     */
    public L2SnapshotFeedMessage(L2OrderBook snapshot) {
        BeanUtils.copyProperties(snapshot, this);
    }
}

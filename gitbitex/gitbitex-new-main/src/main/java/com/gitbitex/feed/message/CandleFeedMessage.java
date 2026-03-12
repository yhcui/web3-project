package com.gitbitex.feed.message;

import lombok.Getter;
import lombok.Setter;

/**
 * K 线 Feed 消息
 * 推送 K 线数据更新
 */
@Getter
@Setter
public class CandleFeedMessage {
    /** 消息类型 */
    private String type = "candle";
    /** 交易对 ID */
    private String productId;
    /** 序列号 */
    private long sequence;
    /** 时间粒度（秒） */
    private int granularity;
    /** 时间戳 */
    private long time;
    /** 开盘价 */
    private String open;
    /** 收盘价 */
    private String close;
    /** 最高价 */
    private String high;
    /** 最低价 */
    private String low;
    /** 成交量 */
    private String volume;
}

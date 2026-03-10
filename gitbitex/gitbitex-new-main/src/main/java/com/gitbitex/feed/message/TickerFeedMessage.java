package com.gitbitex.feed.message;

import com.gitbitex.marketdata.entity.Ticker;
import lombok.Getter;
import lombok.Setter;

/**
 * 行情 Ticker Feed 消息
 * 推送实时行情数据
 */
@Getter
@Setter
public class TickerFeedMessage {
    /** 消息类型 */
    private String type = "ticker";
    /** 交易对 ID */
    private String productId;
    /** 成交 ID */
    private long tradeId;
    /** 序列号 */
    private long sequence;
    /** 时间戳 */
    private String time;
    /** 成交价格 */
    private String price;
    /** 成交方向 */
    private String side;
    /** 最新成交量 */
    private String lastSize;
    /** 24 小时开盘价 */
    private String open24h;
    /** 24 小时收盘价 */
    private String close24h;
    /** 24 小时最高价 */
    private String high24h;
    /** 24 小时最低价 */
    private String low24h;
    /** 24 小时成交量 */
    private String volume24h;
    /** 30 天成交量 */
    private String volume30d;

    /**
     * 构造 Ticker 消息
     */
    public TickerFeedMessage() {
    }

    /**
     * 从 Ticker 实体创建消息
     * @param ticker Ticker 实体
     */
    public TickerFeedMessage(Ticker ticker) {
        this.setProductId(ticker.getProductId());
        this.setTradeId(ticker.getTradeId());
        this.setSequence(ticker.getSequence());
        this.setTime(ticker.getTime().toInstant().toString());
        this.setPrice(ticker.getPrice().stripTrailingZeros().toPlainString());
        this.setSide(ticker.getSide().name().toLowerCase());
        this.setLastSize(ticker.getLastSize().stripTrailingZeros().toPlainString());
        this.setClose24h(ticker.getClose24h().stripTrailingZeros().toPlainString());
        this.setOpen24h(ticker.getOpen24h().stripTrailingZeros().toPlainString());
        this.setHigh24h(ticker.getHigh24h().stripTrailingZeros().toPlainString());
        this.setLow24h(ticker.getLow24h().stripTrailingZeros().toPlainString());
        this.setVolume24h(ticker.getVolume24h().stripTrailingZeros().toPlainString());
        this.setVolume30d(ticker.getVolume30d().stripTrailingZeros().toPlainString());
    }

}

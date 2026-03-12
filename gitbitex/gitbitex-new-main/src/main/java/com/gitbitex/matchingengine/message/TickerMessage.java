package com.gitbitex.matchingengine.message;

import com.gitbitex.enums.OrderSide;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.Date;

/**
 * 行情 Ticker 消息
 * 推送实时行情数据
 */
@Getter
@Setter
public class TickerMessage {
    /** 交易对 ID */
    private String productId;
    /** 成交 ID */
    private long tradeId;
    /** 序列号 */
    private long sequence;
    /** 时间戳 */
    private Date time;
    /** 成交价格 */
    private BigDecimal price;
    /** 成交方向 */
    private OrderSide side;
    /** 最新成交量 */
    private BigDecimal lastSize;
    /** 24 小时时间戳 */
    private Long time24h;
    /** 24 小时开盘价 */
    private BigDecimal open24h;
    /** 24 小时收盘价 */
    private BigDecimal close24h;
    /** 24 小时最高价 */
    private BigDecimal high24h;
    /** 24 小时最低价 */
    private BigDecimal low24h;
    /** 24 小时成交量 */
    private BigDecimal volume24h;
    /** 30 天时间戳 */
    private Long time30d;
    /** 30 天开盘价 */
    private BigDecimal open30d;
    /** 30 天收盘价 */
    private BigDecimal close30d;
    /** 30 天最高价 */
    private BigDecimal high30d;
    /** 30 天最低价 */
    private BigDecimal low30d;
    /** 30 天成交量 */
    private BigDecimal volume30d;
}

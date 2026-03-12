package com.gitbitex.marketdata.entity;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.Date;

/**
 * K 线实体类
 * 记录交易对的 K 线数据
 */
@Getter
@Setter
public class Candle {
    /** K 线 ID */
    private String id;
    /** 创建时间 */
    private Date createdAt;
    /** 更新时间 */
    private Date updatedAt;
    /** 交易对 ID */
    private String productId;
    /** K 线粒度（分钟） */
    private int granularity;
    /** K 线开始时间戳 */
    private long time;
    /** 开盘价 */
    private BigDecimal open;
    /** 收盘价 */
    private BigDecimal close;
    /** 最高价 */
    private BigDecimal high;
    /** 最低价 */
    private BigDecimal low;
    /** 成交量 */
    private BigDecimal volume;
    /** 成交 ID */
    private long tradeId;
}

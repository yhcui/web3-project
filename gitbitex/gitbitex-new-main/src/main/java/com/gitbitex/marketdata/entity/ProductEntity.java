package com.gitbitex.marketdata.entity;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.Date;

/**
 * 交易对实体类
 * 记录交易对的配置信息
 */
@Getter
@Setter
public class ProductEntity {
    /** 交易对 ID */
    private String id;
    /** 创建时间 */
    private Date createdAt;
    /** 更新时间 */
    private Date updatedAt;
    /** 基础币种 */
    private String baseCurrency;
    /** 计价币种 */
    private String quoteCurrency;
    /** 最小基础币种数量 */
    private BigDecimal baseMinSize;
    /** 最大基础币种数量 */
    private BigDecimal baseMaxSize;
    /** 最小计价币种数量 */
    private BigDecimal quoteMinSize;
    /** 最大计价币种数量 */
    private BigDecimal quoteMaxSize;
    /** 基础币种精度 */
    private int baseScale;
    /** 计价币种精度 */
    private int quoteScale;
    /** 计价币种 increment */
    private float quoteIncrement;
    /** 吃单费率 */
    private float takerFeeRate;
    /** 挂单费率 */
    private float makerFeeRate;
    /** 显示顺序 */
    private int displayOrder;
}

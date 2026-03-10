package com.gitbitex.marketdata.entity;

import com.gitbitex.enums.OrderSide;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.Date;

/**
 * 交易实体类
 * 记录交易对的成交记录
 */
@Getter
@Setter
public class TradeEntity {
    /** 交易 ID */
    private String id;
    /** 创建时间 */
    private Date createdAt;
    /** 更新时间 */
    private Date updatedAt;
    /** 序列号 */
    private long sequence;
    /** 交易对 ID */
    private String productId;
    /** 吃单订单 ID */
    private String takerOrderId;
    /** 挂单订单 ID */
    private String makerOrderId;
    /** 成交价格 */
    private BigDecimal price;
    /** 成交数量 */
    private BigDecimal size;
    /** 成交方向 */
    private OrderSide side;
    /** 成交时间 */
    private Date time;
}

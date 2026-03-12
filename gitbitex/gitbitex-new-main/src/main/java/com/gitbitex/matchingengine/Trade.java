package com.gitbitex.matchingengine;

import com.gitbitex.enums.OrderSide;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.Date;

/**
 * 成交类
 * 记录订单撮合成交的信息
 */
@Getter
@Setter
public class Trade {
    /** 交易对 ID */
    private String productId;
    /** 成交序列号 */
    private long sequence;
    /** 成交数量 */
    private BigDecimal size;
    /** 成交金额 */
    private BigDecimal funds;
    /** 成交价格 */
    private BigDecimal price;
    /** 成交时间 */
    private Date time;
    /** 成交方向 */
    private OrderSide side;
    /** 吃单订单 ID */
    private String takerOrderId;
    /** 挂单订单 ID */
    private String makerOrderId;
}

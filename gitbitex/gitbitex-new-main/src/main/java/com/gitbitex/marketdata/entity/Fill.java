package com.gitbitex.marketdata.entity;

import com.gitbitex.enums.OrderSide;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.Date;

/**
 * 成交明细实体类
 * 记录订单的每笔成交详情
 */
@Getter
@Setter
public class Fill {
    /** 成交明细 ID */
    private String id;
    /** 创建时间 */
    private Date createdAt;
    /** 更新时间 */
    private Date updatedAt;
    /** 订单 ID */
    private String orderId;
    /** 成交 ID */
    private long tradeId;
    /** 交易对 ID */
    private String productId;
    /** 用户 ID */
    private String userId;
    /** 成交数量 */
    private BigDecimal size;
    /** 成交价格 */
    private BigDecimal price;
    /** 成交金额 */
    private BigDecimal funds;
    /** 手续费 */
    private BigDecimal fee;
    /** 流动性（maker/taker） */
    private String liquidity;
    /** 是否已结算 */
    private boolean settled;
    /** 订单方向 */
    private OrderSide side;
    /** 是否已完成 */
    private boolean done;
    /** 完成原因 */
    private String doneReason;
}

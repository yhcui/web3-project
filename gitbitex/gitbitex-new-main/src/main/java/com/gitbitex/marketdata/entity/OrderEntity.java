package com.gitbitex.marketdata.entity;

import com.gitbitex.enums.OrderSide;
import com.gitbitex.enums.OrderStatus;
import com.gitbitex.enums.OrderType;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.Date;

/**
 * 订单实体类
 * 记录用户提交的订单信息
 */
@Getter
@Setter
public class OrderEntity {
    /** 订单 ID */
    private String id;
    /** 创建时间 */
    private Date createdAt;
    /** 更新时间 */
    private Date updatedAt;
    /** 订单序列号 */
    private long sequence;
    /** 交易对 ID */
    private String productId;
    /** 用户 ID */
    private String userId;
    /** 客户端生成的订单 ID */
    private String clientOid;
    /** 订单时间 */
    private Date time;
    /** 订单数量 */
    private BigDecimal size;
    /** 订单金额 */
    private BigDecimal funds;
    /** 已成交数量 */
    private BigDecimal filledSize;
    /** 已成交金额 */
    private BigDecimal executedValue;
    /** 订单价格 */
    private BigDecimal price;
    /** 已成交手续费 */
    private BigDecimal fillFees;
    /** 订单类型（限价/市价） */
    private OrderType type;
    /** 订单方向（买入/卖出） */
    private OrderSide side;
    /** 订单状态 */
    private OrderStatus status;
    /** 订单有效期策略 */
    private String timeInForce;
    /** 是否已结算 */
    private boolean settled;
    /** 是否仅为挂单（post-only） */
    private boolean postOnly;

}



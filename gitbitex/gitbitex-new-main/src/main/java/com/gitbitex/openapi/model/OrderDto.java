package com.gitbitex.openapi.model;

import lombok.Getter;
import lombok.Setter;

/**
 * 订单 DTO
 * 用于传输订单信息
 */
@Getter
@Setter
public class OrderDto {
    /** 订单 ID */
    private String id;
    /** 订单价格 */
    private String price;
    /** 订单数量 */
    private String size;
    /** 订单资金 */
    private String funds;
    /** 交易对 ID */
    private String productId;
    /** 订单方向 */
    private String side;
    /** 订单类型 */
    private String type;
    /** 创建时间 */
    private String createdAt;
    /** 成交手续费 */
    private String fillFees;
    /** 已成交数量 */
    private String filledSize;
    /** 成交额 */
    private String executedValue;
    /** 订单状态 */
    private String status;
}

package com.gitbitex.openapi.model;

import lombok.Getter;
import lombok.Setter;

import javax.validation.constraints.NotBlank;

/**
 * 下单请求
 * 用于提交订单
 */
@Getter
@Setter
public class PlaceOrderRequest {

    /** 客户端订单 ID */
    private String clientOid;

    /** 交易对 ID */
    @NotBlank
    private String productId;

    /** 订单数量 */
    @NotBlank
    private String size;

    /** 订单资金 */
    private String funds;

    /** 订单价格 */
    private String price;

    /** 订单方向 */
    @NotBlank
    private String side;

    /** 订单类型 */
    @NotBlank
    private String type;
    /**
     * [可选] TimeInForce 策略：GTC, GTT, IOC, or FOK (默认是 GTC)
     */
    private String timeInForce;
}

package com.gitbitex.matchingengine.command;

import com.gitbitex.enums.OrderSide;
import com.gitbitex.enums.OrderType;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.Date;

/**
 * 下单命令
 */
@Getter
@Setter
public class PlaceOrderCommand extends Command {
    /** 交易对 ID */
    private String productId;
    /** 订单 ID */
    private String orderId;
    /** 用户 ID */
    private String userId;
    /** 订单数量 */
    private BigDecimal size;
    /** 订单价格 */
    private BigDecimal price;
    /** 订单金额 */
    private BigDecimal funds;
    /** 订单类型 */
    private OrderType orderType;
    /** 订单方向 */
    private OrderSide orderSide;
    /** 订单时间 */
    private Date time;

    public PlaceOrderCommand() {
        this.setType(CommandType.PLACE_ORDER);
    }
}

package com.gitbitex.matchingengine;

import com.gitbitex.enums.OrderSide;
import com.gitbitex.enums.OrderStatus;
import com.gitbitex.enums.OrderType;
import com.gitbitex.matchingengine.command.PlaceOrderCommand;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.Date;

/**
 * 订单类
 * 记录撮合引擎中的订单信息
 */
@Getter
@Setter
public class Order implements Cloneable {
    /** 订单 ID */
    private String id;
    /** 订单序列号 */
    private long sequence;
    /** 用户 ID */
    private String userId;
    /** 订单类型（限价/市价） */
    private OrderType type;
    /** 订单方向（买入/卖出） */
    private OrderSide side;
    /** 剩余数量 */
    private BigDecimal remainingSize;
    /** 订单价格 */
    private BigDecimal price;
    /** 剩余金额 */
    private BigDecimal remainingFunds;
    /** 订单数量 */
    private BigDecimal size;
    /** 订单金额 */
    private BigDecimal funds;
    /** 是否仅为挂单（post-only） */
    private boolean postOnly;
    /** 订单时间 */
    private Date time;
    /** 交易对 ID */
    private String productId;
    /** 订单状态 */
    private OrderStatus status;
    /** 客户端订单 ID */
    private String clientOid;

    /** 默认构造 */
    public Order() {
    }

    /**
     * 从下单命令构造订单
     * @param command 下单命令
     */
    public Order(PlaceOrderCommand command) {
        this.productId = command.getProductId();
        this.userId = command.getUserId();
        this.id = command.getOrderId();
        this.type = command.getOrderType();
        this.side = command.getOrderSide();
        this.price = command.getPrice();
        this.size = command.getSize();
        if (command.getOrderType() == OrderType.LIMIT) {
            this.funds = command.getSize().multiply(command.getPrice());
        } else {
            this.funds = command.getFunds();
        }
        this.remainingSize = this.size;
        this.remainingFunds = this.funds;
        this.time = command.getTime();
    }

    @Override
    public Order clone() {
        try {
            return (Order) super.clone();
        } catch (CloneNotSupportedException e) {
            throw new AssertionError();
        }
    }
}

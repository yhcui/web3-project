package com.gitbitex.matchingengine.command;

import lombok.Getter;
import lombok.Setter;

/**
 * 撤单命令
 * 用于取消已下的订单
 */
@Getter
@Setter
public class CancelOrderCommand extends Command {
    /** 交易对 ID */
    private String productId;
    /** 订单 ID */
    private String orderId;

    public CancelOrderCommand() {
        this.setType(CommandType.CANCEL_ORDER);
    }
}

package com.gitbitex.matchingengine.message;

import com.gitbitex.matchingengine.Trade;
import lombok.Getter;
import lombok.Setter;

/**
 * 成交消息
 * 推送订单撮合成交信息
 */
@Getter
@Setter
public class TradeMessage extends Message {
    /** 成交信息 */
    private Trade trade;

    public TradeMessage() {
        this.setMessageType(MessageType.TRADE);
    }
}

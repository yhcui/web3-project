package com.gitbitex.matchingengine.message;

import com.gitbitex.matchingengine.Product;
import lombok.Getter;
import lombok.Setter;

/**
 * 交易对消息
 * 推送交易对变更信息
 */
@Getter
@Setter
public class ProductMessage extends Message {
    /** 交易对信息 */
    private Product product;

    public ProductMessage() {
        this.setMessageType(MessageType.PRODUCT);
    }
}

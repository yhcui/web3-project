package com.gitbitex.matchingengine.command;

import lombok.Getter;
import lombok.Setter;

/**
 * 添加交易对命令
 * 用于创建新的交易对
 */
@Getter
@Setter
public class PutProductCommand extends Command {
    /** 交易对 ID */
    private String productId;
    /** 基础币种 */
    private String baseCurrency;
    /** 报价币种 */
    private String quoteCurrency;

    public PutProductCommand() {
        this.setType(CommandType.PUT_PRODUCT);
    }
}

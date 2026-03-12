package com.gitbitex.matchingengine.command;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

/**
 * 充值命令
 */
@Getter
@Setter
public class DepositCommand extends Command {
    /** 用户 ID */
    private String userId;
    /** 币种 */
    private String currency;
    /** 金额 */
    private BigDecimal amount;
    /** 交易 ID */
    private String transactionId;

    public DepositCommand() {
        this.setType(CommandType.DEPOSIT);
    }
}

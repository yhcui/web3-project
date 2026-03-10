package com.gitbitex.wallet;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

/**
 * 交易实体类
 * 记录区块链提现交易信息
 */
@Getter
@Setter
public class Transaction {
    /** 交易 ID */
    private String id;
    /** 用户 ID */
    private String userId;
    /** 序列号 */
    private long sequence;
    /** 币种 */
    private String currency;
    /** 交易金额 */
    private BigDecimal amount;
    /** 是否已提交到区块链 */
    private boolean submitted;
}

package com.gitbitex.matchingengine;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

/**
 * 账户类
 * 记录用户在撮合引擎中的账户余额信息
 */
@Getter
@Setter
public class Account implements Cloneable {
    /** 账户 ID */
    private String id;
    /** 用户 ID */
    private String userId;
    /** 币种 */
    private String currency;
    /** 可用余额 */
    private BigDecimal available;
    /** 冻结金额 */
    private BigDecimal hold;

    @Override
    public Account clone() {
        try {
            return (Account) super.clone();
        } catch (CloneNotSupportedException e) {
            throw new AssertionError();
        }
    }
}

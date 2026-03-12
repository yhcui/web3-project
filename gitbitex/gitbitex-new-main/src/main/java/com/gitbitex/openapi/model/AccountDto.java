package com.gitbitex.openapi.model;

import lombok.Getter;
import lombok.Setter;

/**
 * 账户 DTO
 * 用于传输账户信息
 */
@Getter
@Setter
public class AccountDto {
    /** 账户 ID */
    private String id;
    /** 币种 */
    private String currency;
    /** 币种图标 URL */
    private String currencyIcon;
    /** 可用金额 */
    private String available;
    /** 冻结金额 */
    private String hold;
}


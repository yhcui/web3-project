package com.gitbitex.marketdata.entity;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.Date;

/**
 * 账户实体类
 * 记录用户的币种账户余额信息
 */
@Getter
@Setter
public class AccountEntity {
    /** 账户 ID */
    private String id;
    /** 创建时间 */
    private Date createdAt;
    /** 更新时间 */
    private Date updatedAt;
    /** 用户 ID */
    private String userId;
    /** 币种 */
    private String currency;
    /** 冻结金额 */
    private BigDecimal hold;
    /** 可用金额 */
    private BigDecimal available;
}

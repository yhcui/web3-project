package com.gitbitex.marketdata.entity;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.Date;

/**
 * 账单实体类
 * 记录用户账户资金变动明细
 */
@Getter
@Setter
public class Bill {
    /** 账单 ID */
    private String id;
    /** 创建时间 */
    private Date createdAt;
    /** 更新时间 */
    private Date updatedAt;
    /** 用户 ID */
    private String userId;
    /** 币种 */
    private String currency;
    /** 冻结金额变动 */
    private BigDecimal holdIncrement;
    /** 可用金额变动 */
    private BigDecimal availableIncrement;
    /** 变动类型 */
    private String type;
    /** 是否已结算 */
    private boolean settled;
    /** 备注 */
    private String notes;
}


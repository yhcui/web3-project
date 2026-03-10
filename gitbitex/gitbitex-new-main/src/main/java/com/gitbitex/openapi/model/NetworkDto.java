package com.gitbitex.openapi.model;

import lombok.Getter;
import lombok.Setter;

/**
 * 网络交易 DTO
 * 用于传输区块链交易信息
 */
@Getter
@Setter
public class NetworkDto {
    /** 交易状态 */
    private String status;
    /** 交易哈希 */
    private String hash;
    /** 交易金额 */
    private String amount;
    /** 手续费金额 */
    private String feeAmount;
    /** 手续费币种 */
    private String feeCurrency;
    /** 确认数 */
    private int confirmations;
    /** 资源 URL */
    private String resourceUrl;
}

package com.gitbitex.openapi.model;

import lombok.Getter;
import lombok.Setter;

/**
 * 交易对 DTO
 * 用于传输交易对信息
 */
@Getter
@Setter
public class ProductDto {
    /** 交易对 ID */
    private String id;
    /** 基础币种 */
    private String baseCurrency;
    /** 报价币种 */
    private String quoteCurrency;
    /** 最小交易数量 */
    private String baseMinSize;
    /** 最大交易数量 */
    private String baseMaxSize;
    /** 价格精度 */
    private String quoteIncrement;
    /** 数量精度 */
    private int baseScale;
    /** 价格精度 */
    private int quoteScale;
}

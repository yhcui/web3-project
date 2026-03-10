package com.gitbitex.openapi.model;

import lombok.Getter;
import lombok.Setter;

/**
 * 成交 DTO
 * 用于传输成交信息
 */
@Getter
@Setter
public class TradeDto {
    /** 序列号 */
    private long sequence;
    /** 成交时间 */
    private String time;
    /** 成交价格 */
    private String price;
    /** 成交数量 */
    private String size;
    /** 成交方向 */
    private String side;
}

package com.gitbitex.enums;

/**
 * 订单状态枚举
 */
public enum OrderStatus {
    /** 已拒绝 */
    REJECTED,
    /** 已接收 */
    RECEIVED,
    /** 开放中（部分成交） */
    OPEN,
    /** 已取消 */
    CANCELLED,
    /** 已完全成交 */
    FILLED,
}

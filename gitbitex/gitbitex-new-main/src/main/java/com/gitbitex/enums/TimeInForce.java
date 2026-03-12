package com.gitbitex.enums;

/**
 * 订单有效期策略枚举
 * GTC - 撤销前有效（Good Till Canceled）
 * GTT - 指定时间前有效（Good Till Time）
 * IOC - 立即成交或取消（Immediate or Cancel）
 * FOK - 全部成交或取消（Fill or Kill）
 */
public enum TimeInForce {
    /** 撤销前有效 */
    GTC,
    /** 指定时间前有效 */
    GTT,
    /** 立即成交或取消 */
    IOC,
    /** 全部成交或取消 */
    FOK,
}

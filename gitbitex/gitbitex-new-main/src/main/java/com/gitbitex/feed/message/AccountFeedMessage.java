package com.gitbitex.feed.message;

import lombok.Getter;
import lombok.Setter;

/**
 * 账户资金 Feed 消息
 * 推送用户账户资金变动信息
 */
@Getter
@Setter
public class AccountFeedMessage {
    /** 消息类型 */
    private String type = "funds";
    /** 交易对 ID */
    private String productId;
    /** 用户 ID */
    private String userId;
    /** 币种代码 */
    private String currencyCode;
    /** 可用金额 */
    private String available;
    /** 冻结金额 */
    private String hold;
}

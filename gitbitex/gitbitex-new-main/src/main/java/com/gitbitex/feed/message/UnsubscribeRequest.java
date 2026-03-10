package com.gitbitex.feed.message;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

/**
 * 取消订阅请求
 * 用于取消 WebSocket Feed 消息订阅
 */
@Getter
@Setter
public class UnsubscribeRequest extends Request {
    /** 交易对 ID 列表 */
    private List<String> productIds;
    /** 币种 ID 列表 */
    private List<String> currencyIds;
    /** 订阅频道列表 */
    private List<String> channels;
}

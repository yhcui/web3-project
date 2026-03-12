package com.gitbitex.feed.message;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

/**
 * 订阅请求
 * 用于订阅 WebSocket Feed 消息
 */
@Getter
@Setter
public class SubscribeRequest extends Request {
    /** 交易对 ID 列表 */
    private List<String> productIds;
    /** 币种 ID 列表 */
    private List<String> currencyIds;
    /** 订阅频道列表 */
    private List<String> channels;
}

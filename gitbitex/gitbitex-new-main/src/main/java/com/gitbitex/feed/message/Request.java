package com.gitbitex.feed.message;

import lombok.Getter;
import lombok.Setter;

/**
 * Feed 请求基类
 * WebSocket 订阅/取消订阅请求的父类
 */
@Getter
@Setter
public class Request {
    /** 请求类型 */
    private String type;
}

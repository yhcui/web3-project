package com.gitbitex.feed.message;

import lombok.Getter;
import lombok.Setter;

/**
 * Ping/Pong 心跳响应消息
 * 用于 WebSocket 连接心跳检测
 */
@Getter
@Setter
public class PongFeedMessage {
    /** 消息类型 */
    private String type;
}

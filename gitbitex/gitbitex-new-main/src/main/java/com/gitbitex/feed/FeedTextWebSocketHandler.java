package com.gitbitex.feed;

import com.alibaba.fastjson.JSON;
import com.gitbitex.feed.message.Request;
import com.gitbitex.feed.message.SubscribeRequest;
import com.gitbitex.feed.message.UnsubscribeRequest;
import lombok.RequiredArgsConstructor;
import lombok.SneakyThrows;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

/**
 * WebSocket 文本消息处理器
 * 处理客户端发送的订阅、取消订阅、心跳等消息
 */
@Component
@RequiredArgsConstructor
public class FeedTextWebSocketHandler extends TextWebSocketHandler {
    private final SessionManager sessionManager;

    /**
     * 连接建立后处理
     * @param session WebSocket 会话
     */
    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
    }

    /**
     * 连接关闭后处理
     * @param session WebSocket 会话
     * @param status 关闭状态
     */
    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        sessionManager.removeSession(session);
    }

    /**
     * 处理文本消息
     * @param session WebSocket 会话
     * @param message 文本消息
     */
    @Override
    @SneakyThrows
    public void handleTextMessage(WebSocketSession session, TextMessage message) {
        Request request = JSON.parseObject(message.getPayload(), Request.class);

        switch (request.getType()) {
            case "subscribe": {
                SubscribeRequest subscribeRequest = JSON.parseObject(message.getPayload(), SubscribeRequest.class);
                sessionManager.subOrUnSub(session, subscribeRequest.getProductIds(), subscribeRequest.getCurrencyIds(),
                        subscribeRequest.getChannels(), true);
                break;
            }
            case "unsubscribe": {
                UnsubscribeRequest unsubscribeRequest = JSON.parseObject(message.getPayload(),
                        UnsubscribeRequest.class);
                sessionManager.subOrUnSub(session, unsubscribeRequest.getProductIds(),
                        unsubscribeRequest.getCurrencyIds(),
                        unsubscribeRequest.getChannels(), false);
                break;
            }
            case "ping":
                sessionManager.sendPong(session);
                break;
            default:
        }
    }

}

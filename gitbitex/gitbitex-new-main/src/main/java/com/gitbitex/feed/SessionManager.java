package com.gitbitex.feed;

import com.alibaba.fastjson.JSON;
import com.gitbitex.feed.message.L2SnapshotFeedMessage;
import com.gitbitex.feed.message.L2UpdateFeedMessage;
import com.gitbitex.feed.message.PongFeedMessage;
import com.gitbitex.feed.message.TickerFeedMessage;
import com.gitbitex.marketdata.entity.Ticker;
import com.gitbitex.marketdata.manager.TickerManager;
import com.gitbitex.marketdata.orderbook.L2OrderBook;
import com.gitbitex.marketdata.orderbook.L2OrderBookChange;
import com.gitbitex.marketdata.orderbook.OrderBookSnapshotManager;
import com.gitbitex.stripexecutor.StripedExecutorService;
import lombok.RequiredArgsConstructor;
import lombok.SneakyThrows;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import java.io.IOException;
import java.util.List;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentSkipListSet;

/**
 * WebSocket 会话管理器
 * 管理客户端连接会话，处理订阅/取消订阅、消息推送等功能
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class SessionManager {
    /** 频道对应的会话 ID 映射 */
    private final ConcurrentHashMap<String, ConcurrentSkipListSet<String>> sessionIdsByChannel
            = new ConcurrentHashMap<>();
    /** 会话 ID 对应的频道映射 */
    private final ConcurrentHashMap<String, ConcurrentSkipListSet<String>> channelsBySessionId
            = new ConcurrentHashMap<>();
    /** 会话 ID 对应的 WebSocket 会话映射 */
    private final ConcurrentHashMap<String, WebSocketSession> sessionById = new ConcurrentHashMap<>();
    /** 订单簿快照管理器 */
    private final OrderBookSnapshotManager orderBookSnapshotManager;
    /** 行情管理器 */
    private final TickerManager tickerManager;
    /** 消息发送执行器 */
    private final StripedExecutorService messageSenderExecutor =
            new StripedExecutorService(Runtime.getRuntime().availableProcessors());

    /**
     * 订阅或取消订阅频道
     * @param session WebSocket 会话
     * @param productIds 产品 ID 列表
     * @param currencies 币种列表
     * @param channels 频道列表
     * @param isSub 是否订阅
     */
    @SneakyThrows
    public void subOrUnSub(WebSocketSession session, List<String> productIds, List<String> currencies,
                           List<String> channels, boolean isSub) {
        for (String channel : channels) {
            switch (channel) {
                case "level2":
                    for (String productId : productIds) {
                        String productChannel = productId + "." + channel;

                        if (isSub) {
                            subscribeChannel(session, productChannel);
                            sendL2OrderBookSnapshot(session, productId);
                        } else {
                            String key = "LAST_L2_ORDER_BOOK:" + productId;
                            session.getAttributes().remove(key);
                            unsubscribeChannel(session, productChannel);
                        }
                    }
                    break;
                case "ticker":
                    for (String productId : productIds) {
                        String productChannel = productId + "." + channel;

                        if (isSub) {
                            subscribeChannel(session, productChannel);
                            sendTicker(session, productId);
                        } else {
                            unsubscribeChannel(session, productChannel);
                        }
                    }
                    break;
                case "match":
                    for (String productId : productIds) {
                        String productChannel = productId + "." + channel;
                        if (isSub) {
                            subscribeChannel(session, productChannel);
                        } else {
                            unsubscribeChannel(session, productChannel);
                        }
                    }
                    break;
                case "order": {
                    String userId = getUserId(session);
                    if (userId == null) {
                        return;
                    }

                    for (String productId : productIds) {
                        String orderChanel = userId + "." + productId + "." + channel;
                        if (isSub) {
                            subscribeChannel(session, orderChanel);
                        } else {
                            unsubscribeChannel(session, orderChanel);
                        }
                    }
                    break;
                }
                case "funds": {
                    String userId = getUserId(session);
                    if (userId == null) {
                        return;
                    }

                    if (currencies != null) {
                        for (String currency : currencies) {
                            String accountChannel = userId + "." + currency + "." + channel;
                            if (isSub) {
                                subscribeChannel(session, accountChannel);
                            } else {
                                unsubscribeChannel(session, accountChannel);
                            }
                        }
                    }
                    break;
                }

                default:
            }
        }
    }

    /**
     * 向指定频道的所有会话广播消息
     * @param channel 频道名称
     * @param message 消息内容
     */
    public void broadcast(String channel, Object message) {
        Set<String> sessionIds = sessionIdsByChannel.get(channel);
        if (sessionIds == null || sessionIds.isEmpty()) {
            return;
        }

        sessionIds.forEach(sessionId -> {
            messageSenderExecutor.execute(sessionId, () -> {
                try {
                    WebSocketSession session = sessionById.get(sessionId);
                    if (session == null) {
                        return;
                    }
                    if (message instanceof L2OrderBook) {
                        doSendL2OrderBook(session, (L2OrderBook) message);
                    } else {
                        doSendJson(session, message);
                    }
                } catch (Exception e) {
                    logger.error("send error: {}", e.getMessage());
                }
            });
        });
    }

    /**
     * 发送 L2 订单簿快照
     * @param session WebSocket 会话
     * @param productId 产品 ID
     */
    private void sendL2OrderBookSnapshot(WebSocketSession session, String productId) {
        messageSenderExecutor.execute(session.getId(), () -> {
            try {
                L2OrderBook l2OrderBook = orderBookSnapshotManager.getL2BatchOrderBook(productId);
                if (l2OrderBook != null) {
                    doSendL2OrderBook(session, l2OrderBook);
                }
            } catch (Exception e) {
                logger.error("send level2 snapshot error: {}", e.getMessage(), e);
            }
        });
    }

    /**
     * 发送 L2 订单簿数据
     * @param session WebSocket 会话
     * @param l2OrderBook L2 订单簿
     */
    private void doSendL2OrderBook(WebSocketSession session, L2OrderBook l2OrderBook) throws IOException {
        String key = "LAST_L2_ORDER_BOOK:" + l2OrderBook.getProductId();

        if (!session.getAttributes().containsKey(key)) {
            doSendJson(session, new L2SnapshotFeedMessage(l2OrderBook));
            session.getAttributes().put(key, l2OrderBook);
            return;
        }

        L2OrderBook lastL2OrderBook = (L2OrderBook) session.getAttributes().get(key);
        if (lastL2OrderBook.getSequence() >= l2OrderBook.getSequence()) {
            logger.warn("discard l2 order book, too old: last={} new={}", lastL2OrderBook.getSequence(),
                    l2OrderBook.getSequence());
            return;
        }

        List<L2OrderBookChange> changes = lastL2OrderBook.diff(l2OrderBook);
        if (changes != null && !changes.isEmpty()) {
            L2UpdateFeedMessage l2UpdateFeedMessage = new L2UpdateFeedMessage(l2OrderBook.getProductId(), changes);
            doSendJson(session, l2UpdateFeedMessage);
        }

        session.getAttributes().put(key, l2OrderBook);
    }

    /**
     * 发送行情数据
     * @param session WebSocket 会话
     * @param productId 产品 ID
     */
    private void sendTicker(WebSocketSession session, String productId) {
        messageSenderExecutor.execute(session.getId(), () -> {
            try {
                Ticker ticker = tickerManager.getTicker(productId);
                if (ticker != null) {
                    doSendJson(session, new TickerFeedMessage(ticker));
                }
            } catch (Exception e) {
                logger.error("send ticker error: {}", e.getMessage(), e);
            }
        });
    }

    /**
     * 发送心跳响应
     * @param session WebSocket 会话
     */
    public void sendPong(WebSocketSession session) {
        messageSenderExecutor.execute(session.getId(), () -> {
            try {
                PongFeedMessage pongFeedMessage = new PongFeedMessage();
                pongFeedMessage.setType("pong");
                session.sendMessage(new TextMessage(JSON.toJSONString(pongFeedMessage)));
            } catch (Exception e) {
                logger.error("send pong error: {}", e.getMessage());
            }
        });
    }

    /**
     * 发送 JSON 消息
     * @param session WebSocket 会话
     * @param msg 消息对象
     */
    private void doSendJson(WebSocketSession session, Object msg) {
        try {
            session.sendMessage(new TextMessage(JSON.toJSONString(msg)));
        } catch (Exception e) {
            logger.error("send websocket message error: {}", e.getMessage());
        }
    }

    /**
     * 订阅频道
     * @param session WebSocket 会话
     * @param channel 频道名称
     */
    private void subscribeChannel(WebSocketSession session, String channel) {
        sessionIdsByChannel
                .computeIfAbsent(channel, k -> new ConcurrentSkipListSet<>())
                .add(session.getId());
        channelsBySessionId.computeIfAbsent(session.getId(), k -> new ConcurrentSkipListSet<>())
                .add(channel);
        sessionById.put(session.getId(), session);
    }

    /**
     * 取消订阅频道
     * @param session WebSocket 会话
     * @param channel 频道名称
     */
    public void unsubscribeChannel(WebSocketSession session, String channel) {
        if (sessionIdsByChannel.containsKey(channel)) {
            sessionIdsByChannel.get(channel).remove(session.getId());
        }
        channelsBySessionId.computeIfPresent(session.getId(), (k, v) -> {
            v.remove(channel);
            return v;
        });
    }

    /**
     * 移除会话
     * @param session WebSocket 会话
     */
    public void removeSession(WebSocketSession session) {
        ConcurrentSkipListSet<String> channels = channelsBySessionId.remove(session.getId());
        if (channels != null) {
            for (String channel : channels) {
                ConcurrentSkipListSet<String> sessionIds = sessionIdsByChannel.get(channel);
                if (sessionIds != null) {
                    sessionIds.remove(session.getId());
                }
            }
        }
        sessionById.remove(session.getId());
    }

    /**
     * 获取当前会话的用户 ID
     * @param session WebSocket 会话
     * @return 用户 ID
     */
    public String getUserId(WebSocketSession session) {
        Object val = session.getAttributes().get("CURRENT_USER_ID");
        return val != null ? val.toString() : null;
    }

}

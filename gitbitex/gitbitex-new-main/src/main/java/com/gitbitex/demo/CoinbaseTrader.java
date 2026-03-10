package com.gitbitex.demo;

import com.alibaba.fastjson.JSON;
import com.gitbitex.AppProperties;
import com.gitbitex.marketdata.entity.User;
import com.gitbitex.openapi.controller.AdminController;
import com.gitbitex.openapi.controller.AdminController.PutProductRequest;
import com.gitbitex.openapi.controller.OrderController;
import com.gitbitex.openapi.model.PlaceOrderRequest;
import com.google.common.util.concurrent.RateLimiter;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import org.java_websocket.drafts.Draft_6455;
import org.java_websocket.enums.ReadyState;
import org.java_websocket.handshake.ServerHandshake;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.Random;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

/**
 * Coinbase 交易器演示类
 * 用于演示如何对接 Coinbase 交易所
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class CoinbaseTrader {
    /** 限流器，限制每秒 10 次请求 */
    private static final RateLimiter rateLimiter = RateLimiter.create(10);
    /** 订单控制器 */
    private final OrderController orderController;
    /** 执行器线程池 */
    private final ExecutorService executor = Executors.newFixedThreadPool(1);
    /** 定时执行器线程池 */
    private final ScheduledExecutorService scheduledExecutor = Executors.newScheduledThreadPool(1);
    /** 应用配置 */
    private final AppProperties appProperties;
    /** 管理员控制器 */
    private final AdminController adminController;

    /**
     * 初始化方法
     * 创建测试用户和交易对，连接 Coinbase WebSocket
     * @throws URISyntaxException URI 语法异常
     */
    @PostConstruct
    public void init() throws URISyntaxException {
        logger.info("start");

        User user = adminController.createUser("test@test.com", "12345678");
        PutProductRequest putProductRequest = new PutProductRequest();
        putProductRequest.setBaseCurrency("BTC");
        putProductRequest.setQuoteCurrency("USDT");
        adminController.saveProduct(putProductRequest);
        adminController.deposit(user.getId(), "BTC", "100000000000");
        adminController.deposit(user.getId(), "USDT", "100000000000");

        MyClient client = new MyClient(new URI("wss://ws-feed.exchange.coinbase.com"), user);

        scheduledExecutor.scheduleAtFixedRate(() -> {
            try {
                test(user);
                if (true) {
                    return;
                }

                if (!client.isOpen()) {
                    try {
                        if (client.getReadyState().equals(ReadyState.NOT_YET_CONNECTED)) {
                            logger.info("connecting...: {}", client.getURI());
                            client.connectBlocking();
                        } else if (client.getReadyState().equals(ReadyState.CLOSING) || client.getReadyState().equals(
                                ReadyState.CLOSED)) {
                            logger.info("reconnecting...: {}", client.getURI());
                            client.reconnectBlocking();
                        }
                    } catch (Exception e) {
                        logger.error("ws error ", e);
                    }
                } else {
                    client.sendPing();
                }
            } catch (Exception e) {
                logger.error("send ping error: {}", e.getMessage(), e);
            }
        }, 0, 1, TimeUnit.SECONDS);
    }

    /**
     * 销毁方法
     * 关闭线程池
     */
    @PreDestroy
    public void destroy() {
        executor.shutdown();
        scheduledExecutor.shutdown();
    }

    /**
     * 测试方法
     * 随机生成订单并下单
     * @param user 用户
     */
    public void test(User user) {
        PlaceOrderRequest order = new PlaceOrderRequest();
        order.setProductId("BTC-USDT");
        order.setClientOid(UUID.randomUUID().toString());
        order.setPrice(String.valueOf(new Random().nextInt(10) + 1));
        order.setSize(String.valueOf(new Random().nextInt(10) + 1));
        order.setFunds(String.valueOf(new Random().nextInt(10) + 1));
        order.setSide(new Random().nextBoolean() ? "BUY" : "SELL");
        order.setType("limit");
        orderController.placeOrder(order, user);
    }

    /**
     * 频道消息
     * 用于接收 Coinbase WebSocket 消息
     */
    @Getter
    @Setter
    public static class ChannelMessage {
        private String type;
        private String product_id;
        private long tradeId;
        private long sequence;
        private String taker_order_id;
        private String maker_order_id;
        private String time;
        private String size;
        private String price;
        private String side;
        private String orderId;
        private String remaining_size;
        private String funds;
        private String order_type;
        private String reason;
    }

    /**
     * WebSocket 客户端
     * 用于连接 Coinbase WebSocket Feed
     */
    public class MyClient extends org.java_websocket.client.WebSocketClient {
        private final User user;

        /**
         * 构造 WebSocket 客户端
         * @param serverUri 服务器 URI
         * @param user 用户
         */
        public MyClient(URI serverUri, User user) {
            super(serverUri, new Draft_6455(), null, 1000);
            this.user = user;
        }

        /**
         * 连接打开时的回调
         * @param serverHandshake 握手信息
         */
        @Override
        public void onOpen(ServerHandshake serverHandshake) {
            logger.info("open");

            send("{\"type\":\"subscribe\",\"product_ids\":[\"BTC-USD\"],\"channels\":[\"full\"],\"token\":\"\"}");
        }

        /**
         * 收到消息时的回调
         * @param s 消息内容
         */
        @Override
        public void onMessage(String s) {
            if (!rateLimiter.tryAcquire()) {
                return;
            }
            executor.execute(() -> {
                try {
                    ChannelMessage message = JSON.parseObject(s, ChannelMessage.class);
                    String productId = message.getProduct_id() + "T";
                    switch (message.getType()) {
                        case "received":
                            //logger.info(JSON.toJSONString(message));
                            if (message.getPrice() != null) {
                                PlaceOrderRequest order = new PlaceOrderRequest();
                                order.setProductId(productId);
                                order.setClientOid(UUID.randomUUID().toString());
                                order.setPrice(message.getPrice());
                                order.setSize(message.getSize());
                                order.setFunds(message.getFunds());
                                order.setSide(message.getSide().toLowerCase());
                                order.setType("limit");
                                orderController.placeOrder(order, user);
                            }
                            break;
                        case "done":
                            adminController.cancelOrder(message.getOrderId(), productId);
                            break;
                        default:
                    }
                } catch (Exception e) {
                    logger.error("error: {}", e.getMessage(), e);
                }
            });
        }

        /**
         * 连接关闭时的回调
         * @param i 关闭码
         * @param s 关闭原因
         * @param b 是否远程关闭
         */
        @Override
        public void onClose(int i, String s, boolean b) {
            logger.info("connection closed");
        }

        /**
         * 发生错误时的回调
         * @param e 异常
         */
        @Override
        public void onError(Exception e) {
            logger.error("error", e);
        }
    }
}

package com.gitbitex.marketdata;

import com.gitbitex.AppProperties;
import com.gitbitex.enums.OrderStatus;
import com.gitbitex.marketdata.orderbook.L2OrderBook;
import com.gitbitex.marketdata.orderbook.OrderBook;
import com.gitbitex.marketdata.orderbook.OrderBookSnapshotManager;
import com.gitbitex.matchingengine.Order;
import com.gitbitex.matchingengine.Product;
import com.gitbitex.matchingengine.message.Message;
import com.gitbitex.matchingengine.message.OrderMessage;
import com.gitbitex.matchingengine.snapshot.EngineSnapshotManager;
import com.gitbitex.matchingengine.snapshot.EngineState;
import com.gitbitex.middleware.kafka.KafkaConsumerThread;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRebalanceListener;
import org.apache.kafka.clients.consumer.KafkaConsumer;
import org.apache.kafka.common.TopicPartition;

import java.time.Duration;
import java.util.Collection;
import java.util.Collections;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 订单簿快照线程
 * 负责消费订单消息并生成订单簿快照
 */
@Slf4j
public class OrderBookSnapshotThread extends KafkaConsumerThread<String, Message> implements ConsumerRebalanceListener {
    /** 订单簿映射 */
    private final ConcurrentHashMap<String, OrderBook> orderBooks = new ConcurrentHashMap<>();
    /** L2 订单簿映射 */
    private final ConcurrentHashMap<String, L2OrderBook> l2OrderBooks = new ConcurrentHashMap<>();
    /** 订单簿快照管理器 */
    private final OrderBookSnapshotManager orderBookSnapshotManager;
    /** 引擎快照管理器 */
    private final EngineSnapshotManager stateStore;
    /** 应用配置 */
    private final AppProperties appProperties;

    /**
     * 构造订单簿快照线程
     * @param consumer Kafka 消费者
     * @param orderBookSnapshotManager 订单簿快照管理器
     * @param engineSnapshotManager 引擎快照管理器
     * @param appProperties 应用配置
     */
    public OrderBookSnapshotThread(KafkaConsumer<String, Message> consumer,
                                   OrderBookSnapshotManager orderBookSnapshotManager,
                                   EngineSnapshotManager engineSnapshotManager,
                                   AppProperties appProperties) {
        super(consumer, logger);
        this.orderBookSnapshotManager = orderBookSnapshotManager;
        this.stateStore = engineSnapshotManager;
        this.appProperties = appProperties;
    }

    /**
     * 分区撤销时的回调
     * @param collection 撤销的分区集合
     */
    @Override
    public void onPartitionsRevoked(Collection<TopicPartition> collection) {

    }

    /**
     * 分区分配时的回调
     * 从引擎状态恢复订单簿
     * @param partitions 分配的分区集合
     */
    @Override
    public void onPartitionsAssigned(Collection<TopicPartition> partitions) {
        // restore order book from engine state
        stateStore.runInSession(session -> {
            EngineState engineState = stateStore.getEngineState(session);
            if (engineState != null && engineState.getMessageOffset() != null) {
                this.consumer.seek(partitions.iterator().next(), engineState.getMessageOffset() + 1);
            }

            // restore order books
            for (Product product : this.stateStore.getProducts(session)) {
                orderBooks.remove(product.getId());
                for (Order order : stateStore.getOrders(session, product.getId())) {
                    OrderBook orderBook = getOrderBook(product.getId());
                    orderBook.addOrder(order);
                }
            }
        });
    }

    /**
     * 执行订阅操作
     */
    @Override
    protected void doSubscribe() {
        consumer.subscribe(Collections.singletonList(appProperties.getMatchingEngineMessageTopic()), this);
    }

    /**
     * 执行轮询操作，消费订单消息并生成快照
     */
    @Override
    protected void doPoll() {
        var records = consumer.poll(Duration.ofSeconds(5));
        records.forEach(x -> {
            Message message = x.value();
            if (message instanceof OrderMessage orderMessage) {
                Order order = orderMessage.getOrder();
                OrderBook orderBook = getOrderBook(order.getProductId());
                if (order.getStatus() == OrderStatus.OPEN) {
                    orderBook.addOrder(order);
                } else {
                    orderBook.removeOrder(order);
                }
                orderBook.setSequence(orderMessage.getOrderBookSequence());
            }
        });

        orderBooks.entrySet().parallelStream().forEach(e -> {
            String productId=e.getKey();
            OrderBook orderBook= e.getValue();
            L2OrderBook l2OrderBook = l2OrderBooks.get(productId);
            if (l2OrderBook == null ||
                    orderBook.getSequence() - l2OrderBook.getSequence() > 1000 ||
                    System.currentTimeMillis() - l2OrderBook.getTime() > 1000) {
                takeL2OrderBookSnapshot(orderBook);
            }
        });
    }

    /**
     * 获取指定交易对的订单簿
     * @param productId 交易对 ID
     * @return 订单簿
     */
    private OrderBook getOrderBook(String productId) {
        OrderBook orderBook = orderBooks.get(productId);
        if (orderBook == null) {
            orderBook = new OrderBook(productId);
            orderBooks.put(productId, orderBook);
        }
        return orderBook;
    }

    /**
     * 生成 L2 订单簿快照
     * @param orderBook 订单簿
     */
    private void takeL2OrderBookSnapshot(OrderBook orderBook) {
        logger.info("taking level2 order book snapshot: sequence={}", orderBook.getSequence());
        L2OrderBook l2OrderBook = new L2OrderBook(orderBook, 25);
        l2OrderBooks.put(orderBook.getProductId(), l2OrderBook);
        orderBookSnapshotManager.saveL2BatchOrderBook(l2OrderBook);
    }

}

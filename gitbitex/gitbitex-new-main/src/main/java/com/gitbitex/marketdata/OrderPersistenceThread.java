package com.gitbitex.marketdata;

import com.alibaba.fastjson.JSON;
import com.gitbitex.AppProperties;
import com.gitbitex.marketdata.entity.OrderEntity;
import com.gitbitex.marketdata.manager.OrderManager;
import com.gitbitex.matchingengine.Order;
import com.gitbitex.matchingengine.message.Message;
import com.gitbitex.matchingengine.message.OrderMessage;
import com.gitbitex.middleware.kafka.KafkaConsumerThread;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRebalanceListener;
import org.apache.kafka.clients.consumer.KafkaConsumer;
import org.apache.kafka.common.TopicPartition;
import org.redisson.api.RTopic;
import org.redisson.api.RedissonClient;
import org.redisson.client.codec.StringCodec;

import java.time.Duration;
import java.util.*;

/**
 * 订单持久化线程
 * 负责消费订单消息并持久化到数据库
 */
@Slf4j
public class OrderPersistenceThread extends KafkaConsumerThread<String, Message> implements ConsumerRebalanceListener {
    /** 应用配置 */
    private final AppProperties appProperties;
    /** 订单管理器 */
    private final OrderManager orderManager;
    /** 订单 Redis 主题 */
    private final RTopic orderTopic;

    /**
     * 构造订单持久化线程
     * @param kafkaConsumer Kafka 消费者
     * @param orderManager 订单管理器
     * @param redissonClient Redisson 客户端
     * @param appProperties 应用配置
     */
    public OrderPersistenceThread(KafkaConsumer<String, Message> kafkaConsumer, OrderManager orderManager,
                                  RedissonClient redissonClient,
                                  AppProperties appProperties) {
        super(kafkaConsumer, logger);
        this.appProperties = appProperties;
        this.orderManager = orderManager;
        this.orderTopic = redissonClient.getTopic("order", StringCodec.INSTANCE);
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
     * @param collection 分配的分区集合
     */
    @Override
    public void onPartitionsAssigned(Collection<TopicPartition> collection) {

    }

    /**
     * 执行订阅操作
     */
    @Override
    protected void doSubscribe() {
        consumer.subscribe(Collections.singletonList(appProperties.getMatchingEngineMessageTopic()), this);
    }

    /**
     * 执行轮询操作，消费并处理订单消息
     */
    @Override
    protected void doPoll() {
        var records = consumer.poll(Duration.ofSeconds(5));
        Map<String, OrderEntity> orders = new HashMap<>();
        records.forEach(x -> {
            Message message = x.value();
            if (message instanceof OrderMessage orderMessage) {
                OrderEntity orderEntity = orderEntity(orderMessage);
                orders.put(orderEntity.getId(), orderEntity);
                orderTopic.publishAsync(JSON.toJSONString(orderMessage));
            }
        });
        orderManager.saveAll(orders.values());

        consumer.commitAsync();
    }

    /**
     * 将订单消息转换为订单实体
     * @param message 订单消息
     * @return 订单实体
     */
    private OrderEntity orderEntity(OrderMessage message) {
        Order order = message.getOrder();
        OrderEntity orderEntity = new OrderEntity();
        orderEntity.setId(order.getId());
        orderEntity.setSequence(order.getSequence());
        orderEntity.setProductId(order.getProductId());
        orderEntity.setUserId(order.getUserId());
        orderEntity.setStatus(order.getStatus());
        orderEntity.setPrice(order.getPrice());
        orderEntity.setSize(order.getSize());
        orderEntity.setFunds(order.getFunds());
        orderEntity.setClientOid(order.getClientOid());
        orderEntity.setSide(order.getSide());
        orderEntity.setType(order.getType());
        orderEntity.setTime(order.getTime());
        orderEntity.setCreatedAt(new Date());
        orderEntity.setFilledSize(order.getSize().subtract(order.getRemainingSize()));
        orderEntity.setExecutedValue(order.getFunds().subtract(order.getRemainingFunds()));
        return orderEntity;
    }
}

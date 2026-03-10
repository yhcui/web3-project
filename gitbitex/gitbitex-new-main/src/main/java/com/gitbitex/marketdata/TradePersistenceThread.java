package com.gitbitex.marketdata;

import com.alibaba.fastjson.JSON;
import com.gitbitex.AppProperties;
import com.gitbitex.marketdata.entity.TradeEntity;
import com.gitbitex.marketdata.manager.TradeManager;
import com.gitbitex.matchingengine.Trade;
import com.gitbitex.matchingengine.message.Message;
import com.gitbitex.matchingengine.message.TradeMessage;
import com.gitbitex.middleware.kafka.KafkaConsumerThread;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRebalanceListener;
import org.apache.kafka.clients.consumer.KafkaConsumer;
import org.apache.kafka.common.TopicPartition;
import org.redisson.api.RTopic;
import org.redisson.api.RedissonClient;
import org.redisson.client.codec.StringCodec;

import java.time.Duration;
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

/**
 * 成交持久化线程
 * 负责消费成交消息并持久化到数据库
 */
@Slf4j
public class TradePersistenceThread extends KafkaConsumerThread<String, Message> implements ConsumerRebalanceListener {
    /** 成交管理器 */
    private final TradeManager tradeManager;
    /** 应用配置 */
    private final AppProperties appProperties;
    /** 成交 Redis 主题 */
    private final RTopic tradeTopic;

    /**
     * 构造成交持久化线程
     * @param consumer Kafka 消费者
     * @param tradeManager 成交管理器
     * @param redissonClient Redisson 客户端
     * @param appProperties 应用配置
     */
    public TradePersistenceThread(KafkaConsumer<String, Message> consumer, TradeManager tradeManager,
                                  RedissonClient redissonClient,
                                  AppProperties appProperties) {
        super(consumer, logger);
        this.tradeManager = tradeManager;
        this.appProperties = appProperties;
        this.tradeTopic = redissonClient.getTopic("trade", StringCodec.INSTANCE);
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
     * 执行轮询操作，消费并处理成交消息
     */
    @Override
    protected void doPoll() {
        var records = consumer.poll(Duration.ofSeconds(5));
        Map<String, TradeEntity> trades = new HashMap<>();
        records.forEach(x -> {
            Message message = x.value();
            if (message instanceof TradeMessage tradeMessage) {
                TradeEntity tradeEntity = tradeEntity(tradeMessage);
                trades.put(tradeEntity.getId(), tradeEntity);
                tradeTopic.publishAsync(JSON.toJSONString(tradeMessage));
            }
        });
        tradeManager.saveAll(trades.values());

        consumer.commitAsync();
    }

    /**
     * 将成交消息转换为成交实体
     * @param message 成交消息
     * @return 成交实体
     */
    private TradeEntity tradeEntity(TradeMessage message) {
        Trade trade = message.getTrade();
        TradeEntity tradeEntity = new TradeEntity();
        tradeEntity.setId(trade.getProductId() + "-" + trade.getSequence());
        tradeEntity.setSequence(trade.getSequence());
        tradeEntity.setTime(trade.getTime());
        tradeEntity.setSize(trade.getSize());
        tradeEntity.setPrice(trade.getPrice());
        tradeEntity.setProductId(trade.getProductId());
        tradeEntity.setMakerOrderId(trade.getMakerOrderId());
        tradeEntity.setTakerOrderId(trade.getTakerOrderId());
        tradeEntity.setSide(trade.getSide());
        return tradeEntity;
    }
}

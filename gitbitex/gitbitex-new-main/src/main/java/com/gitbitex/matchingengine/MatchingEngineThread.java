package com.gitbitex.matchingengine;

import com.gitbitex.AppProperties;
import com.gitbitex.matchingengine.command.Command;
import com.gitbitex.middleware.kafka.KafkaConsumerThread;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRebalanceListener;
import org.apache.kafka.clients.consumer.KafkaConsumer;
import org.apache.kafka.common.TopicPartition;

import java.time.Duration;
import java.util.Collection;
import java.util.Collections;

/**
 * 撮合引擎线程
 * 从 Kafka 读取命令并提交给撮合引擎执行
 */
@Slf4j
public class MatchingEngineThread extends KafkaConsumerThread<String, Command>
        implements ConsumerRebalanceListener {
    /** 应用配置 */
    private final AppProperties appProperties;
    /** 撮合引擎加载器 */
    private final MatchingEngineLoader matchingEngineLoader;
    /** 撮合引擎实例 */
    private MatchingEngine matchingEngine;

    /**
     * 构造线程
     * @param consumer Kafka 消费者
     * @param matchingEngineLoader 引擎加载器
     * @param appProperties 应用配置
     */
    public MatchingEngineThread(KafkaConsumer<String, Command> consumer, MatchingEngineLoader matchingEngineLoader,
                                AppProperties appProperties) {
        super(consumer, logger);
        this.appProperties = appProperties;
        this.matchingEngineLoader = matchingEngineLoader;

    }

    /**
     * 分区撤销回调
     * @param partitions 被撤销的分区
     */
    @Override
    public void onPartitionsRevoked(Collection<TopicPartition> partitions) {
        for (TopicPartition partition : partitions) {
            logger.warn("partition revoked: {}", partition.toString());
        }
    }

    /**
     * 分区分配回调
     * @param partitions 被分配的分区
     */
    @Override
    public void onPartitionsAssigned(Collection<TopicPartition> partitions) {
        for (TopicPartition partition : partitions) {
            logger.info("partition assigned: {}", partition.toString());
            matchingEngine = matchingEngineLoader.getPreperedMatchingEngine();
            if (matchingEngine == null) {
                throw new RuntimeException("no prepared matching engine");
            }
            if (matchingEngine.getStartupCommandOffset() != null) {
                logger.info("seek to offset: {}", matchingEngine.getStartupCommandOffset() + 1);
                consumer.seek(partition, matchingEngine.getStartupCommandOffset() + 1);
            }
        }
    }

    /**
     * 订阅 Kafka 主题
     */
    @Override
    protected void doSubscribe() {
        consumer.subscribe(Collections.singletonList(appProperties.getMatchingEngineCommandTopic()), this);
    }

    /**
     * 消费并处理命令
     */
    @Override
    protected void doPoll() {
        consumer.poll(Duration.ofSeconds(5))
                .forEach(x -> matchingEngine.executeCommand(x.value(), x.offset()));
    }
}

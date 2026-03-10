package com.gitbitex.marketdata;

import com.gitbitex.AppProperties;
import com.gitbitex.marketdata.entity.Candle;
import com.gitbitex.marketdata.repository.CandleRepository;
import com.gitbitex.marketdata.util.DateUtil;
import com.gitbitex.matchingengine.Trade;
import com.gitbitex.matchingengine.message.Message;
import com.gitbitex.matchingengine.message.TradeMessage;
import com.gitbitex.middleware.kafka.KafkaConsumerThread;
import lombok.SneakyThrows;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRebalanceListener;
import org.apache.kafka.clients.consumer.KafkaConsumer;
import org.apache.kafka.common.TopicPartition;

import java.time.Duration;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.temporal.ChronoField;
import java.util.Collection;
import java.util.Collections;
import java.util.LinkedHashMap;

/**
 * K 线生成线程
 * 负责消费成交消息并生成 K 线数据
 */
@Slf4j
public class CandleMakerThread extends KafkaConsumerThread<String, Message> implements ConsumerRebalanceListener {
    /** 支持的 K 线粒度（分钟） */
    private static final int[] GRANULARITY_ARR = new int[]{1, 5, 15, 30, 60, 360, 1440};
    /** K 线仓库 */
    private final CandleRepository candleRepository;
    /** 应用配置 */
    private final AppProperties appProperties;

    /**
     * 构造 K 线生成线程
     * @param consumer Kafka 消费者
     * @param candleRepository K 线仓库
     * @param appProperties 应用配置
     */
    public CandleMakerThread(KafkaConsumer<String, Message> consumer, CandleRepository candleRepository,
                             AppProperties appProperties) {
        super(consumer, logger);
        this.candleRepository = candleRepository;
        this.appProperties = appProperties;
    }

    /**
     * 分区撤销时的回调
     * @param partitions 撤销的分区集合
     */
    @Override
    public void onPartitionsRevoked(Collection<TopicPartition> partitions) {
        for (TopicPartition partition : partitions) {
            logger.info("partition revoked: {}", partition.toString());
        }
    }

    /**
     * 分区分配时的回调
     * @param partitions 分配的分区集合
     */
    @Override
    public void onPartitionsAssigned(Collection<TopicPartition> partitions) {
        for (TopicPartition partition : partitions) {
            logger.info("partition assigned: {}", partition.toString());
        }
    }

    /**
     * 执行订阅操作
     */
    @Override
    protected void doSubscribe() {
        consumer.subscribe(Collections.singletonList(appProperties.getMatchingEngineMessageTopic()), this);
    }

    /**
     * 执行轮询操作，消费成交消息并生成 K 线
     */
    @Override
    @SneakyThrows
    protected void doPoll() {
        var records = consumer.poll(Duration.ofSeconds(5));
        if (records.isEmpty()) {
            return;
        }

        LinkedHashMap<String, Candle> candles = new LinkedHashMap<>();
        records.forEach(x -> {
            Message message = x.value();
            if (message instanceof TradeMessage) {
                Trade trade = ((TradeMessage) message).getTrade();
                for (int granularity : GRANULARITY_ARR) {
                    long time = DateUtil.round(ZonedDateTime.ofInstant(trade.getTime().toInstant(), ZoneId.systemDefault()),
                            ChronoField.MINUTE_OF_DAY, granularity).toEpochSecond();
                    String candleId = trade.getProductId() + "-" + time + "-" + granularity;
                    Candle candle = candles.get(candleId);
                    if (candle == null) {
                        candle = candleRepository.findById(candleId);
                    }

                    if (candle == null) {
                        candle = new Candle();
                        candle.setId(candleId);
                        candle.setProductId(trade.getProductId());
                        candle.setGranularity(granularity);
                        candle.setTime(time);
                        candle.setProductId(trade.getProductId());
                        candle.setOpen(trade.getPrice());
                        candle.setClose(trade.getPrice());
                        candle.setLow(trade.getPrice());
                        candle.setHigh(trade.getPrice());
                        candle.setVolume(trade.getSize());
                        candle.setTradeId(trade.getSequence());
                    } else {
                        if (candle.getTradeId() >= trade.getSequence()) {
                            //logger.warn("ignore trade: {}",trade.getTradeId());
                            continue;
                        } else if (candle.getTradeId() + 1 != trade.getSequence()) {
                            throw new RuntimeException(
                                    "out of order sequence: " + " " + (candle.getTradeId()) + " " + trade.getSequence());
                        }
                        candle.setClose(trade.getPrice());
                        candle.setLow(candle.getLow().min(trade.getPrice()));
                        candle.setHigh(candle.getLow().max(trade.getPrice()));
                        candle.setVolume(candle.getVolume().add(trade.getSize()));
                        candle.setTradeId(trade.getSequence());
                    }

                    candles.put(candle.getId(), candle);
                }
            }
        });

        if (!candles.isEmpty()) {
            long t1 = System.currentTimeMillis();
            candleRepository.saveAll(candles.values());
            logger.info("saved {} candle(s) ({}ms)", candles.size(), System.currentTimeMillis() - t1);
        }

        consumer.commitSync();
    }


}

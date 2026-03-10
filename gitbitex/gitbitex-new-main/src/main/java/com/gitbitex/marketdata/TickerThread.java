package com.gitbitex.marketdata;

import com.gitbitex.AppProperties;
import com.gitbitex.marketdata.entity.Ticker;
import com.gitbitex.marketdata.manager.TickerManager;
import com.gitbitex.marketdata.util.DateUtil;
import com.gitbitex.matchingengine.Trade;
import com.gitbitex.matchingengine.message.Message;
import com.gitbitex.matchingengine.message.TradeMessage;
import com.gitbitex.middleware.kafka.KafkaConsumerThread;
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
import java.util.HashMap;
import java.util.Map;

/**
 * 行情 Ticker 线程
 * 负责消费成交消息并生成 Ticker 行情数据
 */
@Slf4j
public class TickerThread extends KafkaConsumerThread<String, Message> implements ConsumerRebalanceListener {
    /** 应用配置 */
    private final AppProperties appProperties;
    /** Ticker 管理器 */
    private final TickerManager tickerManager;
    /** 按交易对存储的 Ticker 映射 */
    private final Map<String, Ticker> tickerByProductId = new HashMap<>();

    /**
     * 构造 Ticker 线程
     * @param consumer Kafka 消费者
     * @param tickerManager Ticker 管理器
     * @param appProperties 应用配置
     */
    public TickerThread(KafkaConsumer<String, Message> consumer, TickerManager tickerManager,
                        AppProperties appProperties) {
        super(consumer, logger);
        this.tickerManager = tickerManager;
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
     * 执行轮询操作，消费成交消息并更新 Ticker
     */
    @Override
    protected void doPoll() {
        var records = consumer.poll(Duration.ofSeconds(5));
        if (records.isEmpty()) {
            return;
        }

        records.forEach(x -> {
            Message message = x.value();
            if (message instanceof TradeMessage) {
                refreshTicker(((TradeMessage) message).getTrade());
            }
        });

        consumer.commitSync();
    }

    /**
     * 刷新 Ticker 数据
     * @param trade 成交信息
     */
    public void refreshTicker(Trade trade) {
        Ticker ticker = tickerByProductId.get(trade.getProductId());
        if (ticker == null) {
            ticker = tickerManager.getTicker(trade.getProductId());
        }
        if (ticker != null) {
            long diff = trade.getSequence() - ticker.getTradeId();
            if (diff <= 0) {
                return;
            } else if (diff > 1) {
                throw new RuntimeException("tradeId is discontinuous");
            }
        }

        if (ticker == null) {
            ticker = new Ticker();
            ticker.setProductId(trade.getProductId());
        }

        long time24h = DateUtil.round(ZonedDateTime.ofInstant(trade.getTime().toInstant(), ZoneId.systemDefault()),
                ChronoField.MINUTE_OF_DAY, 24 * 60).toEpochSecond();
        long time30d = DateUtil.round(ZonedDateTime.ofInstant(trade.getTime().toInstant(), ZoneId.systemDefault()),
                ChronoField.MINUTE_OF_DAY, 24 * 60 * 30).toEpochSecond();

        if (ticker.getTime24h() == null || ticker.getTime24h() != time24h) {
            ticker.setTime24h(time24h);
            ticker.setOpen24h(trade.getPrice());
            ticker.setClose24h(trade.getPrice());
            ticker.setHigh24h(trade.getPrice());
            ticker.setLow24h(trade.getPrice());
            ticker.setVolume24h(trade.getSize());
        } else {
            ticker.setClose24h(trade.getPrice());
            ticker.setHigh24h(ticker.getHigh24h().max(trade.getPrice()));
            ticker.setVolume24h(ticker.getVolume24h().add(trade.getSize()));
        }
        if (ticker.getTime30d() == null || ticker.getTime30d() != time30d) {
            ticker.setTime30d(time30d);
            ticker.setOpen30d(trade.getPrice());
            ticker.setClose30d(trade.getPrice());
            ticker.setHigh30d(trade.getPrice());
            ticker.setLow30d(trade.getPrice());
            ticker.setVolume30d(trade.getSize());
        } else {
            ticker.setClose30d(trade.getPrice());
            ticker.setHigh30d(ticker.getHigh30d().max(trade.getPrice()));
            ticker.setVolume30d(ticker.getVolume30d().add(trade.getSize()));
        }
        ticker.setLastSize(trade.getSize());
        ticker.setTime(trade.getTime());
        ticker.setPrice(trade.getPrice());
        ticker.setSide(trade.getSide());
        ticker.setTradeId(trade.getSequence());
        tickerByProductId.put(trade.getProductId(), ticker);

        tickerManager.saveTicker(ticker);
    }

}

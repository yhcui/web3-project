package com.gitbitex;

import com.gitbitex.marketdata.*;
import com.gitbitex.marketdata.manager.AccountManager;
import com.gitbitex.marketdata.manager.OrderManager;
import com.gitbitex.marketdata.manager.TickerManager;
import com.gitbitex.marketdata.manager.TradeManager;
import com.gitbitex.marketdata.orderbook.OrderBookSnapshotManager;
import com.gitbitex.marketdata.repository.CandleRepository;
import com.gitbitex.matchingengine.MatchingEngineLoader;
import com.gitbitex.matchingengine.MatchingEngineThread;
import com.gitbitex.matchingengine.MessageSender;
import com.gitbitex.matchingengine.command.Command;
import com.gitbitex.matchingengine.command.CommandDeserializer;
import com.gitbitex.matchingengine.message.MatchingEngineMessageDeserializer;
import com.gitbitex.matchingengine.message.Message;
import com.gitbitex.matchingengine.snapshot.EngineSnapshotManager;
import com.gitbitex.matchingengine.snapshot.MatchingEngineSnapshotThread;
import com.gitbitex.middleware.kafka.KafkaProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.KafkaConsumer;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.redisson.api.RedissonClient;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;
import java.util.Properties;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;

/**
 * GitBitEx 应用启动引导类
 * 负责启动所有核心线程，包括撮合引擎、数据持久化、K 线生成、行情推送等
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class Bootstrap {
    private final OrderManager orderManager;
    /** 账户管理器 */
    private final AccountManager accountManager;
    /** 交易管理器 */
    private final TradeManager tradeManager;
    /** K 线数据仓库 */
    private final CandleRepository candleRepository;
    /** 行情管理器 */
    private final TickerManager tickerManager;
    /** 应用配置 */
    private final AppProperties appProperties;
    /** Kafka 配置 */
    private final KafkaProperties kafkaProperties;
    /** 撮合引擎快照管理器 */
    private final EngineSnapshotManager engineSnapshotManager;
    /** 撮合引擎加载器 */
    private final MatchingEngineLoader matchingEngineLoader;
    /** 消息发送器 */
    private final MessageSender messageSender;
    /** 订单簿快照管理器 */
    private final OrderBookSnapshotManager orderBookSnapshotManager;
    /** Redis 客户端 */
    private final RedissonClient redissonClient;
    /** 定时执行器 */
    private final ScheduledExecutorService executor = Executors.newScheduledThreadPool(8);

    /**
     * 初始化方法，启动所有核心线程
     */
    @PostConstruct
    public void init() {
        startMatchingEngine(1);
        startOrderPersistenceThread(1);
        startTradePersistenceThread(1);
        startAccountPersistenceThread(1);
        startCandleMaker(1);
        startTickerThread(1);
        startSnapshotThread(1);
        startOrderBookSnapshotThread(1);
    }

    /**
     * 启动撮合引擎线程
     * @param nThreads 线程数量
     */
    private void startMatchingEngine(int nThreads) {
        for (int i = 0; i < nThreads; i++) {
            String groupId = "MatchingEngine";
            var consumer = getEngineCommandKafkaConsumer(groupId);
            var thread = new MatchingEngineThread(consumer, matchingEngineLoader, appProperties);
            thread.setName(groupId + "-" + thread.getId());
            thread.setUncaughtExceptionHandler(getUncaughtExceptionHandler(() -> startMatchingEngine(1)));
            thread.start();
        }
    }

    /**
     * 启动引擎快照线程
     * @param nThreads 线程数量
     */
    private void startSnapshotThread(int nThreads) {
        for (int i = 0; i < nThreads; i++) {
            String groupId = "EngineSnapshot";
            var consumer = getEngineMessageKafkaConsumer(groupId);
            var thread = new MatchingEngineSnapshotThread(consumer, engineSnapshotManager, appProperties);
            thread.setName(groupId + "-" + thread.getId());
            thread.setUncaughtExceptionHandler(getUncaughtExceptionHandler(() -> startSnapshotThread(1)));
            thread.start();
        }
    }

    /**
     * 启动订单簿快照线程
     * @param nThreads 线程数量
     */
    private void startOrderBookSnapshotThread(int nThreads) {
        for (int i = 0; i < nThreads; i++) {
            String groupId = "OrderBookSnapshot";
            var consumer = getEngineMessageKafkaConsumer(groupId);
            var thread = new OrderBookSnapshotThread(consumer, orderBookSnapshotManager, engineSnapshotManager,
                    appProperties);
            thread.setName(groupId + "-" + thread.getId());
            thread.setUncaughtExceptionHandler(getUncaughtExceptionHandler(() ->
                    startOrderBookSnapshotThread(1)));
            thread.start();
        }
    }

    /**
     * 启动账户持久化线程
     * @param nThreads 线程数量
     */
    private void startAccountPersistenceThread(int nThreads) {
        for (int i = 0; i < nThreads; i++) {
            String groupId = "Account";
            var consumer = getEngineMessageKafkaConsumer(groupId);
            var thread = new AccountPersistenceThread(consumer, accountManager, redissonClient,
                    appProperties);
            thread.setName(groupId + "-" + thread.getId());
            thread.setUncaughtExceptionHandler(getUncaughtExceptionHandler(() ->
                    startAccountPersistenceThread(1)));
            thread.start();
        }
    }

    /**
     * 启动行情推送线程
     * @param nThreads 线程数量
     */
    private void startTickerThread(int nThreads) {
        for (int i = 0; i < nThreads; i++) {
            String groupId = "Ticker";
            var consumer = getEngineMessageKafkaConsumer(groupId);
            var thread = new TickerThread(consumer, tickerManager, appProperties);
            thread.setName(groupId + "-" + thread.getId());
            thread.setUncaughtExceptionHandler(getUncaughtExceptionHandler(() -> startTickerThread(1)));
            thread.start();
        }
    }

    /**
     * 启动订单持久化线程
     * @param nThreads 线程数量
     */
    private void startOrderPersistenceThread(int nThreads) {
        for (int i = 0; i < nThreads; i++) {
            String groupId = "Order";
            var consumer = getEngineMessageKafkaConsumer(groupId);
            var thread = new OrderPersistenceThread(consumer, orderManager, redissonClient, appProperties);
            thread.setName(groupId + "-" + thread.getId());
            thread.setUncaughtExceptionHandler(getUncaughtExceptionHandler(() ->
                    startOrderPersistenceThread(1)));
            thread.start();
        }
    }

    /**
     * 启动 K 线生成线程
     * @param nThreads 线程数量
     */
    private void startCandleMaker(int nThreads) {
        for (int i = 0; i < nThreads; i++) {
            String groupId = "CandlerMaker";
            var consumer = getEngineMessageKafkaConsumer(groupId);
            var thread = new CandleMakerThread(consumer, candleRepository, appProperties);
            thread.setName(groupId + "-" + thread.getId());
            thread.setUncaughtExceptionHandler(getUncaughtExceptionHandler(() -> startCandleMaker(1)));
            thread.start();
        }
    }

    /**
     * 启动交易持久化线程
     * @param nThreads 线程数量
     */
    private void startTradePersistenceThread(int nThreads) {
        for (int i = 0; i < nThreads; i++) {
            String groupId = "Trade1";
            var consumer = getEngineMessageKafkaConsumer(groupId);
            var thread = new TradePersistenceThread(consumer, tradeManager, redissonClient, appProperties);
            thread.setName(groupId + "-" + thread.getId());
            thread.setUncaughtExceptionHandler(getUncaughtExceptionHandler(() ->
                    startTradePersistenceThread(1)));
            thread.start();
        }
    }

    /**
     * 获取线程异常处理器
     * @param runnable 异常时执行的恢复逻辑
     * @return 异常处理器
     */
    private Thread.UncaughtExceptionHandler getUncaughtExceptionHandler(Runnable runnable) {
        return (t, ex) -> {
            logger.error("Thread {} triggered an uncaught exception and will start a new thread in " +
                    "3 seconds, ex:{}", t.getName(), ex.getMessage(), ex);
            executor.schedule(() -> {
                try {
                    runnable.run();
                } catch (Exception e) {
                    logger.error("start thread failed", e);
                }
            }, 3, java.util.concurrent.TimeUnit.SECONDS);
        };
    }

    /**
     * 创建 Kafka 消息消费者（用于接收撮合引擎消息）
     * @param groupId 消费者组 ID
     * @return Kafka 消费者
     */
    private KafkaConsumer<String, Message> getEngineMessageKafkaConsumer(String groupId) {
        return new KafkaConsumer<>(getProperties(groupId), new StringDeserializer(),
                new MatchingEngineMessageDeserializer());
    }

    /**
     * 创建 Kafka 命令消费者（用于接收撮合引擎命令）
     * @param groupId 消费者组 ID
     * @return Kafka 消费者
     */
    private KafkaConsumer<String, Command> getEngineCommandKafkaConsumer(String groupId) {
        return new KafkaConsumer<>(getProperties(groupId), new StringDeserializer(), new CommandDeserializer());
    }

    /**
     * 获取 Kafka 消费者配置
     * @param groupId 消费者组 ID
     * @return 配置属性
     */
    private Properties getProperties(String groupId) {
        Properties properties = new Properties();
        properties.put("bootstrap.servers", kafkaProperties.getBootstrapServers());
        properties.put("group.id", groupId);
        properties.put("enable.auto.commit", "false");
        properties.put("session.timeout.ms", "30000");
        properties.put("auto.offset.reset", "earliest");
        properties.put("max.poll.records", 2000);
        return properties;
    }
}

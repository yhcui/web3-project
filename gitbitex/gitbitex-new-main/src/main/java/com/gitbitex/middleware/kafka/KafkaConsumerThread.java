package com.gitbitex.middleware.kafka;

import lombok.RequiredArgsConstructor;
import org.apache.kafka.clients.consumer.KafkaConsumer;
import org.apache.kafka.common.errors.WakeupException;
import org.slf4j.Logger;

import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Kafka 消费者线程基类
 * 提供 Kafka 消费的模板方法，子类需实现订阅和消息处理逻辑
 * @param <K> 键类型
 * @param <V> 值类型
 */
@RequiredArgsConstructor
public abstract class KafkaConsumerThread<K, V> extends Thread {
    /** Kafka 消费者 */
    protected final KafkaConsumer<K, V> consumer;
    private final AtomicBoolean closed = new AtomicBoolean();
    /** 日志记录器 */
    private final Logger logger;

    /**
     * 线程运行方法
     */
    @Override
    public void run() {
        logger.info("starting...");
        try {
            // subscribe
            doSubscribe();

            // poll & process
            while (!closed.get()) {
                doPoll();
            }
        } catch (WakeupException e) {
            // ignore exception if closing
            if (!closed.get()) {
                throw e;
            }
        } catch (Exception e) {
            logger.error("consumer error: {}", e.getMessage(), e);
        } finally {
            consumer.close();
        }
        logger.info("exiting...");
    }

    /**
     * 关闭消费者
     */
    public void shutdown() {
        closed.set(true);
        consumer.wakeup();
    }

    /**
     * 中断线程
     */
    @Override
    public void interrupt() {
        this.shutdown();
        super.interrupt();
    }

    /**
     * 订阅主题
     */
    protected abstract void doSubscribe();

    /**
     * 消费消息
     */
    protected abstract void doPoll();
}

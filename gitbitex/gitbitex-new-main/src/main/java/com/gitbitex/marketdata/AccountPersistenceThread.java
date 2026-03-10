package com.gitbitex.marketdata;

import com.alibaba.fastjson.JSON;
import com.gitbitex.AppProperties;
import com.gitbitex.marketdata.entity.AccountEntity;
import com.gitbitex.marketdata.manager.AccountManager;
import com.gitbitex.matchingengine.Account;
import com.gitbitex.matchingengine.message.AccountMessage;
import com.gitbitex.matchingengine.message.Message;
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
 * 账户持久化线程
 * 负责消费账户消息并持久化到数据库
 */
@Slf4j
public class AccountPersistenceThread extends KafkaConsumerThread<String, Message> implements ConsumerRebalanceListener {
    /** 账户管理器 */
    private final AccountManager accountManager;
    /** 应用配置 */
    private final AppProperties appProperties;
    /** 账户 Redis 主题 */
    private final RTopic accountTopic;

    /**
     * 构造账户持久化线程
     * @param consumer Kafka 消费者
     * @param accountManager 账户管理器
     * @param redissonClient Redisson 客户端
     * @param appProperties 应用配置
     */
    public AccountPersistenceThread(KafkaConsumer<String, Message> consumer, AccountManager accountManager,
                                    RedissonClient redissonClient,
                                    AppProperties appProperties) {
        super(consumer, logger);
        this.accountManager = accountManager;
        this.appProperties = appProperties;
        this.accountTopic = redissonClient.getTopic("account", StringCodec.INSTANCE);
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
     * 执行轮询操作，消费并处理账户消息
     */
    @Override
    protected void doPoll() {
        var records = consumer.poll(Duration.ofSeconds(5));
        Map<String, AccountEntity> accounts = new HashMap<>();
        records.forEach(x -> {
            Message message = x.value();
            if (message instanceof AccountMessage accountMessage) {
                AccountEntity accountEntity = accountEntity(accountMessage);
                accounts.put(accountEntity.getId(), accountEntity);
                accountTopic.publishAsync(JSON.toJSONString(accountMessage));
            }
        });
        accountManager.saveAll(accounts.values());

        consumer.commitAsync();
    }

    /**
     * 将账户消息转换为账户实体
     * @param message 账户消息
     * @return 账户实体
     */
    private AccountEntity accountEntity(AccountMessage message) {
        Account account = message.getAccount();
        AccountEntity accountEntity = new AccountEntity();
        accountEntity.setId(account.getUserId() + "-" + account.getCurrency());
        accountEntity.setUserId(account.getUserId());
        accountEntity.setCurrency(account.getCurrency());
        accountEntity.setAvailable(account.getAvailable());
        accountEntity.setHold(account.getHold());
        return accountEntity;
    }
}




package com.gitbitex.marketdata.manager;

import com.alibaba.fastjson.JSON;
import com.gitbitex.marketdata.entity.Ticker;
import org.redisson.api.RTopic;
import org.redisson.api.RedissonClient;
import org.redisson.client.codec.StringCodec;
import org.springframework.stereotype.Component;

/**
 * 行情管理器
 * 负责行情的存储和查询
 */
@Component
public class TickerManager {
    private final RedissonClient redissonClient;
    private final RTopic tickerTopic;

    /**
     * 构造方法
     * @param redissonClient Redis 客户端
     */
    public TickerManager(RedissonClient redissonClient) {
        this.redissonClient = redissonClient;
        this.tickerTopic = redissonClient.getTopic("ticker", StringCodec.INSTANCE);
    }

    /**
     * 获取交易对行情
     * @param productId 交易对 ID
     * @return 行情数据
     */
    public Ticker getTicker(String productId) {
        Object val = redissonClient.getBucket(keyForTicker(productId), StringCodec.INSTANCE).get();
        if (val == null) {
            return null;
        }
        return JSON.parseObject(val.toString(), Ticker.class);
    }

    /**
     * 保存行情数据
     * @param ticker 行情数据
     */
    public void saveTicker(Ticker ticker) {
        String value = JSON.toJSONString(ticker);
        redissonClient.getBucket(keyForTicker(ticker.getProductId()), StringCodec.INSTANCE).set(value);
        tickerTopic.publishAsync(value);
    }

    /**
     * 生成行情数据的 Redis 键
     * @param productId 交易对 ID
     * @return Redis 键
     */
    private String keyForTicker(String productId) {
        return productId + ".ticker";
    }
}

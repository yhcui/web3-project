package com.gitbitex.marketdata.orderbook;

import com.alibaba.fastjson.JSON;
import lombok.extern.slf4j.Slf4j;
import org.redisson.api.RTopic;
import org.redisson.api.RedissonClient;
import org.redisson.client.codec.StringCodec;
import org.springframework.stereotype.Component;

/**
 * 订单簿快照管理器
 * 负责订单簿快照的存储和查询（L1/L2/L3）
 */
@Component
@Slf4j
public class OrderBookSnapshotManager {
    private final RedissonClient redissonClient;
    private final RTopic l2BatchNotifyTopic;

    public OrderBookSnapshotManager(RedissonClient redissonClient) {
        this.redissonClient = redissonClient;
        this.l2BatchNotifyTopic = redissonClient.getTopic("l2_batch", StringCodec.INSTANCE);
    }

    /**
     * 保存 L3 订单簿
     * @param l3OrderBook L3 订单簿
     */
    public void saveL3OrderBook(L3OrderBook l3OrderBook) {
        redissonClient.getBucket(keyForL3(l3OrderBook.getProductId()), StringCodec.INSTANCE).set(
                JSON.toJSONString(l3OrderBook));
    }

    /**
     * 获取 L3 订单簿
     * @param productId 交易对 ID
     * @return L3 订单簿
     */
    public L3OrderBook getL3OrderBook(String productId) {
        Object o = redissonClient.getBucket(keyForL3(productId), StringCodec.INSTANCE).get();
        if (o == null) {
            return null;
        }
        return JSON.parseObject(o.toString(), L3OrderBook.class);
    }

    /**
     * 保存 L2 订单簿
     * @param l2OrderBook L2 订单簿
     */
    public void saveL2OrderBook(L2OrderBook l2OrderBook) {
        redissonClient.getBucket(keyForL2(l2OrderBook.getProductId()), StringCodec.INSTANCE).setAsync(
                JSON.toJSONString(l2OrderBook));
    }

    /**
     * 获取 L2 订单簿
     * @param productId 交易对 ID
     * @return L2 订单簿
     */
    public L2OrderBook getL2OrderBook(String productId) {
        Object o = redissonClient.getBucket(keyForL2(productId), StringCodec.INSTANCE).get();
        if (o == null) {
            return null;
        }
        return JSON.parseObject(o.toString(), L2OrderBook.class);
    }

    /**
     * 保存 L2 批量订单簿
     * @param l2OrderBook L2 订单簿
     */
    public void saveL2BatchOrderBook(L2OrderBook l2OrderBook) {
        String data = JSON.toJSONString(l2OrderBook);
        redissonClient.getBucket(keyForL2Batch(l2OrderBook.getProductId()), StringCodec.INSTANCE)
                .setAsync(data);
        l2BatchNotifyTopic.publishAsync(data);
    }

    /**
     * 获取 L2 批量订单簿
     * @param productId 交易对 ID
     * @return L2 订单簿
     */
    public L2OrderBook getL2BatchOrderBook(String productId) {
        Object o = redissonClient.getBucket(keyForL2Batch(productId), StringCodec.INSTANCE).get();
        if (o == null) {
            return null;
        }
        return JSON.parseObject(o.toString(), L2OrderBook.class);
    }

    /**
     * 获取 L1 订单簿
     * @param productId 交易对 ID
     * @return L1 订单簿
     */
    public L2OrderBook getL1OrderBook(String productId) {
        Object o = redissonClient.getBucket(keyForL1(productId), StringCodec.INSTANCE).get();
        if (o == null) {
            return null;
        }
        return JSON.parseObject(o.toString(), L2OrderBook.class);
    }

    private String keyForL1(String productId) {
        return productId + ".l1_order_book";
    }

    private String keyForL2(String productId) {
        return productId + ".l2_order_book";
    }

    private String keyForL2Batch(String productId) {
        return productId + ".l2_batch_order_book";
    }

    private String keyForL3(String productId) {
        return productId + ".l3_order_book";
    }
}

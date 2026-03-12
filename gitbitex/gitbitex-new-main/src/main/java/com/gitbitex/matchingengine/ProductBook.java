package com.gitbitex.matchingengine;

import com.gitbitex.matchingengine.message.ProductMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.util.Collection;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.atomic.AtomicLong;

/**
 * 交易对簿类
 * 管理所有交易对信息
 */
@Slf4j
@RequiredArgsConstructor
public class ProductBook {
    /** 交易对映射 */
    private final Map<String, Product> products = new HashMap<>();
    /** 消息发送器 */
    private final MessageSender messageSender;
    /** 消息序列号计数器 */
    private final AtomicLong messageSequence;

    /**
     * 获取所有交易对
     * @return 交易对集合
     */
    public Collection<Product> getAllProducts() {
        return products.values();
    }

    /**
     * 获取交易对
     * @param productId 交易对 ID
     * @return 交易对
     */
    public Product getProduct(String productId) {
        return products.get(productId);
    }

    /**
     * 添加或更新交易对
     * @param product 交易对
     */
    public void putProduct(Product product) {
        this.products.put(product.getId(), product);
        messageSender.send(productMessage(product.clone()));
    }

    /**
     * 添加交易对（不发送消息）
     * @param product 交易对
     */
    public void addProduct(Product product) {
        this.products.put(product.getId(), product);
    }

    /**
     * 创建交易对消息
     * @param product 交易对
     * @return 交易对消息
     */
    private ProductMessage productMessage(Product product) {
        ProductMessage message = new ProductMessage();
        message.setSequence(messageSequence.incrementAndGet());
        message.setProduct(product);
        return message;
    }
}

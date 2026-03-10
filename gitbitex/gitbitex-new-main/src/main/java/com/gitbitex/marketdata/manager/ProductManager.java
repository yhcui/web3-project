package com.gitbitex.marketdata.manager;

import com.gitbitex.marketdata.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * 交易对管理器
 * 负责交易对数据的管理
 */
@Component
@RequiredArgsConstructor
public class ProductManager {
    private final ProductRepository productRepository;

}

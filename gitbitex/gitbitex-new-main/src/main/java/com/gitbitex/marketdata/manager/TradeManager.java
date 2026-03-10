package com.gitbitex.marketdata.manager;

import com.gitbitex.marketdata.entity.TradeEntity;
import com.gitbitex.marketdata.repository.TradeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Collection;

/**
 * 交易管理器
 * 负责交易数据的保存
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class TradeManager {
    private final TradeRepository tradeRepository;

    /**
     * 批量保存交易
     * @param trades 交易集合
     */
    public void saveAll(Collection<TradeEntity> trades) {
        if (trades.isEmpty()) {
            return;
        }

        long t1 = System.currentTimeMillis();
        tradeRepository.saveAll(trades);
        logger.info("saved {} trade(s) ({}ms)", trades.size(), System.currentTimeMillis() - t1);
    }
}


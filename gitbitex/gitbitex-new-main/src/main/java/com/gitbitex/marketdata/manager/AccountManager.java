package com.gitbitex.marketdata.manager;

import com.gitbitex.marketdata.entity.AccountEntity;
import com.gitbitex.marketdata.repository.AccountRepository;
import com.gitbitex.marketdata.repository.BillRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.List;

/**
 * 账户管理器
 * 负责账户数据的查询和保存
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AccountManager {
    private final AccountRepository accountRepository;
    private final BillRepository billRepository;

    /**
     * 获取用户的所有账户
     * @param userId 用户 ID
     * @return 账户列表
     */
    public List<AccountEntity> getAccounts(String userId) {
        return accountRepository.findAccountsByUserId(userId);
    }

    /**
     * 批量保存账户
     * @param accounts 账户集合
     */
    public void saveAll(Collection<AccountEntity> accounts) {
        if (accounts.isEmpty()) {
            return;
        }

        long t1 = System.currentTimeMillis();
        accountRepository.saveAll(accounts);
        logger.info("saved {} account(s) ({}ms)", accounts.size(), System.currentTimeMillis() - t1);
    }
}

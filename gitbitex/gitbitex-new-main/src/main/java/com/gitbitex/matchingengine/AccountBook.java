package com.gitbitex.matchingengine;

import com.alibaba.fastjson.JSON;
import com.gitbitex.enums.OrderSide;
import com.gitbitex.matchingengine.message.AccountMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.Nullable;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.atomic.AtomicLong;

/**
 * 账户簿类
 * 管理所有用户的账户余额，处理充值、冻结、解冻等操作
 */
@Slf4j
@RequiredArgsConstructor
public class AccountBook {
    /** 用户账户映射 */
    private final Map<String, Map<String, Account>> accounts = new HashMap<>();
    /** 消息发送器 */
    private final MessageSender messageSender;
    /** 消息序列号计数器 */
    private final AtomicLong messageSequence;

    /**
     * 添加账户
     * @param account 账户
     */
    public void add(Account account) {
        this.accounts.computeIfAbsent(account.getUserId(), x -> new HashMap<>())
                .put(account.getCurrency(), account);
    }

    /**
     * 获取账户
     * @param userId 用户 ID
     * @param currency 币种
     * @return 账户，不存在返回 null
     */
    @Nullable
    public Account getAccount(String userId, String currency) {
        Map<String, Account> accountMap = accounts.get(userId);
        if (accountMap != null) {
            return accountMap.get(currency);
        }
        return null;
    }

    /**
     * 充值
     * @param userId 用户 ID
     * @param currency 币种
     * @param amount 金额
     * @param transactionId 交易 ID
     */
    public void deposit(String userId, String currency, BigDecimal amount, String transactionId) {
        Account account = getAccount(userId, currency);
        if (account == null) {
            account = createAccount(userId, currency);
        }
        account.setAvailable(account.getAvailable().add(amount));

        messageSender.send(accountMessage(account.clone()));
    }

    /**
     * 冻结资金
     * @param userId 用户 ID
     * @param currency 币种
     * @param amount 金额
     * @return 是否成功
     */
    public boolean hold(String userId, String currency, BigDecimal amount) {
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            logger.error("amount should greater than 0: {}", amount);
            return false;
        }
        Account account = getAccount(userId, currency);
        if (account == null || account.getAvailable().compareTo(amount) < 0) {
            return false;
        }
        account.setAvailable(account.getAvailable().subtract(amount));
        account.setHold(account.getHold().add(amount));

        messageSender.send(accountMessage(account.clone()));
        return true;
    }

    /**
     * 解冻资金
     * @param userId 用户 ID
     * @param currency 币种
     * @param amount 金额
     */
    public void unhold(String userId, String currency, BigDecimal amount) {
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new NullPointerException("amount should greater than 0");
        }
        Account account = getAccount(userId, currency);
        if (account == null || account.getHold().compareTo(amount) < 0) {
            throw new NullPointerException("insufficient funds");
        }
        account.setAvailable(account.getAvailable().add(amount));
        account.setHold(account.getHold().subtract(amount));

        messageSender.send(accountMessage(account.clone()));
    }

    /**
     * 交易双方资金交换
     * @param takerUserId 吃单用户 ID
     * @param makerUserId 挂单用户 ID
     * @param baseCurrency 基础币种
     * @param quoteCurrency 计价币种
     * @param takerSide 吃单方向
     * @param size 数量
     * @param funds 金额
     */
    public void exchange(String takerUserId, String makerUserId,
                         String baseCurrency, String quoteCurrency,
                         OrderSide takerSide, BigDecimal size, BigDecimal funds) {
        Account takerBaseAccount = getAccount(takerUserId, baseCurrency);
        Account takerQuoteAccount = getAccount(takerUserId, quoteCurrency);
        Account makerBaseAccount = getAccount(makerUserId, baseCurrency);
        Account makerQuoteAccount = getAccount(makerUserId, quoteCurrency);

        if (takerBaseAccount == null) {
            takerBaseAccount = createAccount(takerUserId, baseCurrency);
        }
        if (takerQuoteAccount == null) {
            takerQuoteAccount = createAccount(takerUserId, quoteCurrency);
        }
        if (makerBaseAccount == null) {
            makerBaseAccount = createAccount(makerUserId, baseCurrency);
        }
        if (makerQuoteAccount == null) {
            makerQuoteAccount = createAccount(makerUserId, quoteCurrency);
        }

        if (takerSide == OrderSide.BUY) {
            takerBaseAccount.setAvailable(takerBaseAccount.getAvailable().add(size));
            takerQuoteAccount.setHold(takerQuoteAccount.getHold().subtract(funds));
            makerBaseAccount.setHold(makerBaseAccount.getHold().subtract(size));
            makerQuoteAccount.setAvailable(makerQuoteAccount.getAvailable().add(funds));
        } else {
            takerBaseAccount.setHold(takerBaseAccount.getHold().subtract(size));
            takerQuoteAccount.setAvailable(takerQuoteAccount.getAvailable().add(funds));
            makerBaseAccount.setAvailable(makerBaseAccount.getAvailable().add(size));
            makerQuoteAccount.setHold(makerQuoteAccount.getHold().subtract(funds));
        }

        validateAccount(takerBaseAccount);
        validateAccount(takerQuoteAccount);
        validateAccount(makerBaseAccount);
        validateAccount(makerQuoteAccount);

        messageSender.send(accountMessage(takerBaseAccount.clone()));
        messageSender.send(accountMessage(takerQuoteAccount.clone()));
        messageSender.send(accountMessage(makerBaseAccount.clone()));
        messageSender.send(accountMessage(makerQuoteAccount.clone()));
    }

    /**
     * 验证账户余额合法性
     * @param account 账户
     */
    private void validateAccount(Account account) {
        if (account.getAvailable().compareTo(BigDecimal.ZERO) < 0 || account.getHold().compareTo(BigDecimal.ZERO) < 0) {
            throw new RuntimeException("bad account: " + JSON.toJSONString(account));
        }
    }

    /**
     * 创建账户
     * @param userId 用户 ID
     * @param currency 币种
     * @return 账户
     */
    public Account createAccount(String userId, String currency) {
        Account account = new Account();
        account.setId(userId + "-" + currency);
        account.setUserId(userId);
        account.setCurrency(currency);
        account.setAvailable(BigDecimal.ZERO);
        account.setHold(BigDecimal.ZERO);
        this.accounts.computeIfAbsent(account.getUserId(), x -> new HashMap<>()).put(account.getCurrency(), account);
        return account;
    }

    /**
     * 创建账户消息
     * @param account 账户
     * @return 账户消息
     */
    private AccountMessage accountMessage(Account account) {
        AccountMessage message = new AccountMessage();
        message.setSequence(messageSequence.incrementAndGet());
        message.setAccount(account);
        return message;
    }
}

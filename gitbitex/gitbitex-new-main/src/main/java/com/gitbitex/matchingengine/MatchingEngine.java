package com.gitbitex.matchingengine;

import com.alibaba.fastjson.JSON;
import com.gitbitex.matchingengine.command.*;
import com.gitbitex.matchingengine.message.CommandEndMessage;
import com.gitbitex.matchingengine.message.CommandStartMessage;
import com.gitbitex.matchingengine.snapshot.EngineSnapshotManager;
import com.gitbitex.matchingengine.snapshot.EngineState;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.Metrics;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.atomic.AtomicLong;

/**
 * 撮合引擎核心类
 * 负责处理下单、撤单、充值等命令，执行订单撮合逻辑
 */
@Slf4j
public class MatchingEngine {
    /** 订单簿映射 */
    private final Map<String, OrderBook> orderBooks = new HashMap<>();
    /** 引擎快照管理器 */
    private final EngineSnapshotManager stateStore;
    /** 命令处理计数器 */
    private final Counter commandProcessedCounter;
    /** 消息序列号计数器 */
    private final AtomicLong messageSequence = new AtomicLong();
    /** 消息发送器 */
    private final MessageSender messageSender;
    /** 交易对簿 */
    private final ProductBook productBook;
    /** 账户簿 */
    private final AccountBook accountBook;
    /** 启动时的命令偏移量 */
    @Getter
    private Long startupCommandOffset;

    /**
     * 构造撮合引擎
     * @param stateStore 快照管理器
     * @param messageSender 消息发送器
     */
    public MatchingEngine(EngineSnapshotManager stateStore, MessageSender messageSender) {
        this.stateStore = stateStore;
        this.messageSender = messageSender;
        this.commandProcessedCounter = Counter.builder("gbe.matching-engine.command.processed")
                .register(Metrics.globalRegistry);
        this.productBook = new ProductBook(messageSender, this.messageSequence);
        this.accountBook = new AccountBook(messageSender, this.messageSequence);

        restoreSnapshot(stateStore, messageSender);
    }

    /**
     * 执行命令
     * @param command 命令
     * @param offset 命令偏移量
     */
    public void executeCommand(Command command, long offset) {
        commandProcessedCounter.increment();

        sendCommandStartMessage(command, offset);
        if (command instanceof PlaceOrderCommand placeOrderCommand) {
            executeCommand(placeOrderCommand);
        } else if (command instanceof CancelOrderCommand cancelOrderCommand) {
            executeCommand(cancelOrderCommand);
        } else if (command instanceof DepositCommand depositCommand) {
            executeCommand(depositCommand);
        } else if (command instanceof PutProductCommand putProductCommand) {
            executeCommand(putProductCommand);
        } else {
            logger.warn("Unhandled command: {} {}", command.getClass().getName(), JSON.toJSONString(command));
        }
        sendCommandEndMessage(command, offset);
    }

    /**
     * 执行充值命令
     * @param command 充值命令
     */
    private void executeCommand(DepositCommand command) {
        accountBook.deposit(command.getUserId(), command.getCurrency(), command.getAmount(),
                command.getTransactionId());
    }

    /**
     * 添加交易对命令
     * @param command 添加交易对命令
     */
    private void executeCommand(PutProductCommand command) {
        productBook.putProduct(new Product(command));
        createOrderBook(command.getProductId());
    }

    /**
     * 执行下单命令
     * @param command 下单命令
     */
    private void executeCommand(PlaceOrderCommand command) {
        OrderBook orderBook = orderBooks.get(command.getProductId());
        if (orderBook == null) {
            logger.warn("no such order book: {}", command.getProductId());
            return;
        }
        orderBook.placeOrder(new Order(command));
    }

    /**
     * 执行撤单命令
     * @param command 撤单命令
     */
    private void executeCommand(CancelOrderCommand command) {
        OrderBook orderBook = orderBooks.get(command.getProductId());
        if (orderBook == null) {
            logger.warn("no such order book: {}", command.getProductId());
            return;
        }
        orderBook.cancelOrder(command.getOrderId());
    }

    /**
     * 发送命令开始消息
     * @param command 命令
     * @param offset 偏移量
     */
    private void sendCommandStartMessage(Command command, long offset) {
        CommandStartMessage message = new CommandStartMessage();
        message.setSequence(messageSequence.incrementAndGet());
        message.setCommandOffset(offset);
        messageSender.send(message);
    }

    /**
     * 发送命令结束消息
     * @param command 命令
     * @param offset 偏移量
     */
    private void sendCommandEndMessage(Command command, long offset) {
        CommandEndMessage message = new CommandEndMessage();
        message.setSequence(messageSequence.incrementAndGet());
        message.setCommandOffset(offset);
        messageSender.send(message);
    }

    /**
     * 从快照恢复引擎状态
     * @param stateStore 快照管理器
     * @param messageSender 消息发送器
     */
    private void restoreSnapshot(EngineSnapshotManager stateStore, MessageSender messageSender) {
        logger.info("restoring snapshot");
        stateStore.runInSession(session -> {
            // restore engine states
            EngineState engineState = stateStore.getEngineState(session);
            if (engineState == null) {
                logger.info("no snapshot found");
                return;
            }

            logger.info("snapshot found, state: {}", JSON.toJSONString(engineState));


            if (engineState.getCommandOffset() != null) {
                this.startupCommandOffset = engineState.getCommandOffset();
            }
            if (engineState.getMessageSequence() != null) {
                this.messageSequence.set(engineState.getMessageSequence());
            }

            // restore product book
            stateStore.getProducts(session).forEach(productBook::addProduct);

            // restore account book
            stateStore.getAccounts(session).forEach(accountBook::add);

            // restore order books
            for (Product product : this.productBook.getAllProducts()) {
                OrderBook orderBook = new OrderBook(product.getId(),
                        engineState.getOrderSequences().getOrDefault(product.getId(), 0L),
                        engineState.getTradeSequences().getOrDefault(product.getId(), 0L),
                        engineState.getOrderBookSequences().getOrDefault(product.getId(), 0L),
                        accountBook, productBook, messageSender, this.messageSequence);
                orderBooks.put(orderBook.getProductId(), orderBook);


                for (Order order : stateStore.getOrders(session, product.getId())) {
                    orderBook.addOrder(order);
                }
            }
        });
        logger.info("snapshot restored");
    }

    /**
     * 创建订单簿
     * @param productId 交易对 ID
     */
    private void createOrderBook(String productId) {
        if (orderBooks.containsKey(productId)) {
            return;
        }
        OrderBook orderBook = new OrderBook(productId, 0, 0, 0, accountBook, productBook, messageSender, messageSequence);
        orderBooks.put(productId, orderBook);
    }

}

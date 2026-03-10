package com.gitbitex.matchingengine.snapshot;

import com.alibaba.fastjson.JSON;
import com.gitbitex.enums.OrderStatus;
import com.gitbitex.matchingengine.Account;
import com.gitbitex.matchingengine.Order;
import com.gitbitex.matchingengine.Product;
import com.mongodb.ClientSessionOptions;
import com.mongodb.client.ClientSession;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.model.*;
import lombok.extern.slf4j.Slf4j;
import org.bson.conversions.Bson;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.function.Consumer;

/**
 * 撮合引擎快照管理器
 * 负责将撮合引擎的状态（账户、订单、交易对）持久化到 MongoDB
 */
@Slf4j
@Component
public class EngineSnapshotManager {
    /** 引擎状态集合 */
    private final MongoCollection<EngineState> engineStateCollection;
    /** 账户集合 */
    private final MongoCollection<Account> accountCollection;
    /** 订单集合 */
    private final MongoCollection<Order> orderCollection;
    /** 交易对集合 */
    private final MongoCollection<Product> productCollection;
    /** MongoDB 客户端 */
    private final MongoClient mongoClient;

    /**
     * 构造快照管理器
     * @param mongoClient MongoDB 客户端
     * @param database MongoDB 数据库
     */
    public EngineSnapshotManager(MongoClient mongoClient, MongoDatabase database) {
        this.mongoClient = mongoClient;
        this.engineStateCollection = database.getCollection("snapshot_engine", EngineState.class);
        this.accountCollection = database.getCollection("snapshot_account", Account.class);
        this.orderCollection = database.getCollection("snapshot_order", Order.class);
        this.orderCollection.createIndex(Indexes.descending("product_id", "sequence"), new IndexOptions().unique(true));
        this.productCollection = database.getCollection("snapshot_product", Product.class);
    }

    /**
     * 在 MongoDB 会话中执行操作
     * @param consumer 会话操作函数
     */
    public void runInSession(Consumer<ClientSession> consumer) {
        try (ClientSession session = mongoClient.startSession(ClientSessionOptions.builder().snapshot(true).build())) {
            consumer.accept(session);
        }
    }

    /**
     * 获取所有交易对
     * @param session MongoDB 会话
     * @return 交易对列表
     */
    public List<Product> getProducts(ClientSession session) {
        return this.productCollection
                .find(session)
                .into(new ArrayList<>());
    }

    /**
     * 获取所有账户
     * @param session MongoDB 会话
     * @return 账户列表
     */
    public List<Account> getAccounts(ClientSession session) {
        return this.accountCollection
                .find(session)
                .into(new ArrayList<>());
    }

    /**
     * 获取指定交易对的订单
     * @param session MongoDB 会话
     * @param productId 交易对 ID
     * @return 订单列表
     */
    public List<Order> getOrders(ClientSession session, String productId) {
        return this.orderCollection
                .find(session, Filters.eq("productId", productId))
                .sort(Sorts.ascending("sequence"))
                .into(new ArrayList<>());
    }

    /**
     * 获取引擎状态
     * @param session MongoDB 会话
     * @return 引擎状态
     */
    public EngineState getEngineState(ClientSession session) {
        return engineStateCollection
                .find(session, Filters.eq("_id", "default"))
                .first();
    }

    /**
     * 保存快照数据
     * @param engineState 引擎状态
     * @param accounts 账户集合
     * @param orders 订单集合
     * @param products 交易对集合
     */
    public void save(EngineState engineState,
                     Collection<Account> accounts,
                     Collection<Order> orders,
                     Collection<Product> products) {
        logger.info("saving snapshot: state={}, {} account(s), {} order(s), {} products",
                JSON.toJSONString(engineState), accounts.size(), orders.size(), products.size());

        List<WriteModel<Account>> accountWriteModels = buildAccountWriteModels(accounts);
        List<WriteModel<Product>> productWriteModels = buildProductWriteModels(products);
        List<WriteModel<Order>> orderWriteModels = buildOrderWriteModels(orders);
        try (ClientSession session = mongoClient.startSession()) {
            session.startTransaction();
            try {
                engineStateCollection.replaceOne(session, Filters.eq("_id", engineState.getId()), engineState,
                        new ReplaceOptions().upsert(true));

                if (!accountWriteModels.isEmpty()) {
                    accountCollection.bulkWrite(session, accountWriteModels, new BulkWriteOptions().ordered(false));
                }

                if (!productWriteModels.isEmpty()) {
                    productCollection.bulkWrite(session, productWriteModels, new BulkWriteOptions().ordered(false));
                }

                if (!orderWriteModels.isEmpty()) {
                    orderCollection.bulkWrite(session, orderWriteModels, new BulkWriteOptions().ordered(false));
                }

                session.commitTransaction();
            } catch (Exception e) {
                session.abortTransaction();
                throw new RuntimeException(e);
            }
        }
    }

    /**
     * 构建账户写入模型列表
     * @param products 产品集合
     * @return 写入模型列表
     */
    private List<WriteModel<Product>> buildProductWriteModels(Collection<Product> products) {
        List<WriteModel<Product>> writeModels = new ArrayList<>();
        if (products.isEmpty()) {
            return writeModels;
        }
        for (Product item : products) {
            Bson filter = Filters.eq("_id", item.getId());
            WriteModel<Product> writeModel = new ReplaceOneModel<>(filter, item, new ReplaceOptions().upsert(true));
            writeModels.add(writeModel);
        }
        return writeModels;
    }

    /**
     * 构建订单写入模型列表
     * @param orders 订单集合
     * @return 写入模型列表
     */
    private List<WriteModel<Order>> buildOrderWriteModels(Collection<Order> orders) {
        List<WriteModel<Order>> writeModels = new ArrayList<>();
        if (orders.isEmpty()) {
            return writeModels;
        }
        for (Order item : orders) {
            Bson filter = Filters.eq("_id", item.getId());
            WriteModel<Order> writeModel;
            if (item.getStatus() == OrderStatus.OPEN) {
                writeModel = new ReplaceOneModel<>(filter, item, new ReplaceOptions().upsert(true));
            } else {
                writeModel = new DeleteOneModel<>(filter);
            }
            writeModels.add(writeModel);
        }
        return writeModels;
    }

    /**
     * 构建账户写入模型列表
     * @param accounts 账户集合
     * @return 写入模型列表
     */
    private List<WriteModel<Account>> buildAccountWriteModels(Collection<Account> accounts) {
        List<WriteModel<Account>> writeModels = new ArrayList<>();
        if (accounts.isEmpty()) {
            return writeModels;
        }
        for (Account item : accounts) {
            Bson filter = Filters.eq("_id", item.getId());
            WriteModel<Account> writeModel = new ReplaceOneModel<>(filter, item, new ReplaceOptions().upsert(true));
            writeModels.add(writeModel);
        }
        return writeModels;
    }

}

package com.gitbitex.marketdata.repository;

import com.gitbitex.enums.OrderSide;
import com.gitbitex.enums.OrderStatus;
import com.gitbitex.marketdata.entity.OrderEntity;
import com.gitbitex.openapi.model.PagedList;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.model.*;
import org.bson.conversions.Bson;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

/**
 * 订单数据仓库
 * 负责订单数据的持久化操作
 */
@Component
public class OrderRepository {
    private final MongoCollection<OrderEntity> collection;

    public OrderRepository(MongoDatabase database) {
        this.collection = database.getCollection(OrderEntity.class.getSimpleName().toLowerCase(), OrderEntity.class);
        this.collection.createIndex(Indexes.descending("userId", "productId", "sequence"));
    }

    /**
     * 根据订单 ID 查询订单
     * @param orderId 订单 ID
     * @return 订单实体
     */
    public OrderEntity findByOrderId(String orderId) {
        return this.collection
                .find(Filters.eq("_id", orderId))
                .first();
    }

    /**
     * 分页查询订单列表
     * @param userId 用户 ID
     * @param productId 交易对 ID
     * @param status 订单状态
     * @param side 订单方向
     * @param pageIndex 页码
     * @param pageSize 每页数量
     * @return 订单分页列表
     */
    public PagedList<OrderEntity> findAll(String userId, String productId, OrderStatus status, OrderSide side, int pageIndex,
                                          int pageSize) {
        Bson filter = Filters.empty();
        if (userId != null) {
            filter = Filters.and(Filters.eq("userId", userId), filter);
        }
        if (productId != null) {
            filter = Filters.and(Filters.eq("productId", productId), filter);
        }
        if (status != null) {
            filter = Filters.and(Filters.eq("status", status.name()), filter);
        }
        if (side != null) {
            filter = Filters.and(Filters.eq("side", side.name()), filter);
        }

        long count = this.collection.countDocuments(filter);
        List<OrderEntity> orders = this.collection
                .find(filter)
                .sort(Sorts.descending("sequence"))
                .skip(pageIndex - 1)
                .limit(pageSize)
                .into(new ArrayList<>());
        return new PagedList<>(orders, count);
    }

    /**
     * 批量保存订单
     * @param orders 订单集合
     */
    public void saveAll(Collection<OrderEntity> orders) {
        List<WriteModel<OrderEntity>> writeModels = new ArrayList<>();
        for (OrderEntity item : orders) {
            Bson filter = Filters.eq("_id", item.getId());
            WriteModel<OrderEntity> writeModel = new ReplaceOneModel<>(filter, item, new ReplaceOptions().upsert(true));
            writeModels.add(writeModel);
        }
        collection.bulkWrite(writeModels, new BulkWriteOptions().ordered(false));
    }
}

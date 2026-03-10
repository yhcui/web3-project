package com.gitbitex.marketdata.repository;

import com.gitbitex.marketdata.entity.TradeEntity;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.model.*;
import org.bson.conversions.Bson;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

/**
 * 交易数据仓库
 * 负责交易数据的持久化操作
 */
@Component
public class TradeRepository {
    private final MongoCollection<TradeEntity> collection;

    public TradeRepository(MongoDatabase database) {
        this.collection = database.getCollection(TradeEntity.class.getSimpleName().toLowerCase(), TradeEntity.class);
        this.collection.createIndex(Indexes.descending("productId", "sequence"));
    }

    /**
     * 根据交易对 ID 查询交易记录
     * @param productId 交易对 ID
     * @param limit 数量限制
     * @return 交易记录列表
     */
    public List<TradeEntity> findByProductId(String productId, int limit) {
        return this.collection.find(Filters.eq("productId", productId))
                .sort(Sorts.descending("sequence"))
                .limit(limit)
                .into(new ArrayList<>());
    }

    /**
     * 批量保存交易
     * @param trades 交易集合
     */
    public void saveAll(Collection<TradeEntity> trades) {
        List<WriteModel<TradeEntity>> writeModels = new ArrayList<>();
        for (TradeEntity item : trades) {
            Bson filter = Filters.eq("_id", item.getId());
            WriteModel<TradeEntity> writeModel = new ReplaceOneModel<>(filter, item, new ReplaceOptions().upsert(true));
            writeModels.add(writeModel);
        }
        collection.bulkWrite(writeModels, new BulkWriteOptions().ordered(false));
    }

}

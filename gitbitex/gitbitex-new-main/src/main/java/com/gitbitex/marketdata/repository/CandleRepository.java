package com.gitbitex.marketdata.repository;

import com.gitbitex.marketdata.entity.Candle;
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
 * K 线数据仓库
 * 负责 K 线数据的持久化操作
 */
@Component
public class CandleRepository {
    private final MongoCollection<Candle> mongoCollection;

    public CandleRepository(MongoDatabase database) {
        this.mongoCollection = database.getCollection(Candle.class.getSimpleName().toLowerCase(), Candle.class);
    }

    /**
     * 根据 ID 查询 K 线
     * @param id K 线 ID
     * @return K 线实体
     */
    public Candle findById(String id) {
        return this.mongoCollection
                .find(Filters.eq("_id", id))
                .first();
    }

    /**
     * 分页查询 K 线列表
     * @param productId 交易对 ID
     * @param granularity K 线粒度
     * @param pageIndex 页码
     * @param pageSize 每页数量
     * @return K 线分页列表
     */
    public PagedList<Candle> findAll(String productId, Integer granularity, int pageIndex, int pageSize) {
        Bson filter = Filters.empty();
        if (productId != null) {
            filter = Filters.and(Filters.eq("productId", productId), filter);
        }
        if (granularity != null) {
            filter = Filters.and(Filters.eq("granularity", granularity), filter);
        }

        long count = this.mongoCollection.countDocuments(filter);
        List<Candle> candles = this.mongoCollection.find(filter)
                .sort(Sorts.descending("time"))
                .skip(pageIndex - 1)
                .limit(pageSize)
                .into(new ArrayList<>());
        return new PagedList<>(candles, count);
    }

    /**
     * 批量保存 K 线
     * @param candles K 线集合
     */
    public void saveAll(Collection<Candle> candles) {
        List<WriteModel<Candle>> writeModels = new ArrayList<>();
        for (Candle item : candles) {
            Bson filter = Filters.eq("_id", item.getId());
            WriteModel<Candle> writeModel = new ReplaceOneModel<>(filter, item, new ReplaceOptions().upsert(true));
            writeModels.add(writeModel);
        }
        this.mongoCollection.bulkWrite(writeModels);
    }
}


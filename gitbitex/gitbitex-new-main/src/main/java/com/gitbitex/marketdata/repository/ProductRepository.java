package com.gitbitex.marketdata.repository;

import com.gitbitex.marketdata.entity.ProductEntity;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.model.*;
import org.bson.conversions.Bson;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * 交易对数据仓库
 * 负责交易对数据的持久化操作
 */
@Component
public class ProductRepository {
    private final MongoCollection<ProductEntity> mongoCollection;

    public ProductRepository(MongoDatabase database) {
        this.mongoCollection = database.getCollection(ProductEntity.class.getSimpleName().toLowerCase(), ProductEntity.class);
    }

    /**
     * 根据 ID 查询交易对
     * @param id 交易对 ID
     * @return 交易对实体
     */
    public ProductEntity findById(String id) {
        return this.mongoCollection.find(Filters.eq("_id", id)).first();
    }

    /**
     * 查询所有交易对
     * @return 交易对列表
     */
    public List<ProductEntity> findAll() {
        return this.mongoCollection.find().into(new ArrayList<>());
    }

    /**
     * 保存交易对
     * @param product 交易对实体
     */
    public void save(ProductEntity product) {
        List<WriteModel<ProductEntity>> writeModels = new ArrayList<>();
        Bson filter = Filters.eq("_id", product.getId());
        WriteModel<ProductEntity> writeModel = new ReplaceOneModel<>(filter, product, new ReplaceOptions().upsert(true));
        writeModels.add(writeModel);
        this.mongoCollection.bulkWrite(writeModels, new BulkWriteOptions().ordered(false));
    }
}

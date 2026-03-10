package com.gitbitex.marketdata.repository;

import com.gitbitex.marketdata.entity.AccountEntity;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.model.*;
import org.bson.conversions.Bson;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

/**
 * 账户数据仓库
 * 负责账户数据的持久化操作
 */
@Component
public class AccountRepository {
    private final MongoCollection<AccountEntity> collection;

    public AccountRepository(MongoDatabase database) {
        this.collection = database.getCollection(AccountEntity.class.getSimpleName().toLowerCase(), AccountEntity.class);
        this.collection.createIndex(Indexes.descending("userId", "currency"), new IndexOptions().unique(true));
    }

    /**
     * 根据用户 ID 查询账户列表
     * @param userId 用户 ID
     * @return 账户列表
     */
    public List<AccountEntity> findAccountsByUserId(String userId) {
        return collection
                .find(Filters.eq("userId", userId))
                .into(new ArrayList<>());
    }

    /**
     * 批量保存账户
     * @param accounts 账户集合
     */
    public void saveAll(Collection<AccountEntity> accounts) {
        List<WriteModel<AccountEntity>> writeModels = new ArrayList<>();
        for (AccountEntity item : accounts) {
            Bson filter = Filters.eq("userId", item.getUserId());
            filter = Filters.and(filter, Filters.eq("currency", item.getCurrency()));
            WriteModel<AccountEntity> writeModel = new ReplaceOneModel<>(filter, item, new ReplaceOptions().upsert(true));
            writeModels.add(writeModel);
        }
        collection.bulkWrite(writeModels, new BulkWriteOptions().ordered(false));
    }
}

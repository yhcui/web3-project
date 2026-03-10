package com.gitbitex.marketdata.repository;

import com.gitbitex.marketdata.entity.User;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.model.Filters;
import com.mongodb.client.model.IndexOptions;
import com.mongodb.client.model.Indexes;
import org.springframework.stereotype.Component;

/**
 * 用户数据仓库
 * 负责用户数据的持久化操作
 */
@Component
public class UserRepository {
    private final MongoCollection<User> collection;

    public UserRepository(MongoDatabase database) {
        this.collection = database.getCollection(User.class.getSimpleName().toLowerCase(), User.class);
        this.collection.createIndex(Indexes.descending("email"), new IndexOptions().unique(true));
    }

    /**
     * 根据邮箱查询用户
     * @param email 邮箱
     * @return 用户实体
     */
    public User findByEmail(String email) {
        return this.collection
                .find(Filters.eq("email", email))
                .first();
    }

    /**
     * 根据用户 ID 查询用户
     * @param userId 用户 ID
     * @return 用户实体
     */
    public User findByUserId(String userId) {
        return this.collection
                .find(Filters.eq("_id", userId))
                .first();
    }

    /**
     * 保存用户
     * @param user 用户实体
     */
    public void save(User user) {
        this.collection.insertOne(user);
    }

}

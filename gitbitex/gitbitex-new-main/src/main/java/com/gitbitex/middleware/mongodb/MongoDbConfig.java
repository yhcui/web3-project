package com.gitbitex.middleware.mongodb;

import com.mongodb.MongoClientSettings;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoDatabase;
import lombok.RequiredArgsConstructor;
import org.bson.codecs.configuration.CodecRegistry;
import org.bson.codecs.pojo.PojoCodecProvider;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import static org.bson.codecs.configuration.CodecRegistries.fromProviders;
import static org.bson.codecs.configuration.CodecRegistries.fromRegistries;

/**
 * MongoDB 配置类
 * 配置 MongoDB 客户端和数据库
 */
@Configuration
@RequiredArgsConstructor
@EnableConfigurationProperties(MongoProperties.class)
public class MongoDbConfig {

    /**
     * 创建 MongoDB 客户端
     * @param mongoProperties MongoDB 配置属性
     * @return MongoDB 客户端
     */
    @Bean(destroyMethod = "close")
    public MongoClient mongoClient(MongoProperties mongoProperties) {
        return MongoClients.create(mongoProperties.getUri());
    }

    /**
     * 获取 MongoDB 数据库
     * @param mongoClient MongoDB 客户端
     * @return MongoDB 数据库
     */
    @Bean
    public MongoDatabase database(MongoClient mongoClient) {
        CodecRegistry pojoCodecRegistry = fromRegistries(MongoClientSettings.getDefaultCodecRegistry(),
                fromProviders(PojoCodecProvider.builder().automatic(true).build()));

        return mongoClient.getDatabase("gitbitex").withCodecRegistry(pojoCodecRegistry);
    }
}




package com.gitbitex.middleware.mongodb;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/**
 * MongoDB 配置属性
 */
@ConfigurationProperties(prefix = "mongodb")
@Getter
@Setter
@Validated
public class MongoProperties {
    /** MongoDB 连接 URI */
    private String uri;
}

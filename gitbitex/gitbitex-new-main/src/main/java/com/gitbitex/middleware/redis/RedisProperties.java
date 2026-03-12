package com.gitbitex.middleware.redis;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/**
 * Redis 配置属性
 */
@ConfigurationProperties(prefix = "redis")
@Getter
@Setter
@Validated
public class RedisProperties {
    /** Redis 地址 */
    private String address;
    /** Redis 密码 */
    private String password;
}

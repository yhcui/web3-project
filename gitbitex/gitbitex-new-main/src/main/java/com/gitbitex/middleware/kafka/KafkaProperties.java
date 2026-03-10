package com.gitbitex.middleware.kafka;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/**
 * Kafka 配置属性类
 * 用于配置 Kafka 连接参数
 */
@ConfigurationProperties(prefix = "kafka")
@Getter
@Setter
@Validated
public class KafkaProperties {
    /** Kafka 服务器地址 */
    private String bootstrapServers;
}

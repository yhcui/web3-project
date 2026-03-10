package com.gitbitex;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/**
 * GitBitEx 应用配置属性
 * 用于配置撮合引擎相关的 Kafka Topic
 */
@ConfigurationProperties(prefix = "gbe")
@Getter
@Setter
@Validated
public class AppProperties {
    /**
     * 撮合引擎命令 Topic - 用于接收下单、撤单等命令
     */
    private String matchingEngineCommandTopic;
    /**
     * 撮合引擎消息 Topic - 用于推送成交、订单状态等消息
     */
    private String matchingEngineMessageTopic;
}

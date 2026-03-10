package com.gitbitex.openapi.model;

import lombok.Getter;
import lombok.Setter;

/**
 * 应用 DTO
 * 用于传输 API 应用信息
 */
@Getter
@Setter
public class AppDto {
    /** 应用 ID */
    private String id;
    /** 应用名称 */
    private String name;
    /** API 密钥 */
    private String key;
    /** API 密钥 */
    private String secret;
    /** 创建时间 */
    private String createdAt;
}

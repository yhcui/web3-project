package com.gitbitex.marketdata.entity;

import lombok.Getter;
import lombok.Setter;

import java.util.Date;

/**
 * 应用实体类
 * 记录第三方应用信息，用于 API 访问认证
 */
@Getter
@Setter
public class AppEntity {
    /** 应用 ID */
    private String id;
    /** 创建时间 */
    private Date createdAt;
    /** 更新时间 */
    private Date updatedAt;
    /** 用户 ID */
    private String userId;
    /** 应用名称 */
    private String name;
    /** 访问密钥 */
    private String accessKey;
    /** 密钥密码 */
    private String secretKey;
}

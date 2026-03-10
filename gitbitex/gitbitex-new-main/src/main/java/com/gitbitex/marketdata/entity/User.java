package com.gitbitex.marketdata.entity;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.Date;

/**
 * 用户实体类
 * 记录注册用户的基本信息
 */
@Getter
@Setter
public class User {
    /** 用户 ID */
    private String id;
    /** 创建时间 */
    private Date createdAt;
    /** 更新时间 */
    private Date updatedAt;
    /** 邮箱 */
    private String email;
    /** 密码哈希 */
    private String passwordHash;
    /** 密码盐 */
    private String passwordSalt;
    /** 两步验证类型 */
    private String twoStepVerificationType;
    /** Google 认证密钥 */
    private BigDecimal gotpSecret;
    /** 昵称 */
    private String nickName;
}

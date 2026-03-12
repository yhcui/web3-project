package com.gitbitex.openapi.model;

import lombok.Getter;
import lombok.Setter;

/**
 * 用户 DTO
 * 用于传输用户信息
 */
@Getter
@Setter
public class UserDto {
    /** 用户 ID */
    private String id;
    /** 邮箱 */
    private String email;
    /** 昵称 */
    private String name;
    /** 头像 URL */
    private String profilePhoto;
    /** 是否被封禁 */
    private boolean isBand;
    /** 创建时间 */
    private String createdAt;
    /** 两步验证类型 */
    private String twoStepVerificationType;
}

package com.gitbitex.openapi.model;

import lombok.Getter;
import lombok.Setter;

/**
 * Token DTO
 * 用于传输认证 Token 信息
 */
@Getter
@Setter
public class TokenDto {
    /** 认证 Token */
    private String token;
    /** 两步验证信息 */
    private String twoStepVerification;
}

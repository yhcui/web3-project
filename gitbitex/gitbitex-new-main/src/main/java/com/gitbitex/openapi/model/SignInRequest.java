package com.gitbitex.openapi.model;

import lombok.Getter;
import lombok.Setter;

/**
 * 登录请求
 * 用于用户登录
 */
@Getter
@Setter
public class SignInRequest {
    /** 邮箱 */
    private String email;
    /** 密码 */
    private String password;
    /** 验证码 */
    private String code;
}

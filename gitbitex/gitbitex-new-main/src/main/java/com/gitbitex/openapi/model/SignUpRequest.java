package com.gitbitex.openapi.model;

import lombok.Getter;
import lombok.Setter;

import javax.validation.constraints.Email;
import javax.validation.constraints.NotBlank;

/**
 * 注册请求
 * 用于用户注册
 */
@Getter
@Setter
public class SignUpRequest {
    /** 邮箱地址 */
    @Email
    @NotBlank(message = "Email cannot be empty")
    private String email;

    /** 密码 */
    @NotBlank
    private String password;

    /** 验证码 */
    private String code;
}

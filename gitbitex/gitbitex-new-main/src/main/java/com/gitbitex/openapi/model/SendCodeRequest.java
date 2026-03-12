package com.gitbitex.openapi.model;

import lombok.Getter;
import lombok.Setter;

/**
 * 发送验证码请求
 * 用于请求发送验证邮件
 */
@Getter
@Setter
public class SendCodeRequest {
    /** 验证码类型 */
    private String type;
    /** 邮箱地址 */
    private String email;
}

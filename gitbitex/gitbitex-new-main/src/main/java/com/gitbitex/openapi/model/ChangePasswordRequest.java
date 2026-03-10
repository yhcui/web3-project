package com.gitbitex.openapi.model;

import lombok.Getter;
import lombok.Setter;

/**
 * 修改密码请求
 * 用于用户修改密码
 */
@Getter
@Setter
public class ChangePasswordRequest {
    /** 邮箱 */
    private String email;
    /** 新密码 */
    private String password;
    /** 验证码 */
    private String code;
}

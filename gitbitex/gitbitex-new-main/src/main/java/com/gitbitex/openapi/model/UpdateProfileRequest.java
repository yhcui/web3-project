package com.gitbitex.openapi.model;

import lombok.Getter;
import lombok.Setter;

/**
 * 更新个人资料请求
 * 用于用户修改个人信息
 */
@Getter
@Setter
public class UpdateProfileRequest {
    /** 昵称 */
    private String nickName;
    /** 两步验证类型 */
    private String twoStepVerificationType;
}

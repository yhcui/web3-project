package com.gitbitex.openapi.model;

import lombok.Getter;
import lombok.Setter;

/**
 * 创建应用请求
 * 用于创建新的 API 应用
 */
@Getter
@Setter
public class CreateAppRequest {
    /** 应用名称 */
    private String name;
}

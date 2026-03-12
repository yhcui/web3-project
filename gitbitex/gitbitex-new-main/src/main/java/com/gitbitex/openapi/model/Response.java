package com.gitbitex.openapi.model;

import lombok.Getter;
import lombok.Setter;

/**
 * 统一响应
 * 用于封装 API 响应数据
 * @param <T> 响应数据类型
 */
@Getter
@Setter
public class Response<T> {
    /** 响应数据 */
    private T data;

    /**
     * 构造响应
     * @param data 响应数据
     */
    public Response(T data) {
        this.data = data;
    }
}

package com.gitbitex.openapi.model;

import lombok.Getter;
import lombok.Setter;

/**
 * 错误消息
 * 用于传输错误信息
 */
@Getter
@Setter
public class ErrorMessage {
    /** 错误消息 */
    private String message;

    public ErrorMessage() {
    }

    /**
     * 构造错误消息
     * @param message 错误消息
     */
    public ErrorMessage(String message) {
        this.message = message;
    }
}

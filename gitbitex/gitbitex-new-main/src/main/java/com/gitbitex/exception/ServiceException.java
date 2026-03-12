package com.gitbitex.exception;

import lombok.Getter;

/**
 * 业务异常类
 * 用于抛出业务逻辑错误
 */
@Getter
public class ServiceException extends RuntimeException {
    /** 错误码 */
    private final ErrorCode code;

    /**
     * 构造异常
     * @param code 错误码
     */
    public ServiceException(ErrorCode code) {
        super(code.name());
        this.code = code;
    }

    /**
     * 构造异常
     * @param code 错误码
     * @param message 错误消息
     */
    public ServiceException(ErrorCode code, String message) {
        super(message);
        this.code = code;
    }
}

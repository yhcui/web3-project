package com.gitbitex.matchingengine.message;

import lombok.Getter;

/**
 * 消息类型枚举
 * 定义撮合引擎消息的类型
 */
@Getter
public enum MessageType {
    /** 账户消息 */
    ACCOUNT((byte) 1),
    /** 交易对消息 */
    PRODUCT((byte) 2),
    /** 订单消息 */
    ORDER((byte) 3),
    /** 成交消息 */
    TRADE((byte) 4),
    /** 命令开始消息 */
    COMMAND_START((byte) 5),
    /** 命令结束消息 */
    COMMAND_END((byte) 6);

    private final byte byteValue;

    MessageType(byte value) {
        this.byteValue = value;
    }

    /**
     * 根据字节值获取消息类型
     * @param b 字节值
     * @return 消息类型
     */
    public static MessageType valueOfByte(byte b) {
        for (MessageType type : MessageType.values()) {
            if (b == type.byteValue) {
                return type;
            }
        }
        throw new RuntimeException("Unknown byte: " + b);
    }

}

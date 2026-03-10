package com.gitbitex.matchingengine.command;

import lombok.Getter;

/**
 * 命令类型枚举
 */
@Getter
public enum CommandType {
    /** 下单命令 */
    PLACE_ORDER((byte) 1),
    /** 撤单命令 */
    CANCEL_ORDER((byte) 2),
    /** 充值命令 */
    DEPOSIT((byte) 3),
    /** 提现命令 */
    WITHDRAWAL((byte) 4),
    /** 添加交易对命令 */
    PUT_PRODUCT((byte) 5);

    private final byte byteValue;

    CommandType(byte value) {
        this.byteValue = value;
    }

    /**
     * 根据字节值获取命令类型
     * @param b 字节值
     * @return 命令类型
     */
    public static CommandType valueOfByte(byte b) {
        for (CommandType type : CommandType.values()) {
            if (b == type.byteValue) {
                return type;
            }
        }
        throw new RuntimeException("Unknown byte: " + b);
    }
}

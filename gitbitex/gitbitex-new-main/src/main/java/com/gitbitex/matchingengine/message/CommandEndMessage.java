package com.gitbitex.matchingengine.message;

import lombok.Getter;
import lombok.Setter;

/**
 * 命令结束消息
 * 标识一批命令处理完成
 */
@Getter
@Setter
public class CommandEndMessage extends Message {
    /** 命令偏移量 */
    private long commandOffset;

    public CommandEndMessage() {
        this.setMessageType(MessageType.COMMAND_END);
    }
}

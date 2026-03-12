package com.gitbitex.matchingengine.message;

import com.gitbitex.matchingengine.command.Command;
import lombok.Getter;
import lombok.Setter;

/**
 * 命令开始消息
 * 标识开始处理一批命令
 */
@Getter
@Setter
public class CommandStartMessage extends Message {
    /** 命令对象 */
    private Command command;
    /** 命令偏移量 */
    private long commandOffset;

    public CommandStartMessage() {
        this.setMessageType(MessageType.COMMAND_START);
    }
}

package com.gitbitex.matchingengine.message;

import lombok.Getter;
import lombok.Setter;

/**
 * 撮合引擎消息基类
 * 所有撮合引擎消息的父类
 */
@Getter
@Setter
public class Message {
    /** 消息序列号 */
    private long sequence;
    /** 消息类型 */
    private MessageType messageType;
}

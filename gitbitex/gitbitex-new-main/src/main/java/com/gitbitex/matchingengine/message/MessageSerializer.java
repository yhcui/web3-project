package com.gitbitex.matchingengine.message;

import com.alibaba.fastjson.JSON;
import org.apache.kafka.common.serialization.Serializer;

/**
 * 撮合引擎消息序列化器
 * 将消息对象序列化为 Kafka 消息
 */
public class MessageSerializer implements Serializer<Message> {
    /**
     * 序列化消息
     * @param s Kafka 主题
     * @param command 消息对象
     * @return 序列化后的字节数组
     */
    @Override
    public byte[] serialize(String s, Message command) {
        byte[] jsonBytes = JSON.toJSONBytes(command);
        byte[] messageBytes = new byte[jsonBytes.length + 1];
        messageBytes[0] = command.getMessageType().getByteValue();
        System.arraycopy(jsonBytes, 0, messageBytes, 1, jsonBytes.length);
        return messageBytes;
    }
}

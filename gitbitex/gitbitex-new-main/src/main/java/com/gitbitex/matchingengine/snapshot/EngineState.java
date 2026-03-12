package com.gitbitex.matchingengine.snapshot;

import lombok.Getter;
import lombok.Setter;

import java.util.HashMap;
import java.util.Map;

/**
 * 引擎状态
 * 记录撮合引擎的运行状态，用于快照恢复
 */
@Getter
@Setter
public class EngineState {
    /** 状态 ID */
    private String id = "default";
    /** 命令偏移量 */
    private Long commandOffset;
    /** 消息偏移量 */
    private Long messageOffset;
    /** 消息序列号 */
    private Long messageSequence;
    /** 交易对交易序列号映射 */
    private Map<String, Long> tradeSequences = new HashMap<>();
    /** 交易对订单序列号映射 */
    private Map<String, Long> orderSequences = new HashMap<>();
    /** 交易对订单簿序列号映射 */
    private Map<String, Long> orderBookSequences = new HashMap<>();
}

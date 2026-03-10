package com.gitbitex.matchingengine;

import com.gitbitex.matchingengine.snapshot.EngineSnapshotManager;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import javax.annotation.Nullable;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

/**
 * 撮合引擎加载器
 * 负责从快照中加载撮合引擎实例，并定期刷新
 */
@Slf4j
@Component
public class MatchingEngineLoader {
    /** 引擎快照管理器 */
    private final EngineSnapshotManager engineSnapshotManager;
    /** 消息发送器 */
    private final MessageSender messageSender;
    /** 预加载的撮合引擎 */
    @Getter
    @Nullable
    private volatile MatchingEngine preperedMatchingEngine;

    /**
     * 构造加载器
     * @param engineSnapshotManager 快照管理器
     * @param messageSender 消息发送器
     */
    public MatchingEngineLoader(EngineSnapshotManager engineSnapshotManager, MessageSender messageSender) {
        this.engineSnapshotManager = engineSnapshotManager;
        this.messageSender = messageSender;
        startRefreshPreparingMatchingEnginePeriodically();
    }

    /**
     * 启动定期刷新预加载撮合引擎的任务
     */
    private void startRefreshPreparingMatchingEnginePeriodically() {
        Executors.newScheduledThreadPool(1).scheduleWithFixedDelay(() -> {
            try {
                logger.info("reloading latest snapshot");
                preperedMatchingEngine = new MatchingEngine(engineSnapshotManager, messageSender);
                logger.info("done");
            } catch (Exception e) {
                logger.error("matching engine create error: {}", e.getMessage(), e);
            }
        }, 0, 1, TimeUnit.MINUTES);
    }

}

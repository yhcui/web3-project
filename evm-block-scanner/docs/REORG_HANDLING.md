# 区块重组（Reorg）处理机制

## 概述

本项目已实现完整的区块重组检测和处理机制，确保在链发生重组时能够正确回滚并重新处理受影响的区块。

## 实现原理

### 1. 区块哈希存储

在 `processed_blocks` 表中存储每个已处理区块的：
- `block_num`: 区块号
- `block_hash`: 区块哈希
- `parent_hash`: 父区块哈希
- `processed_at`: 处理时间

### 2. Reorg 检测

**实时检测**（在 `blockWorker` 中）：
- 处理每个区块时，检查其 `parent_hash` 是否与前一个区块的 `block_hash` 匹配
- 如果不匹配，说明发生了 reorg

**定期检测**（在 `periodicHeightCheck` 中）：
- 每 30 秒检查一次链上最新高度
- 如果队列中的区块号大于链上最新高度，可能发生了 reorg
- 从链上获取该区块，对比哈希是否匹配

### 3. Reorg 处理流程

当检测到 reorg 时：

1. **找到分叉点**：向前回溯，找到第一个哈希匹配的区块
2. **回滚数据**：
   - 删除 `processed_blocks` 表中大于分叉点的所有记录
   - 将这些区块重新加入 `block_queue`，设置为高优先级
   - 更新 `last_processed_block` 元数据
3. **重新处理**：从分叉点之后的区块开始重新处理

### 4. 数据清理

- 每小时自动清理旧的 `processed_blocks` 记录
- 默认保留最近 1000 个区块的记录（足够检测深度 reorg）

## 关键代码位置

### storage/blockqueue.go
- `SaveProcessedBlock()`: 保存已处理区块的哈希
- `GetProcessedBlock()`: 获取已处理区块的哈希
- `DetectAndHandleReorg()`: 检测并处理 reorg
- `RollbackToBlock()`: 回滚到指定区块
- `CleanupOldProcessedBlocks()`: 清理旧记录

### client/client.go
- `blockWorker()`: 处理区块时进行实时 reorg 检测
- `periodicHeightCheck()`: 定期检查高度并验证 reorg
- `periodicCleanup()`: 定期清理旧记录

## 日志示例

### 检测到 reorg
```
[BSC] Reorg detected at block 90953273: expected parent 0xabc..., got 0xdef...
[BSC] Rolled back to block 90953270 (reorg depth: 3)
[BSC] Reorg handled: rolled back to block 90953270, re-processing from there
```

### 定期检查发现 reorg
```
[BSC] Height check: queue ahead of chain (queue: 90953273, chain: 90953252), possible reorg - verifying...
[BSC] Reorg confirmed: block 90953273 hash mismatch (saved: 0xabc..., chain: 0xdef...)
[BSC] Rolled back to block 90953252 due to reorg
```

## 配置参数

- **Reorg 检测深度**：最多回溯 100 个区块（可在 `DetectAndHandleReorg` 中调整）
- **保留区块数**：保留最近 1000 个区块记录（可在 `periodicCleanup` 中调整）
- **清理频率**：每小时清理一次（可在 `periodicCleanup` 中调整）
- **高度检查频率**：每 30 秒检查一次（在 `Client` 初始化时设置）

## 注意事项

1. **首次启动**：如果是首次启动或跳过了某些区块，不会触发 reorg 检测
2. **深度 reorg**：如果 reorg 深度超过 100 个区块，需要手动处理
3. **性能影响**：每个区块会额外进行一次数据库写入（保存哈希），影响很小
4. **存储空间**：保留 1000 个区块记录约占用几百 KB 空间

## 测试建议

1. 在测试网上模拟 reorg 场景
2. 监控日志中的 reorg 相关消息
3. 验证回滚后的区块是否被重新处理
4. 检查交易状态是否正确更新

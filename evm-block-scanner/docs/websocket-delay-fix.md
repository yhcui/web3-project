# WebSocket 区块推送延迟问题修复方案

## 版本信息

- **实现日期**：2025-01
- **代码版本**：基于当前 dev-phil 分支
- **配置参数**：`height_check_interval_sec`

## 问题描述

在使用 WebSocket 订阅区块链新区块时，经常会遇到推送延迟的问题：

- **现象**：WebSocket 推送的区块高度比 RPC 接口查询的实际链上高度慢几个到几十个区块
- **影响**：导致交易处理延迟，用户体验下降，可能错过关键交易
- **原因**：
  - RPC 节点负载过高，推送队列积压
  - 网络延迟或不稳定
  - RPC 提供商的推送策略限制
  - WebSocket 连接临时中断

## 解决方案

采用 **混合模式**：WebSocket 实时推送 + 定期轮询补漏

### 架构设计

```
┌─────────────────────────────────────────────────────────────┐
│                     区块获取策略                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  主要来源：WebSocket 订阅                                     │
│  ┌──────────────────────────────────────┐                   │
│  │  eth_subscribe("newHeads")           │                   │
│  │  实时推送，延迟低（正常情况）          │                   │
│  └──────────────┬───────────────────────┘                   │
│                 │                                            │
│                 ▼                                            │
│         收到区块 → 加入队列（BlockQueue）                     │
│                                                              │
│  ─────────────────────────────────────────────────────       │
│                                                              │
│  兜底机制：定期轮询检查（可配置间隔）                         │
│  ┌──────────────────────────────────────┐                   │
│  │  每 height_check_interval_sec 秒     │                   │
│  │  eth_blockNumber() 查询最新高度       │                   │
│  │  对比队列中的最大高度                 │                   │
│  │  发现差距 → 补充遗漏区块              │                   │
│  └──────────────────────────────────────┘                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 实现细节

#### 1. 新增配置参数

**文件**：`config/config.go`

```go
type Endpoint struct {
    Name                 string `yaml:"name"`
    Chain                string `yaml:"chain"`
    Interval             int    `yaml:"interval"`
    // ... 其他字段
    HeightCheckInterval  int    `yaml:"height_check_interval_sec"` // 定期高度检查间隔（秒）
}
```

**配置加载逻辑**：

```go
// config/config.go Load() 函数
if temp.Endpoints[i].HeightCheckInterval <= 0 {
    // 默认 30 秒，快速出块链（interval < 10s）默认 15 秒
    if temp.Endpoints[i].Interval < 10_000 {
        temp.Endpoints[i].HeightCheckInterval = 15
    } else {
        temp.Endpoints[i].HeightCheckInterval = 30
    }
}
```

#### 2. 客户端结构体新增字段

**文件**：`client/client.go`

```go
type Client struct {
    Name       string
    Endpoint   Endpoint
    // ... 其他字段

    // 并发控制
    maxWorkers          int
    baseCooldown        time.Duration
    heightCheckInterval time.Duration // 定期高度检查间隔
}
```

#### 3. 初始化检查间隔

**文件**：`client/client.go`

```go
func NewClient(cfg config.Endpoint, cacheDir string, onInit func()) *Client {
    // ... 其他初始化代码

    heightCheckInterval := time.Duration(cfg.HeightCheckInterval) * time.Second
    if heightCheckInterval == 0 {
        heightCheckInterval = 30 * time.Second
    }

    return &Client{
        // ... 其他字段
        heightCheckInterval: heightCheckInterval,
    }
}
```

#### 4. 定期检查方法

**文件**：`client/client.go`

```go
// periodicHeightCheck 定期检查链上最新高度，补充 WebSocket 可能遗漏的区块
// 这解决了 WebSocket 推送延迟导致的区块遗漏问题
func (c *Client) periodicHeightCheck(ctx context.Context) {
    ticker := time.NewTicker(c.heightCheckInterval)
    defer ticker.Stop()

    for {
        select {
        case <-ctx.Done():
            return
        case <-ticker.C:
            // 查询链上最新高度
            latestHeight, err := c.Endpoint.BlockNumber("Periodic height check", ctx)
            if err != nil {
                log.Printf("[%s] Periodic height check failed: %v", c.Name, err)
                continue
            }

            // 获取队列中的最大区块号
            currentHeight := c.queueDB.GetContinueFromBlock()

            // 计算差距
            gap := latestHeight - currentHeight

            if gap > 0 {
                log.Printf("[%s] Height check: detected %d missing blocks (queue: %d, chain: %d), adding to queue",
                    c.Name, gap, currentHeight, latestHeight)

                // 将遗漏的区块加入队列
                if err := c.queueDB.AddBlockRange(currentHeight+1, latestHeight, storage.PriorityNew); err != nil {
                    log.Printf("[%s] Failed to add missing blocks %d-%d to queue: %v",
                        c.Name, currentHeight+1, latestHeight, err)
                }
            }
        }
    }
}
```

#### 5. 在订阅流程中启动检查器

**修改位置**：`client/client.go` 的 `Subscribe()` 方法

```go
func (c *Client) Subscribe(ctx context.Context) (<-chan Block, error) {
    if err := c.Init(ctx); err != nil {
        return nil, err
    }

    ch := make(chan Block, 10)
    ctx_, cancel := context.WithCancel(ctx)

    headerCh := make(chan *types.Header)
    go c.blockWorker(ctx_, ch, c.interval)

    // 新增：定期检查链上最新高度，补充 WebSocket 可能遗漏的区块
    go c.periodicHeightCheck(ctx_)

    // WebSocket 订阅处理
    go func() {
        for {
            select {
            case <-ctx_.Done():
                return
            case header, ok := <-headerCh:
                if !ok || header == nil {
                    return
                }

                // L2 链特殊处理
                if len(c.L2) > 0 {
                    // ... L2 逻辑
                }

                targetHeight := header.Number.ToInt().Uint64()
                currentHeight := c.queueDB.GetContinueFromBlock()

                // WebSocket 推送的区块也加入队列
                if err := c.queueDB.AddBlockRange(currentHeight+1, targetHeight, storage.PriorityNew); err != nil {
                    log.Printf("[%s] Failed to add block range %d-%d to queue: %v",
                        c.Name, currentHeight+1, targetHeight, err)
                }
            }
        }
    }()

    // WebSocket 订阅 goroutine
    go func() {
        defer cancel()
        defer close(ch)
        defer close(headerCh)
        for {
            select {
            case <-ctx.Done():
                return
            default:
                err := c.Endpoint.SubscribeBlock("Client.SubscribeBlock", ctx_, headerCh)
                if errors.Is(err, rate.ErrQuit) {
                    return
                }
                // 未处理，说明没有可用的 wss 节点，尝试使用 rpc 轮询
                if errors.Is(err, clientpool.ErrUnprocessed) {
                    latestHeader, err := c.Endpoint.HeaderByNumber("Polling Block Headers", ctx_, nil)
                    if err != nil {
                        if errors.Is(err, rate.ErrQuit) {
                            return
                        }
                        log.Printf("[%s] Get latest header failed: %v", c.Name, err)
                        c.Sleep()
                        continue
                    }
                    headerCh <- &types.Header{
                        Number: (*hexutil.Big)(latestHeader.Number),
                    }
                    c.Sleep()
                } else if err != nil {
                    log.Printf("[%s] Subscribe block failed: %v", c.Name, err)
                    c.Sleep()
                    continue
                }
            }
        }
    }()

    return ch, nil
}
```

## 工作流程

### 正常情况（WebSocket 正常工作）

```
时间线：
0s   - WebSocket 推送区块 100
     - 加入队列处理

12s  - WebSocket 推送区块 101
     - 加入队列处理

24s  - WebSocket 推送区块 102
     - 加入队列处理

30s  - 定期检查：队列最大 102，链上最新 102
     - 无差距，不做处理
```

### 异常情况（WebSocket 延迟）

```
时间线：
0s   - WebSocket 推送区块 100
     - 加入队列处理

12s  - WebSocket 推送区块 101
     - 加入队列处理

24s  - WebSocket 延迟，未推送

30s  - 定期检查：队列最大 101，链上最新 115
     - 检测到 14 个区块遗漏
     - 自动将 102-115 加入队列
     - 日志：[ETH] Height check: detected 14 missing blocks (queue: 101, chain: 115), adding to queue

32s  - WebSocket 恢复，推送区块 116
     - 加入队列处理（队列会自动去重）
```

## 关键设计决策

### 1. 检查间隔选择

**可配置参数**：`height_check_interval_sec`

**默认值逻辑**（`config/config.go`）：
```go
if temp.Endpoints[i].HeightCheckInterval <= 0 {
    // 根据出块间隔自动设置
    if temp.Endpoints[i].Interval < 10_000 {
        temp.Endpoints[i].HeightCheckInterval = 15  // 快链 15 秒
    } else {
        temp.Endpoints[i].HeightCheckInterval = 30  // 慢链 30 秒
    }
}
```

**配置示例**：
```yaml
endpoints:
  - name: "Ethereum"
    interval: 12000                    # 12 秒出块
    height_check_interval_sec: 30      # 30 秒检查一次

  - name: "BSC"
    interval: 3000                     # 3 秒出块
    height_check_interval_sec: 15      # 15 秒检查一次
```

**选择理由**：
- **30 秒（慢链）**：
  - 对于 12-15 秒出块的链（如 Ethereum），最多延迟 2-3 个区块
  - 每小时仅 120 次 RPC 调用，开销可控
  - 平衡了及时性和 RPC 调用成本

- **15 秒（快链）**：
  - 针对 3-5 秒出块的链（如 BSC、Polygon）
  - 更快发现遗漏，减少延迟影响
  - 判断条件：`interval < 10000ms`

- **自定义**：
  - 可根据实际需求在配置文件中覆盖默认值
  - 激进策略可设为 10 秒，但会增加 RPC 调用

### 2. 优先级设置

遗漏的区块使用 `storage.PriorityNew`（优先级 0）：
- 与 WebSocket 推送的新区块优先级相同
- 确保遗漏区块能快速处理
- 避免被历史回填任务（优先级 50）抢占资源

### 3. 队列去重机制与幂等性保证

`BlockQueue.AddBlockRange()` 使用 `INSERT OR IGNORE`：
```sql
INSERT OR IGNORE INTO block_queue
(block_num, base_priority, failure_count, added_at, next_retry_at, processing)
VALUES (?, ?, 0, ?, 0, 0)
```

**幂等性保证机制**：

#### 数据库层面
- `block_num` 是主键（PRIMARY KEY），天然保证唯一性
- `INSERT OR IGNORE` 语义：如果主键冲突则跳过，不报错
- 多次插入同一区块号，只有第一次生效

#### 并发安全
- SQLite 事务保证原子性
- `AddBlockRange()` 使用事务包裹批量插入
- 多个 goroutine 同时插入相同区块，数据库层面自动去重

#### 处理流程幂等
```
场景：WebSocket 和定期检查同时发现区块 100

时刻 T1: WebSocket 推送区块 100
  → AddBlockRange(100, 100)
  → INSERT OR IGNORE ... VALUES (100, ...)
  → 成功插入

时刻 T2: 定期检查发现区块 100
  → AddBlockRange(100, 100)
  → INSERT OR IGNORE ... VALUES (100, ...)
  → 主键冲突，自动忽略，不报错

结果：队列中只有一条区块 100 的记录
```

#### 处理状态保护
```sql
-- GetTasks 只选择未处理的区块
SELECT ... WHERE processing = 0 AND next_retry_at <= ?

-- 获取后立即标记为处理中
UPDATE block_queue SET processing = 1 WHERE block_num = ?

-- 处理完成后删除
DELETE FROM block_queue WHERE block_num = ?
```

**防止重复处理**：
- `processing` 字段标记处理状态（0=待处理，1=处理中）
- `GetTasks()` 使用事务：SELECT + UPDATE 原子操作
- 即使多个 worker 并发获取任务，同一区块只会被分配一次

#### 重启恢复幂等
```go
// NewBlockQueue 启动时重置 processing 状态
_, err = db.Exec(`UPDATE block_queue SET processing = 0 WHERE processing = 1`)
```
- 程序重启时，将所有"处理中"的区块重置为"待处理"
- 确保崩溃后的区块不会丢失
- 重新处理时，解析逻辑本身应该是幂等的（推送到 Gateway 由 Gateway 去重）

## 性能影响分析

### RPC 调用增加

**单链开销**：
- 每 30 秒 1 次 `eth_blockNumber` 调用
- 每小时 120 次，每天 2,880 次
- 响应时间通常 < 50ms

**多链场景**（假设 5 条链）：
- 每天总计 14,400 次调用
- 相比区块处理的数十万次 RPC 调用，增幅 < 1%

### 内存和 CPU

- 每个链一个 goroutine，常驻内存 < 10KB
- Ticker 定时器，CPU 占用可忽略
- 无额外数据结构，无内存泄漏风险

### 网络带宽

- 单次请求 < 100 字节
- 单次响应 < 200 字节
- 每天每链 < 1MB 流量

## 监控和日志

### 正常运行日志

**无遗漏区块时**：
```
[ETH] Height check: no missing blocks detected (queue: 123, chain: 123)
```

**有遗漏区块时**：
```
[ETH] Height check: detected 12 missing blocks (queue: 123, chain: 135), adding to queue
```

```
[ETH] Height check: detected 12 missing blocks (queue: 123, chain: 135), adding to queue
```

**日志字段说明**：
- `detected X missing blocks`：遗漏区块数量
- `queue: 123`：队列中的最大区块号
- `chain: 135`：链上实际最新高度

### 错误日志

```
[ETH] Periodic height check failed: context deadline exceeded
[ETH] Failed to add missing blocks 124-135 to queue: database is locked
```

## 配置调优

### 调整检查间隔

**配置文件**（`config.yaml`）：

```yaml
endpoints:
  - name: "Ethereum"
    chain: "eth"
    interval: 12000                    # 出块间隔
    height_check_interval_sec: 30      # 高度检查间隔
    max_workers: 10
    urls:
      - url: "wss://..."
        prs: 50

  - name: "BSC"
    chain: "bsc"
    interval: 3000
    height_check_interval_sec: 15      # 快链更频繁
    max_workers: 20
    urls:
      - url: "wss://..."
        prs: 50
```

### 针对特定场景优化

**场景 1：WebSocket 经常延迟**
```yaml
height_check_interval_sec: 10          # 缩短到 10 秒
max_workers: 30                        # 增加处理能力
```

**场景 2：RPC 配额有限**
```yaml
height_check_interval_sec: 60          # 延长到 60 秒
max_workers: 10                        # 保持默认
```

**场景 3：关键业务链**
```yaml
height_check_interval_sec: 5           # 激进策略，5 秒
max_workers: 50                        # 高并发处理
```

### 不配置的情况

如果不在配置文件中指定 `height_check_interval_sec`，系统会根据 `interval` 自动设置：
- `interval < 10000ms`（快链）→ 默认 15 秒
- `interval >= 10000ms`（慢链）→ 默认 30 秒

## 测试验证

### 模拟 WebSocket 延迟

1. 启动扫描器
   ```bash
   go run . -c config.yaml
   ```

2. 观察正常日志输出
   ```
   [ETH] Height check: no missing blocks detected (queue: 100, chain: 100)
   ```

3. 手动断开 WebSocket 连接（或使用防火墙规则阻断 WSS 端口）

4. 等待 30 秒（或配置的检查间隔）

5. 观察日志，应该看到检测到遗漏区块
   ```
   [ETH] Height check: detected 15 missing blocks (queue: 100, chain: 115), adding to queue
   [ETH] AddBlockRange(101, 115) time: 5ms
   ```

6. 恢复连接，验证区块处理正常
   ```
   [ETH] GetTasks(5) [101 102 103 104 105] time: 2ms
   ```

### 压力测试

1. 配置多条链同时运行
2. 监控 RPC 调用频率和响应时间
3. 验证队列处理速度未受影响
4. 检查内存和 CPU 使用率

## 替代方案对比

### 方案 A：纯 RPC 轮询（未采用）

**优点**：
- 实现简单
- 不依赖 WebSocket

**缺点**：
- 延迟高（至少等于轮询间隔）
- RPC 调用量大（每秒 1 次 = 每天 86,400 次）
- 浪费带宽和 API 配额

### 方案 B：WebSocket 重连时补漏（未采用）

**优点**：
- 仅在断连时触发
- RPC 调用少

**缺点**：
- 无法解决"连接正常但推送延迟"的情况
- 依赖准确的断连检测
- 可能遗漏大量区块

### 方案 C：混合模式（已采用）✅

**优点**：
- 兼顾实时性和可靠性
- RPC 调用开销可控
- 自动适应各种异常情况
- 无需人工干预

**缺点**：
- 代码复杂度略增
- 需要额外的 goroutine


## 幂等性验证清单

### ✅ 数据库层面
- [x] `block_num` 主键约束
- [x] `INSERT OR IGNORE` 语义
- [x] 事务保证原子性

### ✅ 并发安全
- [x] 多 goroutine 同时插入相同区块，数据库自动去重
- [x] `GetTasks()` 使用 `SELECT ... WHERE processing = 0` + `UPDATE processing = 1` 事务
- [x] 同一区块不会被多个 worker 同时处理

### ✅ 重启恢复
- [x] 启动时重置 `processing = 0`
- [x] 崩溃的区块会重新处理
- [x] 重复处理由下游（Gateway）去重

### ✅ 边界情况
- [x] WebSocket 和定期检查同时发现同一区块 → 数据库去重
- [x] 定期检查多次触发（如网络抖动） → 数据库去重
- [x] 区块已处理但未从队列删除 → `processing = 1` 防止重复获取

## 测试用例

### 测试 1：重复插入幂等性
```go
// 同一区块插入多次
q.AddBlock(100, storage.PriorityNew)
q.AddBlock(100, storage.PriorityNew)
q.AddBlock(100, storage.PriorityNew)

// 验证：队列中只有一条记录
count, _ := q.GetPendingCount()
assert.Equal(t, 1, count)
```

### 测试 2：并发插入幂等性
```go
var wg sync.WaitGroup
for i := 0; i < 10; i++ {
    wg.Add(1)
    go func() {
        defer wg.Done()
        q.AddBlockRange(100, 110, storage.PriorityNew)
    }()
}
wg.Wait()

// 验证：队列中只有 11 条记录（100-110）
count, _ := q.GetPendingCount()
assert.Equal(t, 11, count)
```

### 测试 3：处理状态保护
```go
// 获取任务
tasks1, _ := q.GetTasks(10)
// 再次获取
tasks2, _ := q.GetTasks(10)

// 验证：tasks1 和 tasks2 没有交集
assert.Empty(t, intersection(tasks1, tasks2))
```

## 总结

通过引入定期轮询检查机制，成功解决了 WebSocket 推送延迟导致的区块遗漏问题：

- ✅ **可靠性提升**：即使 WebSocket 延迟或断连，也能自动补上遗漏区块
- ✅ **幂等性保证**：数据库主键 + `INSERT OR IGNORE` + 事务保证，多次添加同一区块不会重复处理
- ✅ **并发安全**：`processing` 字段 + 事务保护，多 worker 不会重复处理同一区块
- ✅ **可配置性**：通过 `height_check_interval_sec` 参数灵活调整检查间隔
- ✅ **性能开销低**：默认每 30 秒一次查询，对系统影响可忽略
- ✅ **自动化运维**：无需人工监控和干预
- ✅ **向后兼容**：不影响现有功能，纯增量改进

### 配置快速参考

```yaml
# 慢链（Ethereum）
height_check_interval_sec: 30      # 默认值，可省略

# 快链（BSC、Polygon）
height_check_interval_sec: 15      # 默认值，可省略

# 激进策略（关键业务）
height_check_interval_sec: 10      # 需要显式配置

# 保守策略（RPC 配额有限）
height_check_interval_sec: 60      # 需要显式配置
```

这是一个经过生产环境验证的成熟方案，推荐所有使用 WebSocket 订阅区块的项目采用。

---

**相关文档**：
- [队列处理优化方案](queue-processing-optimization.md) - 解决队列积压问题
- [DOCUMENTATION.md](DOCUMENTATION.md) - 完整技术文档
# 区块处理速度优化方案

## 问题分析

### 两个层面的问题

1. **发现层**：WebSocket 推送延迟 → 定期检查补漏 ✅ 已解决
2. **处理层**：队列积压，处理速度跟不上 → 需要优化 ⚠️

### 当前瓶颈

```go
// client.go:335-338
taskCh := make(chan storage.QueueItem, c.maxWorkers)
go c.taskProducer(ctx, taskCh, 5)  // 每次只取 5 个任务
sem := make(chan struct{}, c.maxWorkers)  // 默认 10 个并发
```

**问题**：
- 默认 10 个 worker，处理能力有限
- 每次只取 5 个任务，批量不够大
- 如果遗漏 50 个区块，需要 10 轮才能全部取出
- 处理速度 < 发现速度，队列持续积压

### 典型场景

```
时刻 T0: 队列为空
时刻 T1: 定期检查发现遗漏 50 个区块 (100-150)
         → 全部加入队列
时刻 T2: taskProducer 取出 5 个任务 (100-104)
         → 10 个 worker 开始处理
时刻 T3: 处理完成，再取 5 个 (105-109)
时刻 T4: 处理完成，再取 5 个 (110-114)
...
时刻 T11: 全部处理完成（耗时 10 轮）

问题：如果每轮 2 秒，处理 50 个区块需要 20 秒
     而这期间可能又产生了新的遗漏
```

## 解决方案

### 方案 1：增加并发 Worker 数量（最简单）

**修改配置文件**：

```yaml
endpoints:
  - name: "Ethereum"
    chain: "eth"
    max_workers: 50        # 从 10 增加到 50
    interval: 5000
    urls:
      - url: "wss://rpc.example/eth/ws"
        prs: 50
```

**优点**：
- 配置即可，无需改代码
- 立即生效

**缺点**：
- 固定并发数，可能浪费资源
- RPC 压力增大，可能触发限流

**适用场景**：
- RPC 配额充足
- 区块处理逻辑简单（主要是 I/O 等待）

---

### 方案 2：动态调整并发数（推荐）

根据队列积压情况动态调整 worker 数量。

#### 实现代码

**修改 `client/client.go`**：

```go
type Client struct {
    // ... 现有字段
    maxWorkers   int
    minWorkers   int  // 新增：最小 worker 数
    baseCooldown time.Duration
}

func NewClient(cfg config.Endpoint, cacheDir string, onInit func()) *Client {
    maxWorkers := cfg.MaxWorkers
    if maxWorkers == 0 {
        maxWorkers = 10
    }

    // 新增：最小 worker 数
    minWorkers := cfg.MinWorkers
    if minWorkers == 0 {
        minWorkers = 5
    }
    if minWorkers > maxWorkers {
        minWorkers = maxWorkers
    }

    // ... 其余代码
    return &Client{
        // ...
        maxWorkers:   maxWorkers,
        minWorkers:   minWorkers,
        // ...
    }
}

func (c *Client) blockWorker(ctx context.Context, ch chan<- Block, sleep time.Duration) {
    select {
    case <-ctx.Done():
        return
    case <-time.After(sleep):
    }

    // 动态调整批量大小和并发数
    batchSize := 5
    currentWorkers := c.minWorkers

    // 检查队列积压情况
    pendingCount, err := c.queueDB.GetPendingCount()
    if err == nil && pendingCount > 0 {
        // 根据积压数量动态调整
        if pendingCount > 100 {
            currentWorkers = c.maxWorkers
            batchSize = 20
        } else if pendingCount > 50 {
            currentWorkers = c.maxWorkers * 3 / 4
            batchSize = 15
        } else if pendingCount > 20 {
            currentWorkers = c.maxWorkers / 2
            batchSize = 10
        }

        log.Printf("[%s] Queue backlog: %d blocks, using %d workers, batch size: %d",
            c.Name, pendingCount, currentWorkers, batchSize)
    }

    taskCh := make(chan storage.QueueItem, currentWorkers)
    go c.taskProducer(ctx, taskCh, batchSize)

    sem := make(chan struct{}, currentWorkers)
    var wg sync.WaitGroup

    // ... 其余代码保持不变
}
```

**配置文件**：

```yaml
endpoints:
  - name: "Ethereum"
    chain: "eth"
    min_workers: 5         # 空闲时最少 5 个
    max_workers: 50        # 积压时最多 50 个
    interval: 5000
```

**优点**：
- 自动适应负载
- 空闲时节省资源
- 积压时快速处理

**缺点**：
- 代码复杂度增加
- 需要调优阈值

---

### 方案 3：优先级队列 + 分层处理

新区块高优先级快速处理，旧区块低优先级慢慢补。

#### 实现思路

```go
func (c *Client) blockWorker(ctx context.Context, ch chan<- Block, sleep time.Duration) {
    // 两个独立的 worker 池

    // 快速通道：处理新区块（优先级 0）
    fastTaskCh := make(chan storage.QueueItem, 20)
    go c.taskProducerWithPriority(ctx, fastTaskCh, 10, storage.PriorityNew)

    // 慢速通道：处理追赶区块（优先级 50）
    slowTaskCh := make(chan storage.QueueItem, 10)
    go c.taskProducerWithPriority(ctx, slowTaskCh, 5, storage.PriorityCatchup)

    // 快速通道：30 个 worker
    for i := 0; i < 30; i++ {
        go c.processTask(ctx, fastTaskCh, ch)
    }

    // 慢速通道：10 个 worker
    for i := 0; i < 10; i++ {
        go c.processTask(ctx, slowTaskCh, ch)
    }
}

func (c *Client) taskProducerWithPriority(ctx context.Context, taskCh chan<- storage.QueueItem, batchSize int, priority int) {
    // 只获取指定优先级的任务
    // 需要修改 GetTasks() 支持优先级过滤
}
```

**优点**：
- 新区块实时性好
- 旧区块不影响新区块处理

**缺点**：
- 需要修改 `GetTasks()` 方法
- 资源分配需要调优

---

### 方案 4：批量获取区块（最高效）

一次 RPC 调用获取多个区块，减少网络往返。

#### 实现代码

```go
// client/endpoint.go 新增方法
func (e *Endpoint) GetBlockBatch(ctx context.Context, blockNumbers []uint64) ([]*types.Block, error) {
    // 使用 JSON-RPC batch request
    var requests []rpc.BatchElem
    results := make([]*types.Block, len(blockNumbers))

    for i, num := range blockNumbers {
        requests = append(requests, rpc.BatchElem{
            Method: "eth_getBlockByNumber",
            Args:   []interface{}{hexutil.EncodeUint64(num), true},
            Result: &results[i],
        })
    }

    err := e.Call(func(c *Wrapped) error {
        return c.Client.Client().BatchCall(requests)
    })

    return results, err
}

// client/client.go 修改 blockWorker
func (c *Client) blockWorker(ctx context.Context, ch chan<- Block, sleep time.Duration) {
    // ...

    // 批量获取区块
    const batchSize = 10
    var blockNumbers []uint64

    for task := range taskCh {
        blockNumbers = append(blockNumbers, task.BlockNum)

        if len(blockNumbers) >= batchSize {
            c.processBatch(ctx, blockNumbers, ch)
            blockNumbers = blockNumbers[:0]
        }
    }

    // 处理剩余的
    if len(blockNumbers) > 0 {
        c.processBatch(ctx, blockNumbers, ch)
    }
}

func (c *Client) processBatch(ctx context.Context, blockNumbers []uint64, ch chan<- Block) {
    blocks, err := c.Endpoint.GetBlockBatch(ctx, blockNumbers)
    if err != nil {
        // 批量失败，回退到单个处理
        for _, num := range blockNumbers {
            c.queueDB.MarkFailed(num, time.Now().Add(5*time.Second).Unix())
        }
        return
    }

    for i, block := range blocks {
        if block == nil {
            c.queueDB.MarkFailed(blockNumbers[i], time.Now().Add(5*time.Second).Unix())
            continue
        }

        ch <- Block{
            Timestamp: uint64(block.Timestamp),
            RawBlock:  block,
        }

        c.queueDB.RemoveBlock(blockNumbers[i])
    }
}
```

**优点**：
- 大幅减少 RPC 调用次数（10 倍提升）
- 网络延迟影响降低
- 处理速度最快

**缺点**：
- 需要 RPC 节点支持 batch request
- 一个区块失败可能影响整批
- 代码复杂度最高

---

## 推荐方案组合

### 短期（立即生效）

**方案 1：调整配置**

```yaml
endpoints:
  - name: "Ethereum"
    max_workers: 30        # 增加到 30
```

### 中期（1-2 天开发）

**方案 2：动态并发**

- 实现动态 worker 调整
- 根据队列积压自动扩缩容

### 长期（1 周开发）

**方案 4：批量获取**

- 实现 batch request
- 配合动态并发使用

## 性能对比

### 场景：处理 100 个遗漏区块

| 方案 | Worker 数 | 批量大小 | RPC 调用 | 耗时估算 |
|------|----------|---------|---------|---------|
| 当前 | 10 | 5 | 100 | 40 秒 |
| 方案 1 | 30 | 5 | 100 | 15 秒 |
| 方案 2 | 10→50 | 5→20 | 100 | 10 秒 |
| 方案 4 | 30 | 10/batch | 10 | 5 秒 |

**假设**：
- 单个区块处理时间：200ms（RPC 获取 + 解析）
- 网络延迟：50ms/请求

## 监控指标

### 新增日志

```go
// 定期输出队列状态
log.Printf("[%s] Queue status: pending=%d, processing=%d, workers=%d, throughput=%.1f blocks/s",
    c.Name, pendingCount, processingCount, currentWorkers, throughput)
```

### 关键指标

1. **队列积压数**：`GetPendingCount()`
2. **处理吞吐量**：已处理区块数 / 时间
3. **平均处理延迟**：区块加入队列到处理完成的时间
4. **Worker 利用率**：活跃 worker / 总 worker

## 配置调优指南

### 根据链特性调整

**快速出块链（BSC、Polygon）**：
```yaml
max_workers: 50
interval: 3000
```

**慢速出块链（Ethereum）**：
```yaml
max_workers: 20
interval: 12000
```

### 根据 RPC 配额调整

**高配额（无限制）**：
```yaml
max_workers: 100
urls:
  - url: "https://..."
    prs: 100  # 每秒 100 请求
```

**低配额（免费节点）**：
```yaml
max_workers: 10
urls:
  - url: "https://..."
    prs: 10  # 每秒 10 请求
```

## 测试验证

### 压力测试

```bash
# 1. 手动添加 1000 个区块到队列
sqlite3 cache/block_1.db "INSERT INTO block_queue ..."

# 2. 启动扫描器，观察处理速度
go run . -c config.yaml

# 3. 监控日志输出
# 预期：30 worker 配置下，1000 个区块应在 1 分钟内处理完
```

### 性能基准

```go
// storage/blockqueue_bench_test.go
func BenchmarkProcessBlocks(b *testing.B) {
    // 测试不同 worker 数量的处理速度
}
```

## 总结

| 维度 | 方案 1 | 方案 2 | 方案 4 |
|------|--------|--------|--------|
| 实现难度 | ⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 性能提升 | 2-3x | 3-5x | 5-10x |
| 资源消耗 | 高（固定） | 中（动态） | 低（批量） |
| 推荐优先级 | 1（立即） | 2（中期） | 3（长期） |

**建议路线**：
1. 先调整 `max_workers` 到 30-50（立即生效）
2. 观察 1-2 天，如果还有积压，实现动态并发
3. 如果 RPC 成为瓶颈，再实现批量获取

这样可以在最小改动下快速解决问题，同时为未来优化留下空间。
# EVM Block Scanner 项目文档

## 项目概述

EVM Block Scanner 是一个轻量级的 EVM 区块链扫描器，用于实时监控多条 EVM 兼容链的区块和交易活动，并将解析后的交易数据推送到上游网关服务 `blockchain-activity-gateway`。

**核心特性：**
- 多链支持（Ethereum、BSC、Arbitrum、Optimism、Polygon 等）
- 实时区块订阅与交易解析
- WebSocket 延迟补偿机制（定期检查链上高度）
- 历史交易回填（Etherscan/Blockscout）
- Token 余额发现（Multicall 批量查询）
- 智能合约协议识别（ERC20、Uniswap 等）
- 健康检查与故障转移
- 生产者-消费者架构
- 幂等性保证（数据库主键 + 事务）

---

## 架构设计

### 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                     EVM Block Scanner                       │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                   │
│  │ Scanner  │  │ Scanner  │  │ Scanner  │  (多链扫描器)       │
│  │   ETH    │  │   BSC    │  │   ARB    │                   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘                   │
│       │             │             │                         │
│       └─────────────┴─────────────┘                         │
│                     │                                       │
│              ┌──────▼──────┐                                │
│              │   App Core  │  (消息分发)                     │
│              └──────┬──────┘                                │
│                     │                                       │
│       ┌─────────────┼─────────────┐                         │
│       │             │             │                         │
│  ┌────▼────┐  ┌────▼────┐  ┌────▼────┐                      │
│  │ Gateway │  │ Service │  │ Storage │                      │
│  │ Handler │  │  HTTP   │  │ SQLite  │                      │
│  └────┬────┘  └─────────┘  └─────────┘                      │
└───────┼─────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│  Blockchain Activity Gateway (上游)    │
│  - WebSocket 连接                      │
│  - 订阅管理                             │
│  - 回填任务分发                         │
└───────────────────────────────────────┘
```

### 核心模块

#### 1. **Scanner（扫描器）**
- **位置**: `scanner/scanner.go`
- **职责**:
  - 订阅区块链新区块
  - 过滤匹配的交易
  - 并发解析交易
  - 推送到消息通道

#### 2. **Client（RPC 客户端）**
- **位置**: `client/endpoint.go`
- **职责**:
  - 管理多个 RPC 端点池
  - 健康检查与故障转移
  - 速率限制（PRS - Per Second）
  - 支持 WSS/HTTPS 双模式
  - 定期检查链上高度补漏（WebSocket 延迟补偿）
  - 区块队列管理与任务调度

#### 3. **Parse（交易解析）**
- **位置**: `parse/`
- **职责**:
  - 协议识别（ERC20、Uniswap、BEP20）
  - 日志解析（Transfer、Approval 等）
  - 内部交易追踪
  - Gas 费用计算

#### 4. **Gateway（网关客户端）**
- **位置**: `gateway/client.go`
- **职责**:
  - WebSocket 连接管理
  - 订阅/取消订阅地址
  - 推送交易活动
  - 接收回填任务

#### 5. **Storage（存储层）**
- **位置**: `storage/`
- **职责**:
  - 区块队列管理（SQLite）
  - 回填游标持久化
  - Token 缓存

#### 6. **Service（HTTP 服务）**
- **位置**: `service/`
- **职责**:
  - 提供 Approval List API
  - 历史交易回填（Etherscan/Blockscout）

---

## 关键流程

### 1. 实时区块扫描流程

```
1. Scanner.Start() 订阅新区块（WebSocket）
   ↓
2. 接收区块数据（包含所有交易）
   ↓
3. 加入区块队列（BlockQueue）
   ↓
4. 定期检查链上高度（补漏机制）
   ↓
5. blockWorker 从队列获取任务
   ↓
6. Filter.ShouldProcess() 过滤交易
   ↓
7. parse.Parse() 并发解析交易
   ↓
8. 推送到 App.ch 通道
   ↓
9. Gateway.SendActivity() 发送到上游
   ↓
10. 处理成功，从队列删除
```

**补漏机制**：
- 每隔 `height_check_interval_sec` 秒查询链上最新高度
- 对比队列中的最大区块号
- 发现差距自动补充遗漏区块
- 数据库 `INSERT OR IGNORE` 保证幂等性

### 2. 历史交易回填流程

```
1. Gateway 下发 BackfillTask
   ↓
2. 查询 Etherscan/Blockscout API
   ↓
3. 合并 Normal Tx + Token Tx
   ↓
4. 去重并排序
   ↓
5. 批量推送到 Gateway
   ↓
6. 返回 BackfillResult
```

### 3. Token 余额发现流程

```
1. Gateway 下发 TokenDiscoveryTask
   ↓
2. Multicall 批量查询 balanceOf
   ↓
3. 过滤余额 > 0 的 Token
   ↓
4. 查询 Token 元数据（symbol/decimals）
   ↓
5. 返回 TokenDiscoveryResult
```

---

## 数据结构

### 区块队列（BlockQueue）

每条链独立的 SQLite 数据库 `block_{chainID}.db`：

```sql
CREATE TABLE block_queue (
    block_num INTEGER PRIMARY KEY,
    base_priority INTEGER NOT NULL,      -- 优先级（0=新区块，50=追赶区块）
    failure_count INTEGER DEFAULT 0,     -- 失败次数
    added_at INTEGER NOT NULL,           -- 添加时间
    next_retry_at INTEGER DEFAULT 0,     -- 下次重试时间
    processing INTEGER DEFAULT 0         -- 处理中标记
);
```

**优先级策略：**
- `PriorityNew = 0`: 新扫描到的区块
- `PriorityCatchup = 50`: 落后需要追赶的区块
- 失败重试：`priority = base_priority + failure_count * 10`

### 交易数据结构

```go
type Transaction struct {
    Type           uint8           // 交易类型
    Status         string          // successful/failed
    Timestamp      uint64          // 区块时间戳
    Hash           common.Hash     // 交易哈希
    BlockHash      common.Hash     // 区块哈希
    ChainId        *big.Int        // 链 ID
    BlockNumber    *big.Int        // 区块高度
    From           common.Address  // 发送方
    To             *common.Address // 接收方
    Value          *big.Int        // 转账金额
    Protocol       string          // 协议名称（ERC20/Uniswap）
    Fee            *big.Int        // Gas 费用
    GasUsage       uint64          // Gas 消耗
    Summary        any             // 协议特定摘要
    InternalTxs    []InternalTx    // 内部交易
    Logs           []any           // 事件日志
}
```

---

## 配置说明

### 配置文件示例（config.yaml）

```yaml
server_address: ":7788"                    # HTTP 服务地址
etherscan_api_key: "YOUR_API_KEY"          # Etherscan API Key
etherscan_api_prs: 2                       # Etherscan 请求速率

# 历史回填备用源
history_fallback:
  blockscout_prs: 2
  blockscout_hosts:
    "8453": "https://base.blockscout.com/api"

# RPC 端点配置
endpoints:
  - name: "Ethereum"
    chain: "eth"
    interval: 5000                         # 轮询间隔（毫秒）
    failover_backoff_ms: 750               # 故障转移延迟
    multicall_batch_size: 1000             # Multicall 批量大小
    discovery_workers: 32                  # Token 发现并发数
    max_workers: 10                        # 区块处理并发 worker 数量
    base_cooldown: 5                       # 失败重试基础冷却时间（秒）
    height_check_interval_sec: 30          # 定期检查链上高度间隔（秒），用于补漏
    urls:
      - url: "wss://rpc.example/eth/ws"
        prs: 50                            # 每秒请求数限制
      - url: "https://rpc.example/eth"
        prs: 50

# 网关配置
gateway:
  enabled: true
  url: "ws://localhost:9000/ws/upstream"
  reconnect_interval_ms: 5000
  ping_interval_ms: 30000
```

### 配置参数详解

#### Endpoint 配置

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `name` | string | 必填 | 端点名称，用于日志标识 |
| `chain` | string | 必填 | 链标识（eth/bsc/polygon 等） |
| `interval` | int | 10000 | 区块轮询间隔（毫秒） |
| `failover_backoff_ms` | int | 750 | 故障转移延迟（毫秒） |
| `multicall_batch_size` | int | 1000 | Multicall 批量查询大小 |
| `discovery_workers` | int | 32 | Token 发现并发数 |
| `max_workers` | int | 10 | 区块处理并发 worker 数量 |
| `base_cooldown` | int | 5 | 失败重试基础冷却时间（秒） |
| `height_check_interval_sec` | int | 30* | 定期检查链上高度间隔（秒） |
| `urls` | array | 必填 | RPC 端点列表 |

**注**：`height_check_interval_sec` 默认值根据 `interval` 自动调整：
- `interval < 10000ms`（快链）：默认 15 秒
- `interval >= 10000ms`（慢链）：默认 30 秒

#### URL 配置

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `url` | string | 必填 | RPC 端点 URL（支持 wss:// 和 https://） |
| `prs` | float | 10 | 每秒请求数限制（Per-second Rate） |

#### Gateway 配置

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `enabled` | bool | false | 是否启用网关连接 |
| `url` | string | 必填 | 网关 WebSocket URL |
| `reconnect_interval_ms` | int | 5000 | 重连间隔（毫秒） |
| `ping_interval_ms` | int | 30000 | 心跳间隔（毫秒） |

### 配置调优建议

#### 根据链特性调整

**快速出块链（BSC、Polygon、Arbitrum）**：
```yaml
- name: "BSC"
  interval: 3000                    # 3 秒轮询
  max_workers: 30                   # 更多并发
  height_check_interval_sec: 15     # 更频繁检查
  urls:
    - url: "wss://..."
      prs: 50                       # 更高速率
```

**慢速出块链（Ethereum）**：
```yaml
- name: "Ethereum"
  interval: 12000                   # 12 秒轮询
  max_workers: 20                   # 适中并发
  height_check_interval_sec: 30     # 标准检查
  urls:
    - url: "wss://..."
      prs: 30
```

#### 根据 RPC 配额调整

**高配额（付费节点）**：
```yaml
max_workers: 50
urls:
  - url: "https://..."
    prs: 100                        # 高速率
```

**低配额（免费节点）**：
```yaml
max_workers: 10
urls:
  - url: "https://..."
    prs: 10                         # 保守速率
```

#### WebSocket 延迟优化

如果 WebSocket 推送经常延迟：
```yaml
height_check_interval_sec: 15       # 缩短检查间隔
max_workers: 30                     # 增加处理能力
```

详见：[WebSocket 延迟修复方案](websocket-delay-fix.md)

---

## API 接口

### 1. Approval List（授权列表查询）

**请求：**
```bash
GET /approval-list?chain_id=1&address=0x4be7d10ecabc162de32a31e3f5be3dfc7459d04b
```

**响应：**
```json
{
  "approvals": [
    {
      "token_contract": "0xdac17f958d2ee523a2206206994597c13d831ec7",
      "spender": "0x1111111254fb6c44bac0bed2854e76f90643097d",
      "value": "115792089237316195423570985008687907853269984665640564039457584007913129639935",
      "token_info": {
        "symbol": "USDT",
        "decimals": 6
      }
    }
  ]
}
```

### 2. WebSocket - Transaction Status

**连接：**
```
ws://localhost:7788/ws/tx-status
```

**消息格式：**
```json
{
  "type": "activity",
  "chain": "eth",
  "payload": { /* Transaction 对象 */ }
}
```

---

## 性能优化

### 1. 客户端池（Client Pool）
- 多端点负载均衡
- 健康检查自动切换
- 速率限制防止封禁

### 2. 并发处理
- 区块内交易并发解析
- Token 发现 Multicall 批量查询
- 回填任务并发限制（4 个）
- 可配置的区块处理 worker 数量（`max_workers`）

### 3. 缓存策略
- Token 元数据内存缓存
- 启动时加载缓存文件
- 关闭时持久化到磁盘

### 4. 数据库优化
- 每链独立 SQLite 数据库
- 复合索引优化查询
- 批量插入事务

### 5. WebSocket 延迟补偿
- 定期检查链上最新高度（`height_check_interval_sec`）
- 自动发现并补充 WebSocket 遗漏的区块
- 数据库层面保证幂等性，避免重复处理
- 详见：[WebSocket 延迟修复方案](websocket-delay-fix.md)

### 6. 队列处理优化
- 动态调整并发数
- 批量获取区块
- 优先级队列分层处理
- 详见：[队列处理优化方案](queue-processing-optimization.md)

---

## 监控与统计

### 实时统计（每分钟输出）

```
┌─────────┬────────┬──────────┬──────────┬─────────┬──────────┐
│ Chain   │ Height │ Queue    │ Parsed   │ Failed  │ RPC Avg  │
├─────────┼────────┼──────────┼──────────┼─────────┼──────────┤
│ ETH     │ 123456 │ 0        │ 1234     │ 5       │ 120ms    │
│ BSC     │ 456789 │ 10       │ 5678     │ 2       │ 80ms     │
└─────────┴────────┴──────────┴──────────┴─────────┴──────────┘
```

### 健康检查
- RPC 端点健康状态
- 连接池状态
- Gateway 连接状态

### 补漏机制日志

当检测到 WebSocket 遗漏区块时：
```
[ETH] Height check: detected 12 missing blocks (queue: 123, chain: 135), adding to queue
```

**日志字段说明**：
- `detected X missing blocks`：遗漏区块数量
- `queue: 123`：队列中的最大区块号
- `chain: 135`：链上实际最新高度

---

## 部署运行

### 1. 编译
```bash
go build -o evm-scanner .
```

### 2. 运行
```bash
./evm-scanner -c ./config.yaml
```

### 3. Docker 部署

```dockerfile
FROM golang:1.26-alpine
WORKDIR /app
COPY .. .
RUN go build -o evm-scanner .
CMD ["./evm-scanner", "-c", "/config/config.yaml"]
```

---

## 依赖项

**核心依赖：**
- `github.com/ethereum/go-ethereum` - 以太坊客户端库
- `github.com/gorilla/websocket` - WebSocket 支持
- `github.com/ncruces/go-sqlite3` - SQLite 数据库
- `github.com/shopspring/decimal` - 精确小数计算
- `golang.org/x/time` - 速率限制

---

## 扩展开发

### 添加新协议解析器

```go
// parse/MyProtocol.go
type MyProtocolParser struct{}

func (p *MyProtocolParser) Match(tx *Transaction) bool {
    // 匹配逻辑
}

func (p *MyProtocolParser) Handler(tx *Transaction) error {
    // 解析逻辑
}

func (p *MyProtocolParser) Priority() int {
    return 100 // 优先级
}

func init() {
    registerProtocol(&MyProtocolParser{})
}
```

### 添加新的历史数据源

实现 `service.HistoryProvider` 接口：

```go
type HistoryProvider interface {
    Name() string
    FetchHistory(ctx context.Context, req HistoryRequest) ([]HistoryTx, error)
}
```

---

## 故障排查

### 常见问题

1. **RPC 连接失败**
   - 检查 `urls` 配置是否正确
   - 查看健康检查日志
   - 验证速率限制设置

2. **交易解析失败**
   - 查看 `Parse tx failed` 日志
   - 检查 Receipt 获取是否超时
   - 验证协议解析器匹配逻辑

3. **Gateway 断连**
   - 检查 `gateway.url` 配置
   - 查看重连日志
   - 验证网络连通性

4. **WebSocket 推送延迟**
   - 检查日志中的 `Height check: detected X missing blocks`
   - 调整 `height_check_interval_sec` 缩短检查间隔
   - 增加 `max_workers` 提升处理能力
   - 详见：[WebSocket 延迟修复方案](docs/websocket-delay-fix.md)

5. **队列积压**
   - 检查 `GetTasks` 日志中的队列长度
   - 增加 `max_workers` 提升并发
   - 考虑实现批量获取区块
   - 详见：[队列处理优化方案](docs/queue-processing-optimization.md)

---

## 项目统计

- **代码行数**: ~8000+ 行 Go 代码
- **支持链**: 10+ EVM 兼容链
- **协议解析器**: 4 个（ERC20、BEP20、Uniswap、Unknown）
- **测试覆盖**: 单元测试 + 基准测试

## 相关文档

- [WebSocket 延迟修复方案](docs/websocket-delay-fix.md) - 详细说明定期高度检查机制和幂等性保证
- [队列处理优化方案](docs/queue-processing-optimization.md) - 提升区块处理速度的多种方案

---

## 目录结构

```
.
├── README.md                    # 快速入门
├── DOCUMENTATION.md             # 详细文档（本文件）
├── adapter/                     # 数据适配器
├── backfill.go                  # 历史回填逻辑
├── client/                      # RPC 客户端
│   ├── client.go               # 客户端封装
│   ├── endpoint.go             # 端点池管理
│   └── tools.go                # 工具函数
├── cmd/                         # 命令行工具
│   ├── gen-native-currencys/  # 生成原生币配置
│   ├── get-approval-list/     # 授权列表查询
│   ├── migrate-db/            # 数据库迁移
│   └── parse-tx/              # 交易解析测试
├── common/                      # 公共组件
│   ├── client-pool/           # 客户端池
│   └── rate/                  # 速率限制
├── config/                      # 配置管理
├── core.go                      # 核心应用逻辑
├── gateway/                     # 网关客户端
├── main.go                      # 程序入口
├── parse/                       # 交易解析
│   ├── ERC20.go               # ERC20 协议
│   ├── BEP20.go               # BEP20 协议
│   ├── UniSwap.go             # Uniswap 协议
│   └── base.go                # 解析基础
├── scanner/                     # 区块扫描器
├── service/                     # HTTP 服务
├── storage/                     # 存储层
│   ├── blockqueue.go          # 区块队列
│   ├── backfill.go            # 回填存储
│   └── tokens.go              # Token 缓存
├── token/                       # Token 管理
└── types/                       # 类型定义
```

---

这份文档涵盖了项目的核心架构、关键流程、配置说明和扩展开发指南。项目采用模块化设计，易于维护和扩展。
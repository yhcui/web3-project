# Scanner 代码结构说明

代码已按照功能模块进行了分层，并组织到 `pkg` 目录中，方便讲解和维护。

## 文件结构

```
sync/
├── main.go              # 程序入口
├── config.yaml          # 配置文件
└── pkg/
    └── scanner/         # Scanner 包
        ├── config.go    # 配置结构定义
        ├── types.go     # 类型定义和事件签名
        ├── scanner_core.go  # 核心扫描逻辑
        ├── events.go    # 事件处理函数
        ├── positions.go # Position 管理逻辑
        └── utils.go     # 辅助工具函数
```

## 各文件职责

### 1. `pkg/scanner/config.go` - 配置结构定义
**职责**：
- 定义 `Config` 结构体（扫描器配置）
- 包含 Infura、Contracts、Tokens 等配置

### 2. `pkg/scanner/types.go` - 类型定义和事件签名
**职责**：
- 定义 `PositionInfo` 结构体（PositionManager 合约中的 PositionInfo）
- 定义 `Scanner` 结构体（扫描器核心结构）
- 定义所有事件签名（PoolCreated, Swap, Mint, Burn, Transfer）

**关键内容**：
- `PositionInfo`: Position 的完整信息
- `Scanner`: 包含客户端、数据库、配置、池子缓存等
- 事件签名：用于过滤和识别链上事件

### 3. `pkg/scanner/scanner_core.go` - 核心扫描逻辑
**职责**：
- `NewScanner()`: 初始化扫描器，加载配置和 ABI
- `Run()`: 主循环，持续扫描新区块
- `scanRange()`: 扫描指定区块范围，分发事件处理

**关键逻辑**：
- 从数据库恢复扫描位置（断点续传）
- 使用 Topics 过滤事件（高效）
- 事件分发到对应的处理函数

### 4. `pkg/scanner/events.go` - 事件处理函数
**职责**：
- `handlePoolCreated()`: 处理池子创建事件
- `handleSwap()`: 处理代币交换事件
- `handleMint()`: 处理添加流动性事件
- `handleBurn()`: 处理移除流动性事件
- `handlePositionTransfer()`: 处理 NFT Transfer 事件

**关键逻辑**：
- 解析事件数据（Topics 和 Data）
- 更新数据库（pools, swaps, liquidity_events）
- 触发 Position 和 Ticks 更新

### 5. `pkg/scanner/positions.go` - Position 管理逻辑
**职责**：
- `findPositionIDFromTransaction()`: 从交易中查找 Position ID
- `createPositionFromPoolMint()`: 创建虚拟 Position（无 NFT）
- `queryPositionFromContract()`: 通过 RPC 查询 PositionManager
- `updatePositionFromMint()`: 更新或创建 Position 记录
- `updatePositionFromBurn()`: 更新 Position（移除流动性）

**关键逻辑**：
- 支持两种 Position：NFT Position 和虚拟 Position
- 通过 RPC 查询获取准确的 tick 范围
- 回退机制：查询失败时使用池子信息

### 6. `pkg/scanner/utils.go` - 辅助工具函数
**职责**：
- `ensureToken()`: 确保代币记录存在
- `ensurePoolExists()`: 确保池子记录存在
- `updateTicksFromMint()`: 更新 Ticks 表（添加流动性）
- `updateTicksFromBurn()`: 更新 Ticks 表（移除流动性）
- `getPoolLiquidity()`: 查询池子流动性（未实现）

**关键逻辑**：
- 数据库操作的辅助函数
- Ticks 流动性计算（liquidity_gross 和 liquidity_net）

## 数据流

```
1. main.go
   └─> scanner.NewScanner() [pkg/scanner/scanner_core.go]
       └─> 初始化 Scanner，加载配置和 ABI

2. Scanner.Run() [pkg/scanner/scanner_core.go]
   └─> scanRange() [pkg/scanner/scanner_core.go]
       └─> 根据事件签名分发
           ├─> handlePoolCreated() [pkg/scanner/events.go]
           ├─> handleSwap() [pkg/scanner/events.go]
           ├─> handleMint() [pkg/scanner/events.go]
           │   └─> updatePositionFromMint() [pkg/scanner/positions.go]
           │       └─> queryPositionFromContract() [pkg/scanner/positions.go]
           ├─> handleBurn() [pkg/scanner/events.go]
           └─> handlePositionTransfer() [pkg/scanner/events.go]
               └─> updatePositionFromMint() [pkg/scanner/positions.go]
```

## 讲解建议

### 入门讲解顺序
1. **pkg/scanner/types.go**: 先理解数据结构和事件签名
2. **pkg/scanner/scanner_core.go**: 理解扫描器的核心逻辑
3. **pkg/scanner/events.go**: 理解事件处理流程
4. **pkg/scanner/positions.go**: 理解 Position 管理
5. **pkg/scanner/utils.go**: 理解辅助函数

### 深入讲解重点
- **事件解析**: `pkg/scanner/events.go` 中的事件数据解析逻辑
- **Position 管理**: `pkg/scanner/positions.go` 中的双重路径（NFT vs 虚拟）
- **RPC 查询**: `pkg/scanner/positions.go` 中的合约查询机制
- **Ticks 计算**: `pkg/scanner/utils.go` 中的流动性计算

## 优势

1. **模块化**: 每个文件职责清晰，易于理解
2. **可维护**: 修改某个功能只需关注对应文件
3. **可测试**: 每个模块可以独立测试
4. **易讲解**: 可以按模块逐步讲解，降低复杂度
5. **包结构**: 使用 `pkg` 目录组织可复用代码，符合 Go 项目规范
6. **解耦**: Scanner 包独立于 main 包，可以轻松在其他项目中使用

## 包导入

在 `main.go` 中使用 Scanner 包：

```go
import "meta-node-dex-sync/pkg/scanner"

// 创建配置
scannerConfig := scanner.Config{...}

// 创建 Scanner 实例
s, err := scanner.NewScanner(scannerConfig, db)

// 运行扫描器
s.Run()
```


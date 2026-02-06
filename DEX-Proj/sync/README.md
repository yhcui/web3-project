# DEX 区块链事件扫描器实现详解

## 目录
1. [整体架构](#整体架构)
2. [合约事件分析](#合约事件分析)
3. [Scanner 核心实现](#scanner-核心实现)
4. [事件处理流程](#事件处理流程)
5. [数据库同步策略](#数据库同步策略)
6. [关键代码解析](#关键代码解析)

---

## 整体架构

### 系统组件

```
┌─────────────────┐
│  Ethereum Node  │ (Hardhat/Infura)
│   (RPC 节点)     │
└────────┬─────────┘
         │
         │ FilterLogs (事件查询)
         ▼
┌─────────────────┐
│   Scanner       │ (Go 服务)
│  - 事件监听      │
│  - 数据解析      │
│  - 数据库同步    │
└────────┬─────────┘
         │
         │ SQL INSERT/UPDATE
         ▼
┌─────────────────┐
│  PostgreSQL     │
│  - tokens       │
│  - pools        │
│  - positions    │
│  - swaps        │
│  - ticks        │
│  - events       │
└─────────────────┘
```

### 核心合约交互

```
PoolManager (Factory)
    │
    ├─ emit PoolCreated → Scanner 捕获
    │
Pool (每个交易对)
    │
    ├─ emit Mint → Scanner 更新 positions + ticks
    ├─ emit Burn → Scanner 更新 positions + ticks
    └─ emit Swap → Scanner 更新 pools 状态

PositionManager (NFT)
    │
    └─ emit Transfer → Scanner 关联 position ID
```

---

## 合约事件分析

### 1. PoolCreated 事件

**合约位置**: `PoolManager.sol`

```solidity
// Factory.sol 中定义
event PoolCreated(
    address token0,
    address token1,
    uint32 index,
    int24 tickLower,
    int24 tickUpper,
    uint24 fee,
    address pool
);
```

**事件特点**:
- 所有参数都是 **非索引** (non-indexed)
- 数据全部在 `data` 字段中
- 用于创建新池子时触发

**数据布局** (每个参数 32 字节):
```
[0:32]    token0 (address)
[32:64]   token1 (address)
[64:96]   index (uint32)
[96:128]  tickLower (int24)
[128:160] tickUpper (int24)
[160:192] fee (uint24)
[192:224] pool (address)
```

### 2. Mint 事件

**合约位置**: `Pool.sol`

```solidity
event Mint(
    address sender,        // 非索引
    address indexed owner, // 索引
    uint128 amount,        // 非索引
    uint256 amount0,       // 非索引
    uint256 amount1        // 非索引
);
```

**事件特点**:
- `owner` 是索引参数，在 `topics[1]` 中
- 其他参数在 `data` 字段中
- 表示添加流动性

**数据布局**:
```
Topics:
  [0] = 事件签名哈希
  [1] = owner (indexed)

Data:
  [0:32]    sender (address)
  [32:64]   amount (uint128)
  [64:96]   amount0 (uint256)
  [96:128]  amount1 (uint256)
```

### 3. Burn 事件

**合约位置**: `Pool.sol`

```solidity
event Burn(
    address indexed owner, // 索引
    uint128 amount,        // 非索引
    uint256 amount0,       // 非索引
    uint256 amount1        // 非索引
);
```

**数据布局**:
```
Topics:
  [0] = 事件签名哈希
  [1] = owner (indexed)

Data:
  [0:32]    amount (uint128)
  [32:64]   amount0 (uint256)
  [64:96]   amount1 (uint256)
```

### 4. Swap 事件

**合约位置**: `Pool.sol`

```solidity
event Swap(
    address indexed sender,      // 索引
    address indexed recipient,   // 索引
    int256 amount0,              // 非索引
    int256 amount1,              // 非索引
    uint160 sqrtPriceX96,        // 非索引
    uint128 liquidity,           // 非索引
    int24 tick                    // 非索引
);
```

**数据布局**:
```
Topics:
  [0] = 事件签名哈希
  [1] = sender (indexed)
  [2] = recipient (indexed)

Data:
  [0:32]    amount0 (int256, 有符号)
  [32:64]   amount1 (int256, 有符号)
  [64:96]   sqrtPriceX96 (uint160)
  [96:128]  liquidity (uint128)
  [128:160] tick (int24)
```

### 5. Transfer 事件 (ERC721)

**合约位置**: `PositionManager.sol` (继承自 ERC721)

```solidity
event Transfer(
    address indexed from,    // 索引
    address indexed to,      // 索引
    uint256 indexed tokenId  // 索引
);
```

**数据布局**:
```
Topics:
  [0] = 事件签名哈希
  [1] = from (indexed)
  [2] = to (indexed)
  [3] = tokenId (indexed)

Data: 无 (所有参数都是索引的)
```

**特殊值**:
- `from = 0x0`: 表示 NFT mint (创建新 position)
- `to = 0x0`: 表示 NFT burn (销毁 position)

---

## Scanner 核心实现

### 1. 事件签名计算

```go
// 使用 Keccak256 哈希计算事件签名
SigPoolCreated = crypto.Keccak256Hash([]byte(
    "PoolCreated(address,address,uint32,int24,int24,uint24,address)"
))
// 结果: 0xe026b1b60fa8f2d35cd0844432a7b513a5a112d8cfe2b30bc62c1c4b81373c75

SigMint = crypto.Keccak256Hash([]byte(
    "Mint(address,address,uint128,uint256,uint256)"
))
// 结果: 0x011d4be6213866bff035f68967364cf69c5c01ff5bc23ff0a275f08a04381e6a
```

**关键点**:
- 事件签名格式必须与合约中定义的完全一致
- 包括参数类型和顺序
- 索引参数不影响签名计算

### 2. 事件过滤策略

```go
query := ethereum.FilterQuery{
    FromBlock: big.NewInt(int64(start)),
    ToBlock:   big.NewInt(int64(end)),
    Topics: [][]common.Hash{
        {SigPoolCreated, SigSwap, SigMint, SigBurn, SigTransfer},
    },
}
```

**优化说明**:
- 使用 `Topics[0]` 过滤事件签名，比按地址过滤更高效
- 一次查询获取所有相关事件，减少 RPC 调用
- 在代码中进一步过滤地址和事件类型

### 3. 扫描循环

```go
func (s *Scanner) Run() {
    ticker := time.NewTicker(12 * time.Second)
    defer ticker.Stop()

    for {
        // 1. 获取最新区块
        header, err := s.Client.HeaderByNumber(context.Background(), nil)
        
        // 2. 计算扫描范围 (每次 1000 个区块)
        end := s.Current + 1000
        if end > latestBlock {
            end = latestBlock
        }
        
        // 3. 扫描并处理事件
        s.scanRange(s.Current, end)
        
        // 4. 更新当前区块
        s.Current = end + 1
        
        // 5. 等待新区块
        <-ticker.C
    }
}
```

---

## 事件处理流程

### 1. PoolCreated 事件处理

```go
func (s *Scanner) handlePoolCreated(vLog types.Log) {
    // 1. 解析事件数据
    token0 := common.BytesToAddress(vLog.Data[0:32])
    token1 := common.BytesToAddress(vLog.Data[32:64])
    tickLower := int32(new(big.Int).SetBytes(vLog.Data[96:128]).Int64())
    tickUpper := int32(new(big.Int).SetBytes(vLog.Data[128:160]).Int64())
    fee := new(big.Int).SetBytes(vLog.Data[160:192]).Int64()
    poolAddr := common.BytesToAddress(vLog.Data[192:224])

    // 2. 确保代币存在
    s.ensureToken(token0)
    s.ensureToken(token1)

    // 3. 插入池子记录
    s.DB.Exec(`
        INSERT INTO pools (address, token0, token1, fee, tick_lower, tick_upper)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (address) DO NOTHING
    `, poolAddr.Hex(), token0.Hex(), token1.Hex(), fee, tickLower, tickUpper)

    // 4. 添加到缓存
    s.Pools[poolAddr] = true
}
```

**处理步骤**:
1. ✅ 解析 7 个参数（每个 32 字节）
2. ✅ 确保代币记录存在（外键约束）
3. ✅ 插入池子记录
4. ✅ 更新内存缓存

### 2. Mint 事件处理

```go
func (s *Scanner) handleMint(vLog types.Log) {
    // 1. 解析事件
    owner := common.BytesToAddress(vLog.Topics[1].Bytes()) // indexed
    amount := new(big.Int).SetBytes(vLog.Data[32:64])      // liquidity
    amount0 := new(big.Int).SetBytes(vLog.Data[64:96])
    amount1 := new(big.Int).SetBytes(vLog.Data[96:128])

    // 2. 记录流动性事件
    s.DB.Exec(`INSERT INTO liquidity_events ...`)

    // 3. 更新池子流动性
    s.DB.Exec(`UPDATE pools SET liquidity = liquidity + $1 ...`)

    // 4. 更新 ticks 表
    s.updateTicksFromMint(vLog.Address, amount)

    // 5. 查找 position ID (从 Transfer 事件)
    positionID := s.findPositionIDFromTransaction(vLog.TxHash, ...)
    if positionID != nil {
        // 有 NFT position ID
        s.updatePositionFromMint(*positionID, owner, ...)
    } else {
        // 没有 NFT，创建虚拟 position
        s.createPositionFromPoolMint(owner, ...)
    }
}
```

**关键逻辑**:
- **双重路径**: 支持 NFT position 和普通 position
- **流动性累加**: 使用 SQL 累加，避免查询合约状态
- **Ticks 更新**: 同时更新 tick_lower 和 tick_upper

### 3. Swap 事件处理

```go
func (s *Scanner) handleSwap(vLog types.Log) {
    // 1. 解析索引参数
    sender := common.BytesToAddress(vLog.Topics[1].Bytes())
    recipient := common.BytesToAddress(vLog.Topics[2].Bytes())

    // 2. 解析数据参数（注意有符号数处理）
    parseSigned := func(b []byte) *big.Int {
        x := new(big.Int).SetBytes(b)
        if x.Cmp(big.NewInt(0).Lsh(big.NewInt(1), 255)) >= 0 {
            // 负数处理（补码）
            x.Sub(x, big.NewInt(0).Lsh(big.NewInt(1), 256))
        }
        return x
    }

    amt0 := parseSigned(vLog.Data[0:32])
    amt1 := parseSigned(vLog.Data[32:64])
    sqrtPrice := new(big.Int).SetBytes(vLog.Data[64:96])
    liquidity := new(big.Int).SetBytes(vLog.Data[96:128])
    tick := parseSigned(vLog.Data[128:160])

    // 3. 更新池子状态
    s.DB.Exec(`
        UPDATE pools 
        SET sqrt_price_x96 = $1, liquidity = $2, tick = $3
        WHERE address = $4
    `, sqrtPrice.String(), liquidity.String(), tick.Int64(), ...)

    // 4. 记录交易
    s.DB.Exec(`INSERT INTO swaps ...`)
}
```

**关键点**:
- **有符号数处理**: `amount0` 和 `amount1` 是 `int256`，需要处理补码
- **状态同步**: 每次 Swap 都更新池子的价格和流动性

### 4. Position Transfer 事件处理

```go
func (s *Scanner) handlePositionTransfer(vLog types.Log) {
    from := common.BytesToAddress(vLog.Topics[1].Bytes())
    to := common.BytesToAddress(vLog.Topics[2].Bytes())
    tokenID := new(big.Int).SetBytes(vLog.Topics[3].Bytes())

    if from == (common.Address{}) {
        // Mint: 创建新 position
        // 从同一交易中查找 Pool Mint 事件
        receipt, _ := s.Client.TransactionReceipt(...)
        for _, log := range receipt.Logs {
            if log.Topics[0] == SigMint {
                // 找到对应的 Pool Mint 事件
                // 创建 position 记录
            }
        }
    } else if to == (common.Address{}) {
        // Burn: 销毁 position
        s.DB.Exec(`UPDATE positions SET liquidity = 0 ...`)
    } else {
        // Transfer: 所有权转移
        s.DB.Exec(`UPDATE positions SET owner = $1 ...`)
    }
}
```

---

## 数据库同步策略

### 1. Tokens 表

**同步时机**:
- PoolCreated 事件时自动创建
- 使用 `ON CONFLICT DO NOTHING` 避免重复

**字段填充**:
```go
s.ensureToken(addr) // 插入默认值，后续可通过 RPC 查询完善
```

### 2. Pools 表

**同步时机**:
- PoolCreated 事件 → 创建记录
- Swap 事件 → 更新价格和流动性
- Mint/Burn 事件 → 更新流动性

**关键字段**:
- `liquidity`: 从 Swap 事件获取（最准确），或从 Mint/Burn 累加
- `sqrt_price_x96`: 从 Swap 事件获取
- `tick`: 从 Swap 事件获取

### 3. Positions 表

**两种创建方式**:

**方式1: 有 NFT Position ID**
```go
// 从 Transfer 事件获取 tokenId
positionID := findPositionIDFromTransaction(...)
updatePositionFromMint(positionID, ...)
```

**方式2: 无 NFT (TestLP 直接添加)**
```go
// 使用 owner + pool + tick 的哈希作为 ID
hashInput := fmt.Sprintf("%s:%s:%d:%d", owner, pool, tickLower, tickUpper)
positionID := Keccak256Hash(hashInput)
createPositionFromPoolMint(...)
```

**流动性更新**:
- Mint: `liquidity = liquidity + amount`
- Burn: `liquidity = liquidity - amount`
- 使用 `ON CONFLICT DO UPDATE` 实现 upsert

### 4. Ticks 表

**更新逻辑**:
```go
// Mint 时
tick_lower: liquidity_gross += amount, liquidity_net += amount
tick_upper: liquidity_gross += amount, liquidity_net -= amount

// Burn 时
tick_lower: liquidity_gross -= amount, liquidity_net -= amount
tick_upper: liquidity_gross -= amount, liquidity_net += amount
```

**说明**:
- `liquidity_gross`: 该 tick 点的总流动性（所有经过的持仓）
- `liquidity_net`: 价格向上移动时的净流动性变化
  - tick_lower: 价格向上时流动性增加 → 正数
  - tick_upper: 价格向上时流动性减少 → 负数

### 5. Swaps 表

**记录内容**:
- 交易双方地址
- 交换数量（有符号）
- 交易后的价格和流动性
- 区块信息

**用途**:
- 交易历史查询
- 价格走势分析
- 流动性变化追踪

---

## 关键代码解析

### 1. 事件签名匹配

```go
switch vLog.Topics[0] {
case SigPoolCreated:
    s.handlePoolCreated(vLog)
case SigSwap:
    if s.Pools[vLog.Address] {
        s.handleSwap(vLog)
    }
case SigMint:
    if s.Pools[vLog.Address] {
        s.handleMint(vLog)
    }
// ...
}
```

**为什么使用 Topics[0]**:
- `Topics[0]` 总是事件签名的哈希值
- 这是最高效的过滤方式
- 比按地址过滤更快（Bloom Filter 优化）

### 2. 有符号数解析

```go
parseSigned := func(b []byte) *big.Int {
    x := new(big.Int).SetBytes(b)
    // 检查是否 >= 2^255 (表示负数)
    if x.Cmp(big.NewInt(0).Lsh(big.NewInt(1), 255)) >= 0 {
        // 转换为负数（补码）
        x.Sub(x, big.NewInt(0).Lsh(big.NewInt(1), 256))
    }
    return x
}
```

**原理**:
- Solidity 的 `int256` 使用补码表示
- `SetBytes` 将字节解释为无符号数
- 如果值 >= 2^255，说明是负数，需要减去 2^256

### 3. Position ID 生成策略

```go
// 有 NFT 的情况
positionID := findPositionIDFromTransaction(txHash)
// 从 Transfer 事件的 Topics[3] 获取

// 无 NFT 的情况
hashInput := fmt.Sprintf("%s:%s:%d:%d", 
    owner.Hex(), poolAddr.Hex(), tickLower, tickUpper)
hash := crypto.Keccak256Hash([]byte(hashInput))
positionID := hash.Bytes() // 转换为数字
```

**设计考虑**:
- NFT position: 使用合约分配的 tokenId
- 普通 position: 使用确定性哈希，确保同一 owner+pool+tick 范围生成相同 ID

### 4. 区块同步恢复

```go
// 从数据库恢复扫描位置
var maxBlock sql.NullInt64
err = db.QueryRow("SELECT MAX(block_number) FROM swaps").Scan(&maxBlock)
if err == nil && maxBlock.Valid {
    if uint64(maxBlock.Int64) > scanner.Current {
        scanner.Current = uint64(maxBlock.Int64) + 1
    }
}
```

**优势**:
- 服务重启后自动从上次位置继续
- 避免重复处理已扫描的区块
- 支持多表查询取最大值

### 5. 池子缓存机制

```go
// 启动时加载
rows, _ := db.Query("SELECT address FROM pools")
for rows.Next() {
    scanner.Pools[common.HexToAddress(addr)] = true
}

// 处理事件时使用
if s.Pools[vLog.Address] {
    // 已知池子，处理事件
} else {
    // 未知池子，尝试添加到缓存
    s.ensurePoolExists(vLog.Address)
}
```

**作用**:
- 减少数据库查询
- 快速判断是否处理事件
- 支持动态添加新池子

---

## 数据流示例

### 场景: 用户添加流动性

```
1. 用户调用 PositionManager.mint()
   │
   ├─ PositionManager 调用 Pool.mint()
   │  └─ emit Mint(owner, amount, ...)
   │
   └─ PositionManager 调用 _mint()
      └─ emit Transfer(0x0, owner, tokenId)

2. Scanner 扫描到事件
   │
   ├─ 处理 Mint 事件
   │  ├─ 更新 pools.liquidity
   │  ├─ 更新 ticks (tick_lower, tick_upper)
   │  └─ 查找 Transfer 事件获取 position ID
   │
   └─ 处理 Transfer 事件
      └─ 创建/更新 positions 记录

3. 数据库状态
   ├─ pools: liquidity += amount
   ├─ ticks: 更新两个边界 tick
   └─ positions: 创建新记录或更新现有记录
```

### 场景: 用户执行 Swap

```
1. 用户调用 SwapRouter.exactInput()
   │
   └─ SwapRouter 调用 Pool.swap()
      └─ emit Swap(sender, recipient, amount0, amount1, price, liquidity, tick)

2. Scanner 处理 Swap 事件
   │
   ├─ 更新 pools 表
   │  ├─ sqrt_price_x96 = 新价格
   │  ├─ liquidity = 新流动性
   │  └─ tick = 新 tick
   │
   └─ 插入 swaps 表
      └─ 记录交易详情

3. 数据库状态
   ├─ pools: 价格和流动性已更新
   └─ swaps: 新增一条交易记录
```

---

## 最佳实践

### 1. 错误处理

```go
// ✅ 好的做法
if err != nil {
    log.Printf("Error: %v", err)
    return // 或继续处理下一个事件
}

// ❌ 避免
if err != nil {
    panic(err) // 会导致整个服务停止
}
```

### 2. 数据库事务

```go
// 对于相关操作，考虑使用事务
tx, _ := db.Begin()
tx.Exec("UPDATE pools ...")
tx.Exec("INSERT INTO positions ...")
tx.Exec("UPDATE ticks ...")
tx.Commit()
```

### 3. 性能优化

- **批量处理**: 一次查询处理多个事件
- **缓存池子地址**: 减少数据库查询
- **异步处理**: 对于耗时操作（如 RPC 调用）考虑异步

### 4. 数据一致性

- **外键约束**: 确保 tokens 存在后再创建 pools
- **唯一约束**: 使用 `ON CONFLICT` 处理重复
- **状态同步**: 从事件中获取最新状态，而非查询合约

---

## 常见问题

### Q1: 为什么 ticks 表只有 tick_lower 和 tick_upper？

**A**: 当前 Pool 实现是简化版本，所有流动性都在池子的整体 tick 范围内。标准 Uniswap V3 中，每个 position 可能有不同的 tick 范围，需要更复杂的 tick 管理。

### Q2: 如何处理遗漏的事件？

**A**: 
- 定期全量扫描（从创世区块）
- 使用 `MAX(block_number)` 恢复位置
- 支持手动指定起始区块

### Q3: 如何验证数据准确性？

**A**:
- 对比链上状态（通过 RPC 查询）
- 检查流动性总和是否一致
- 验证价格变化是否符合 Swap 事件

---

## 代码示例详解

### 示例1: 完整的事件处理流程

```go
// 1. 扫描区块范围
func (s *Scanner) scanRange(start, end uint64) error {
    query := ethereum.FilterQuery{
        FromBlock: big.NewInt(int64(start)),
        ToBlock:   big.NewInt(int64(end)),
        Topics: [][]common.Hash{
            {SigPoolCreated, SigSwap, SigMint, SigBurn, SigTransfer},
        },
    }
    
    logs, err := s.Client.FilterLogs(context.Background(), query)
    
    // 2. 遍历日志并分发处理
    for _, vLog := range logs {
        switch vLog.Topics[0] {
        case SigMint:
            if s.Pools[vLog.Address] {
                s.handleMint(vLog)
            }
        // ... 其他事件
        }
    }
}
```

### 示例2: Position ID 生成算法

```go
// 场景1: 有 NFT position ID
func (s *Scanner) findPositionIDFromTransaction(txHash common.Hash) *big.Int {
    receipt, _ := s.Client.TransactionReceipt(context.Background(), txHash)
    positionManagerAddr := common.HexToAddress(s.Config.Contracts.PositionManager)
    
    for _, log := range receipt.Logs {
        if log.Address == positionManagerAddr && 
           log.Topics[0] == SigTransfer &&
           len(log.Topics) >= 4 {
            from := common.BytesToAddress(log.Topics[1].Bytes())
            if from == (common.Address{}) { // Mint
                tokenID := new(big.Int).SetBytes(log.Topics[3].Bytes())
                return tokenID
            }
        }
    }
    return nil
}

// 场景2: 无 NFT，生成虚拟 position ID
func (s *Scanner) createPositionFromPoolMint(...) {
    hashInput := fmt.Sprintf("%s:%s:%d:%d", 
        owner.Hex(), poolAddr.Hex(), tickLower, tickUpper)
    hash := crypto.Keccak256Hash([]byte(hashInput))
    positionID := new(big.Int).SetBytes(hash.Bytes())
    positionID.Mod(positionID, new(big.Int).Lsh(big.NewInt(1), 64))
    // 使用 positionID 作为主键
}
```

### 示例3: Ticks 流动性更新逻辑

```go
// Mint 时更新 ticks
func (s *Scanner) updateTicksFromMint(poolAddr common.Address, liquidity *big.Int) {
    // 查询池子的 tick_lower 和 tick_upper
    var tickLower, tickUpper int
    s.DB.QueryRow(`
        SELECT tick_lower, tick_upper FROM pools WHERE address = $1
    `, poolAddr.Hex()).Scan(&tickLower, &tickUpper)
    
    // tick_lower: 价格向上移动时，流动性增加
    // liquidity_net = +liquidity (正数)
    s.DB.Exec(`
        INSERT INTO ticks (
            pool_address, tick_index, liquidity_gross, liquidity_net
        ) VALUES ($1, $2, $3, $4)
        ON CONFLICT (pool_address, tick_index) DO UPDATE SET
            liquidity_gross = ticks.liquidity_gross + $3,
            liquidity_net = ticks.liquidity_net + $4
    `, poolAddr.Hex(), tickLower, liquidity.String(), liquidity.String())
    
    // tick_upper: 价格向上移动时，流动性减少
    // liquidity_net = -liquidity (负数)
    liquidityNeg := new(big.Int).Neg(liquidity)
    s.DB.Exec(`
        INSERT INTO ticks (
            pool_address, tick_index, liquidity_gross, liquidity_net
        ) VALUES ($1, $2, $3, $4)
        ON CONFLICT (pool_address, tick_index) DO UPDATE SET
            liquidity_gross = ticks.liquidity_gross + $3,
            liquidity_net = ticks.liquidity_net + $4
    `, poolAddr.Hex(), tickUpper, liquidity.String(), liquidityNeg.String())
}
```

### 示例4: 完整的事件解析过程

```go
// handleMint 完整实现
func (s *Scanner) handleMint(vLog types.Log) {
    // 1. 验证数据长度
    if len(vLog.Data) < 4*32 {
        return
    }
    
    // 2. 解析索引参数 (Topics[1] = owner)
    owner := common.BytesToAddress(vLog.Topics[1].Bytes())
    
    // 3. 解析数据参数
    // Data 布局: [sender(32), amount(32), amount0(32), amount1(32)]
    amount := new(big.Int).SetBytes(vLog.Data[32:64])      // 流动性数量
    amount0 := new(big.Int).SetBytes(vLog.Data[64:96])     // token0 数量
    amount1 := new(big.Int).SetBytes(vLog.Data[96:128])     // token1 数量
    
    // 4. 获取区块时间戳
    header, _ := s.Client.HeaderByNumber(context.Background(), 
        big.NewInt(int64(vLog.BlockNumber)))
    ts := time.Unix(int64(header.Time), 0)
    
    // 5. 记录流动性事件
    s.DB.Exec(`
        INSERT INTO liquidity_events (
            transaction_hash, log_index, pool_address, type, owner, 
            amount, amount0, amount1, block_number, block_timestamp
        ) VALUES ($1, $2, $3, 'MINT', $4, $5, $6, $7, $8, $9)
        ON CONFLICT DO NOTHING
    `, vLog.TxHash.Hex(), vLog.Index, vLog.Address.Hex(), owner.Hex(),
        amount.String(), amount0.String(), amount1.String(), 
        vLog.BlockNumber, ts)
    
    // 6. 更新池子流动性（累加）
    s.DB.Exec(`
        UPDATE pools SET liquidity = liquidity + $1
        WHERE address = $2
    `, amount.String(), vLog.Address.Hex())
    
    // 7. 更新 ticks
    s.updateTicksFromMint(vLog.Address, amount)
    
    // 8. 处理 position
    positionID := s.findPositionIDFromTransaction(vLog.TxHash, vLog.BlockNumber)
    if positionID != nil {
        s.updatePositionFromMint(*positionID, owner, vLog.Address, amount, ...)
    } else {
        s.createPositionFromPoolMint(owner, vLog.Address, amount, ...)
    }
}
```

### 示例5: 事件签名匹配和分发

```go
func (s *Scanner) scanRange(start, end uint64) error {
    // 1. 构建查询（过滤所有相关事件）
    query := ethereum.FilterQuery{
        FromBlock: big.NewInt(int64(start)),
        ToBlock:   big.NewInt(int64(end)),
        Topics: [][]common.Hash{
            {SigPoolCreated, SigSwap, SigMint, SigBurn, SigTransfer},
        },
    }
    
    // 2. 查询日志
    logs, err := s.Client.FilterLogs(context.Background(), query)
    
    // 3. 遍历并分发处理
    eventCount := 0
    transferCount := 0
    
    for _, vLog := range logs {
        // 根据事件签名分发
        switch vLog.Topics[0] {
        case SigPoolCreated:
            if vLog.Address == common.HexToAddress(s.Config.Contracts.PoolManager) {
                s.handlePoolCreated(vLog)
                eventCount++
            }
            
        case SigSwap:
            // 只处理已知池子的事件
            if s.Pools[vLog.Address] {
                s.handleSwap(vLog)
                eventCount++
            } else {
                // 尝试添加到缓存
                s.ensurePoolExists(vLog.Address)
                if s.Pools[vLog.Address] {
                    s.handleSwap(vLog)
                    eventCount++
                }
            }
            
        case SigMint:
            if s.Pools[vLog.Address] {
                s.handleMint(vLog)
                eventCount++
            } else {
                s.ensurePoolExists(vLog.Address)
                if s.Pools[vLog.Address] {
                    s.handleMint(vLog)
                    eventCount++
                }
            }
            
        case SigBurn:
            if s.Pools[vLog.Address] {
                s.handleBurn(vLog)
                eventCount++
            }
            
        case SigTransfer:
            // 检查是否是 PositionManager 的 Transfer 事件
            if vLog.Address == common.HexToAddress(s.Config.Contracts.PositionManager) {
                s.handlePositionTransfer(vLog)
                transferCount++
            }
        }
    }
    
    log.Printf("Processed %d events in range %d-%d (Transfer events: %d)", 
        eventCount, start, end, transferCount)
    return nil
}
```

**流动性变化示意图**:
```
价格移动方向: ←─────────────→
              ↓               ↓
          tick_lower      tick_upper
          (+流动性)        (-流动性)

当价格从 tick_lower 向上移动:
  - 进入区间 → 流动性增加 → tick_lower.liquidity_net = +
  - 离开区间 → 流动性减少 → tick_upper.liquidity_net = -
```

---

## 数据同步流程图

### Mint 事件完整流程

```
┌─────────────────────────────────────────────────────────┐
│ 1. 链上事件触发                                          │
│    Pool.mint() → emit Mint(owner, amount, ...)         │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ 2. Scanner 捕获事件                                      │
│    - 解析 Topics[1] = owner                            │
│    - 解析 Data = [sender, amount, amount0, amount1]    │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ 3. 更新 liquidity_events 表                              │
│    INSERT INTO liquidity_events (type='MINT', ...)     │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ 4. 更新 pools 表                                         │
│    UPDATE pools SET liquidity = liquidity + amount      │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ 5. 更新 ticks 表                                         │
│    - tick_lower: liquidity_gross +=, liquidity_net +=  │
│    - tick_upper: liquidity_gross +=, liquidity_net -=  │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ 6. 查找 Position ID                                      │
│    从同一交易中查找 Transfer 事件                       │
└────────────────┬────────────────────────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
        ▼                 ▼
  找到 ID           未找到 ID
        │                 │
        ▼                 ▼
┌──────────────┐  ┌──────────────────────┐
│ 使用 NFT ID  │  │ 生成哈希 ID          │
│ 更新 position│  │ 创建虚拟 position    │
└──────────────┘  └──────────────────────┘
```

---

## 关键设计决策

### 1. 为什么使用事件而非状态查询？

**事件驱动优势**:
- ✅ 实时性: 事件立即触发，无需轮询
- ✅ 效率: 只处理变化，不查询所有状态
- ✅ 历史: 保留完整的历史记录
- ✅ 可靠性: 事件不可篡改，数据可追溯

**状态查询劣势**:
- ❌ 需要知道所有池子地址
- ❌ 无法获取历史变化
- ❌ 需要频繁轮询，效率低

### 2. 为什么支持两种 Position 创建方式？

**NFT Position (PositionManager)**:
- 标准方式，有唯一 tokenId
- 支持转移和交易
- 更符合 DeFi 标准

**虚拟 Position (TestLP/直接调用)**:
- 兼容测试和简化场景
- 使用哈希 ID 确保唯一性
- 前端可以统一查询接口

### 3. 为什么使用累加而非查询合约？

**累加方式**:
```go
UPDATE pools SET liquidity = liquidity + $1
```

**优势**:
- 减少 RPC 调用（节省成本和时间）
- 数据库操作更快
- 支持离线处理

**注意事项**:
- 需要确保事件不遗漏
- 定期验证数据准确性

---

## 性能优化技巧

### 1. 批量查询优化

```go
// ❌ 低效: 每个事件都查询一次
for _, log := range logs {
    pool, _ := db.Query("SELECT * FROM pools WHERE address = $1", ...)
}

// ✅ 高效: 批量查询
poolAddrs := []string{...}
rows, _ := db.Query("SELECT address FROM pools WHERE address = ANY($1)", poolAddrs)
// 构建内存映射
poolMap := make(map[string]bool)
for rows.Next() { ... }
```

### 2. 缓存策略

```go
// 池子地址缓存
type Scanner struct {
    Pools map[common.Address]bool // 内存缓存
}

// 启动时加载
rows, _ := db.Query("SELECT address FROM pools")
for rows.Next() {
    s.Pools[addr] = true
}

// 使用时快速判断
if s.Pools[vLog.Address] {
    // 已知池子，直接处理
}
```

### 3. 数据库索引

```sql
-- 关键索引
CREATE INDEX idx_swaps_pool_timestamp ON swaps(pool_address, block_timestamp DESC);
CREATE INDEX idx_positions_owner ON positions(owner);
CREATE INDEX idx_positions_pool ON positions(pool_address);
```

---

## 测试和验证

### 1. 数据一致性检查

```sql
-- 检查池子流动性总和
SELECT 
    p.address,
    p.liquidity as pool_liquidity,
    SUM(pos.liquidity) as positions_sum
FROM pools p
LEFT JOIN positions pos ON pos.pool_address = p.address
GROUP BY p.address, p.liquidity;

-- 检查 ticks 流动性
SELECT 
    pool_address,
    tick_index,
    liquidity_gross,
    liquidity_net
FROM ticks
ORDER BY pool_address, tick_index;
```

### 2. 事件完整性验证

```go
// 验证是否遗漏事件
func (s *Scanner) validateEvents() {
    // 1. 检查每个池子是否有创建事件
    // 2. 检查 Mint/Burn 事件是否成对
    // 3. 检查流动性变化是否合理
}
```

---

## 总结

Scanner 实现的核心要点：

1. **事件驱动**: 通过监听链上事件同步状态
2. **双重路径**: 支持 NFT position 和普通 position
3. **状态累加**: 使用数据库累加而非频繁查询合约
4. **容错设计**: 支持服务重启和断点续传
5. **性能优化**: 批量查询、缓存机制、高效过滤

通过这个实现，我们可以：
- ✅ 实时同步链上状态到数据库
- ✅ 支持前端查询和历史分析
- ✅ 提供流动性深度和价格数据
- ✅ 追踪用户持仓和交易历史

---

## 数据库表结构详解

### 表关系图

```
tokens (代币表)
  │
  ├─ pools (池子表) ──┐
  │                    │
  │                    ├─ positions (持仓表)
  │                    ├─ swaps (交易表)
  │                    ├─ ticks (价格刻度表)
  │                    └─ liquidity_events (流动性事件表)
  │
  └─ positions.token0/token1 (外键)
```

### 核心表说明

#### 1. tokens 表
```sql
CREATE TABLE tokens (
    address TEXT PRIMARY KEY,  -- 代币合约地址
    symbol TEXT,               -- 代币符号
    name TEXT,                 -- 代币名称
    decimals INT               -- 精度
);
```

**用途**: 存储所有 ERC20 代币信息

#### 2. pools 表
```sql
CREATE TABLE pools (
    address TEXT PRIMARY KEY,
    token0 TEXT REFERENCES tokens(address),
    token1 TEXT REFERENCES tokens(address),
    fee INT NOT NULL,              -- 手续费率（基点）
    tick_lower INT NOT NULL,       -- 价格区间下限
    tick_upper INT NOT NULL,       -- 价格区间上限
    liquidity NUMERIC DEFAULT 0,   -- 总流动性
    sqrt_price_x96 NUMERIC DEFAULT 0,  -- 当前价格（Q96格式）
    tick INT DEFAULT 0             -- 当前价格tick
);
```

**关键字段**:
- `liquidity`: 从 Mint/Burn 事件累加，或从 Swap 事件获取最新值
- `sqrt_price_x96`: 从 Swap 事件更新（最准确）
- `tick`: 从 Swap 事件更新

#### 3. positions 表
```sql
CREATE TABLE positions (
    id NUMERIC PRIMARY KEY,        -- NFT token ID 或哈希ID
    owner TEXT NOT NULL,
    pool_address TEXT REFERENCES pools(address),
    token0 TEXT REFERENCES tokens(address),
    token1 TEXT REFERENCES tokens(address),
    tick_lower INT NOT NULL,
    tick_upper INT NOT NULL,
    liquidity NUMERIC DEFAULT 0,   -- 该持仓的流动性
    fee_growth_inside0_last_x128 NUMERIC DEFAULT 0,
    fee_growth_inside1_last_x128 NUMERIC DEFAULT 0,
    tokens_owed0 NUMERIC DEFAULT 0,
    tokens_owed1 NUMERIC DEFAULT 0
);
```

**ID 生成策略**:
- **有 NFT**: 使用 `PositionManager` 分配的 `tokenId`
- **无 NFT**: 使用 `Keccak256(owner:pool:tickLower:tickUpper)` 的哈希值

#### 4. ticks 表
```sql
CREATE TABLE ticks (
    pool_address TEXT REFERENCES pools(address),
    tick_index INT NOT NULL,
    liquidity_gross NUMERIC DEFAULT 0,  -- 总流动性
    liquidity_net NUMERIC DEFAULT 0,    -- 净流动性变化
    fee_growth_outside0_x128 NUMERIC DEFAULT 0,
    fee_growth_outside1_x128 NUMERIC DEFAULT 0,
    PRIMARY KEY (pool_address, tick_index)
);
```

**流动性计算**:
- `liquidity_gross`: 所有经过该 tick 的流动性总和
- `liquidity_net`: 价格向上移动时的净变化
  - `tick_lower`: 正值（进入区间）
  - `tick_upper`: 负值（离开区间）

#### 5. swaps 表
```sql
CREATE TABLE swaps (
    transaction_hash TEXT NOT NULL,
    log_index INT NOT NULL,
    pool_address TEXT REFERENCES pools(address),
    sender TEXT NOT NULL,
    recipient TEXT NOT NULL,
    amount0 NUMERIC NOT NULL,      -- 有符号数
    amount1 NUMERIC NOT NULL,       -- 有符号数
    sqrt_price_x96 NUMERIC NOT NULL,
    liquidity NUMERIC NOT NULL,
    tick INT NOT NULL,
    block_number NUMERIC NOT NULL,
    block_timestamp TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (transaction_hash, log_index)
);
```

**索引优化**:
```sql
CREATE INDEX idx_swaps_pool_timestamp 
    ON swaps(pool_address, block_timestamp DESC);
```

---

## 实际运行示例

### 启动日志

```
2025/12/23 16:10:51 Event signatures:
2025/12/23 16:10:51   PoolCreated: 0xe026b1b60fa8f2d35cd0844432a7b513a5a112d8cfe2b30bc62c1c4b81373c75
2025/12/23 16:10:51   Swap: 0xc42079f94a6350d7e6235f29174924f928cc2ac818eb64fed8004e115fbcca67
2025/12/23 16:10:51   Mint: 0x011d4be6213866bff035f68967364cf69c5c01ff5bc23ff0a275f08a04381e6a
2025/12/23 16:10:51   Burn: 0xd4885a46e0c2f00ffdf2adb97a3909fd129dc1acccead462f7e29e6f18e54ec1
2025/12/23 16:10:51   Transfer: 0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef
2025/12/23 16:10:51 PoolManager address: 0xe7f1725e7734ce288f8367e1bb143e90bb3f0512
2025/12/23 16:10:51 Loaded 0 pools from database
Starting blockchain scanner...
2025/12/23 16:10:51 Scanning range 0 - 109
2025/12/23 16:10:51 Found 84 logs in range 0-109
```

### 处理 PoolCreated 事件

```
2025/12/23 16:10:51 Found new pool: 0x39D02eB4BFd41f9B363d424A105Af670b9011747 
    (Tokens: 0x610178dA211FEF7D417bC0e6FeD39F05609AD788, 0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e)
```

**处理步骤**:
1. 解析事件数据获取 token0、token1、fee、tick 范围
2. 确保 tokens 表中有这两个代币记录
3. 插入 pools 表
4. 添加到内存缓存

### 处理 Mint 事件

```
2025/12/23 16:10:51 No PositionManager Transfer (mint) event found in transaction 
    0x6a6878888185ace558c44b50aa6173171d3b81051c419e643a2130a55d274f52
2025/12/23 16:10:51 No position ID found in transaction ..., creating position from Pool Mint event
2025/12/23 16:10:51 Successfully upserted position 7464563754867862165 
    (owner=0x9A676e781A523b5d0C0e43731313A708CB607508, 
     pool=0x39D02eB4BFd41f9B363d424A105Af670b9011747, 
     liquidity=1000000000000000000000000000, rowsAffected=1)
```

**处理流程**:
1. 解析 Mint 事件获取 owner、amount
2. 更新 `liquidity_events` 表
3. 更新 `pools.liquidity`（累加）
4. 更新 `ticks` 表（tick_lower 和 tick_upper）
5. 查找 PositionManager Transfer 事件
6. 未找到 → 创建虚拟 position（使用哈希 ID）
7. 找到 → 使用 NFT tokenId 更新 position

### 处理 Swap 事件

```
2025/12/23 16:10:52 Processing Swap event: 
    pool=0x39D02eB4BFd41f9B363d424A105Af670b9011747
    amount0=-1000000000000000000
    amount1=2000000000000000000
    sqrtPriceX96=79228162514264337593543950336
    liquidity=1000000000000000000000000000
    tick=0
```

**处理步骤**:
1. 解析有符号数 amount0、amount1
2. 更新 `pools` 表的价格和流动性
3. 插入 `swaps` 表记录

### 同步完成

```
2025/12/23 16:10:51 Processed 28 events in range 0-109 (Transfer events: 0)
2025/12/23 16:10:51 WARNING: No PositionManager Transfer events found. 
    Positions table will be empty if liquidity was added via TestLP (not PositionManager)
2025/12/23 16:10:51 Synced to head (109). Waiting for new blocks...
```

---

## 数据验证查询

### 1. 检查池子状态

```sql
-- 查看所有池子及其流动性
SELECT 
    p.address,
    t0.symbol as token0,
    t1.symbol as token1,
    p.fee,
    p.liquidity,
    p.sqrt_price_x96,
    p.tick
FROM pools p
JOIN tokens t0 ON t0.address = p.token0
JOIN tokens t1 ON t1.address = p.token1
ORDER BY p.created_at DESC;
```

### 2. 检查持仓数据

```sql
-- 查看用户的所有持仓
SELECT 
    pos.id,
    pos.owner,
    t0.symbol || '/' || t1.symbol as pair,
    pos.liquidity,
    pos.tick_lower,
    pos.tick_upper
FROM positions pos
JOIN pools p ON p.address = pos.pool_address
JOIN tokens t0 ON t0.address = pos.token0
JOIN tokens t1 ON t1.address = pos.token1
WHERE pos.owner = '0x9A676e781A523b5d0C0e43731313A708CB607508'
ORDER BY pos.created_at DESC;
```

### 3. 检查流动性一致性

```sql
-- 验证池子流动性是否等于所有持仓流动性之和
SELECT 
    p.address,
    p.liquidity as pool_liquidity,
    COALESCE(SUM(pos.liquidity), 0) as positions_sum,
    p.liquidity - COALESCE(SUM(pos.liquidity), 0) as difference
FROM pools p
LEFT JOIN positions pos ON pos.pool_address = p.address
GROUP BY p.address, p.liquidity
HAVING ABS(p.liquidity - COALESCE(SUM(pos.liquidity), 0)) > 0.0001;
```

### 4. 检查交易历史

```sql
-- 查看最近的交易
SELECT 
    s.transaction_hash,
    t0.symbol || '/' || t1.symbol as pair,
    s.amount0,
    s.amount1,
    s.sqrt_price_x96,
    s.block_timestamp
FROM swaps s
JOIN pools p ON p.address = s.pool_address
JOIN tokens t0 ON t0.address = p.token0
JOIN tokens t1 ON t1.address = p.token1
ORDER BY s.block_timestamp DESC
LIMIT 20;
```

---

## 扩展阅读

### 相关文件
- `scanner.go`: Scanner 核心实现
- `main.go`: 服务入口和配置
- `schema.sql`: 数据库表结构定义
- `config.yaml`: 配置文件

### 合约文件
- `Pool.sol`: 流动性池合约
- `PositionManager.sol`: NFT 头寸管理合约
- `PoolManager.sol`: 池子工厂合约

### 进一步优化方向
1. 实现 ticks 的完整管理（支持多个 tick 范围）
2. 添加数据验证和修复机制
3. 实现分布式扫描（多实例）
4. 添加监控和告警
5. 优化数据库查询性能
6. 实现事件重放机制（修复遗漏数据）
7. 添加数据导出功能（CSV/JSON）


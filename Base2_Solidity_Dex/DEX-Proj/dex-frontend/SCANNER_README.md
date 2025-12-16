# 区块链扫描器使用说明

这个项目集成了一个强大的区块链扫描器，可以实时监控 MetaNodeSwap DEX 的所有链上活动并存储到 MySQL 数据库中。

## 功能特性

- ✅ **实时监控**: 持续扫描 Sepolia 测试网上的合约事件
- ✅ **数据存储**: 将所有事件数据存储到 MySQL 数据库
- ✅ **Web 界面**: 提供美观的数据展示界面
- ✅ **API 接口**: RESTful API 供第三方调用
- ✅ **多表设计**: 分别存储交易、池子、流动性变更等数据

## 监控的事件类型

### 1. 交易事件 (Swap)
- 交易哈希、区块号、时间戳
- 池子地址、发送者、接收者
- 输入/输出代币和数量
- 价格信息、流动性、tick 等

### 2. 池子创建事件 (PoolCreated)
- 新池子地址
- Token0/Token1 地址
- 手续费率、tick 间距
- 创建时间

### 3. 流动性变更事件 (Mint/Burn)
- Position ID、所有者
- 变更类型（添加/移除）
- Token0/Token1 数量
- Tick 范围

## 快速开始

### 1. 环境配置

首先创建 `.env.local` 文件：

```bash
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=dex_scanner

# 区块链 RPC 配置
SEPOLIA_RPC_URL=https://rpc.sepolia.org

# 扫链配置 (可选)
SCAN_INTERVAL=5000
BATCH_SIZE=1000
START_BLOCK=0
```

### 2. 安装依赖

```bash
cd dex-frontend
npm install
# 或使用 bun
bun install
```

### 3. 设置 MySQL 数据库

确保 MySQL 服务已启动，然后创建数据库：

```sql
CREATE DATABASE dex_scanner CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4. 启动扫描器

**方法一: 独立运行扫描器**
```bash
npm run scanner
```

**方法二: 在 Next.js 应用中集成**
```bash
npm run dev
```
然后访问 `http://localhost:3000/scanner` 查看数据

## 数据库表结构

### swaps 表 - 交易记录
- `transaction_hash`: 交易哈希 (主键)
- `block_number`: 区块号
- `block_timestamp`: 时间戳
- `pool_address`: 池子地址
- `sender`, `recipient`: 发送者和接收者
- `token_in`, `token_out`: 输入输出代币
- `amount_in`, `amount_out`: 交易数量
- `sqrt_price_x96`, `liquidity`, `tick`: 价格信息

### pools 表 - 流动性池
- `pool_address`: 池子地址 (主键)
- `token0`, `token1`: 代币对
- `fee`: 手续费率
- `created_block`, `created_timestamp`: 创建信息

### liquidity_changes 表 - 流动性变更
- `transaction_hash`: 交易哈希
- `pool_address`: 池子地址
- `position_id`: Position ID
- `owner`: 所有者
- `change_type`: 变更类型 (mint/burn)
- `amount0`, `amount1`: 代币数量

### tokens 表 - 代币信息
- `address`: 代币地址
- `symbol`: 代币符号
- `name`: 代币名称
- `decimals`: 精度

### scan_status 表 - 扫描状态
- `contract_address`: 合约地址
- `last_scanned_block`: 最后扫描的块号

## API 接口

### 获取统计数据
```
GET /api/scanner?action=stats
```

返回示例：
```json
{
  "success": true,
  "data": {
    "total_swaps": 1523,
    "total_pools": 12,
    "unique_traders": 156,
    "daily_volume": "1234567890000000000000",
    "daily_trades": 42
  }
}
```

### 获取交易列表
```
GET /api/scanner?action=swaps&page=1&limit=20
```

可选参数：
- `pool`: 池子地址过滤
- `token_in`: 输入代币过滤
- `token_out`: 输出代币过滤
- `sender`: 发送者地址过滤

### 获取流动性池列表
```
GET /api/scanner?action=pools
```

### 获取流动性变更记录
```
GET /api/scanner?action=liquidity&page=1&limit=20
```

可选参数：
- `pool`: 池子地址过滤
- `owner`: 所有者地址过滤
- `type`: 变更类型过滤 (mint/burn)

### 获取扫描状态
```
GET /api/scanner?action=status
```

## 监控的合约地址

- **PoolManager**: `0xddC12b3F9F7C91C79DA7433D8d212FB78d609f7B`
- **PositionManager**: `0xbe766Bf20eFfe431829C5d5a2744865974A0B610`
- **SwapRouter**: `0xD2c220143F5784b3bD84ae12747d97C8A36CeCB2`

## Web 界面功能

访问 `/scanner` 页面可以看到：

1. **统计概览**
   - 总交易数、流动性池数
   - 独立交易者数量
   - 今日交易量和次数
   - 流动性变更统计

2. **交易记录**
   - 实时交易列表
   - 交易详情（哈希、时间、交易对、数量等）
   - 链接到 Etherscan 查看详情

3. **流动性池**
   - 所有池子列表
   - 池子信息（代币对、手续费、交易统计）
   - 创建时间等

## 扩展功能

### 添加新的事件监控

1. 在 `blockchain-scanner.ts` 中添加新的事件签名
2. 在相应的扫描方法中处理新事件
3. 在数据库中创建对应的表结构
4. 在 API 中添加查询接口

### 性能优化

1. **批量插入**: 对于大量数据，使用批量插入提高性能
2. **并行扫描**: 对不同合约使用并行扫描
3. **增量同步**: 只扫描新的区块，避免重复处理
4. **缓存机制**: 对频繁查询的数据使用 Redis 缓存

### 告警功能

可以添加告警功能，当检测到：
- 大额交易
- 异常价格波动
- 新池子创建
- 大额流动性变更

## 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查 MySQL 服务是否启动
   - 验证 `.env.local` 中的数据库配置
   - 确保数据库用户有足够权限

2. **RPC 连接超时**
   - 更换为更稳定的 RPC 节点
   - 增加重试机制
   - 调整 `SCAN_INTERVAL` 减少请求频率

3. **扫描速度慢**
   - 减少 `BATCH_SIZE`
   - 增加 `SCAN_INTERVAL`
   - 使用更快的 RPC 节点

4. **内存使用过高**
   - 优化数据库查询
   - 及时释放连接
   - 定期清理旧数据

### 日志查看

扫描器会输出详细的日志信息，包括：
- 扫描进度
- 事件处理结果
- 错误信息

## 贡献指南

欢迎提交 Issue 和 Pull Request 来改进这个扫描器功能！

---

## 技术栈

- **Frontend**: Next.js 15, React 19, TailwindCSS
- **Backend**: Next.js API Routes
- **Database**: MySQL 8.0+
- **Blockchain**: Viem, Ethereum Sepolia
- **Language**: TypeScript

更多技术细节请查看源代码中的注释。 
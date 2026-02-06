# Buy/Sell Integration Fixes

## 错误修复记录

### 问题 1: "无法买入 - 请检查您的余额和金额"

**原因**：

1. `tokenAddress` 没有从父组件传递给 `RightPanel`
2. 变量初始化顺序错误

**解决方案**：

1. ✅ 修复 `TokenContent.tsx` - 添加 `tokenAddress` prop 传递

```tsx
// Before
<RightPanel className="h-full" />

// After
<RightPanel tokenAddress={tokenAddress} className="h-full" />
```

### 问题 2: "Cannot access 'minTokenAmount' before initialization"

**原因**：
`minimumReceived` 的计算引用了 `minTokenAmount` 和 `minBNBAmount`，但这些变量在之后才被定义

**解决方案**：
✅ 调整代码顺序，确保变量按正确顺序定义：

1. 先计算 `expectedTokenAmount` 和 `expectedBNBAmount`
2. 再计算 `minTokenAmount` 和 `minBNBAmount`
3. 最后计算 `minimumReceived`

### 问题 3: 错误信息不够详细

**解决方案**：
✅ 增强错误处理，提供更详细的错误信息：

- 检查 tokenAddress 是否有效
- 检查最小金额是否大于 0
- 显示具体的合约错误信息
- 添加调试日志

## 当前状态

### ✅ 已完成功能

1. **钱包连接检测** - 未连接时显示"连接钱包"按钮
2. **余额显示** - 实时显示 BNB 和代币余额
3. **预期收益计算** - 使用 CoinRollHelper 计算预期获得的代币/BNB
4. **滑点保护** - 根据用户设置的滑点计算最小接收量
5. **交易状态管理** - 准备中、确认中、处理中等状态
6. **错误处理** - 详细的错误信息和用户提示

### 📋 使用流程

#### 买入代币

1. 连接钱包
2. 输入 BNB 金额
3. 查看预期获得的代币数量
4. 设置滑点（默认 1%）
5. 点击"买入"按钮
6. 在钱包中确认交易
7. 等待交易完成

#### 卖出代币

1. 连接钱包
2. 输入代币金额
3. 查看预期获得的 BNB 数量
4. 设置滑点（默认 1%）
5. 如需授权，先点击"授权"按钮
6. 点击"卖出"按钮
7. 在钱包中确认交易
8. 等待交易完成

## 调试提示

如果遇到交易问题，请：

1. **检查浏览器控制台**
   - 查看 `Buy attempt:` 日志
   - 检查 tokenAddress 是否有效
   - 确认 minTokenAmount > 0

2. **验证 Token 地址**
   - 确保访问的 URL 包含有效的 token 地址
   - 格式：`/token/0x...`
   - Token 必须是 CoinRoll 系统中已部署的代币

3. **检查钱包**
   - 确保连接到正确的网络（BSC）
   - 确保有足够的 BNB 支付交易费用
   - 买入时需要足够的 BNB
   - 卖出时需要足够的代币余额

4. **合约要求**
   - Token 必须处于 TRADING 状态
   - 金额必须大于最小交易限制
   - 滑点设置要合理（通常 1-5%）

## 技术细节

### Hooks 使用

- `useBuyTokens` - 处理买入交易
- `useSellTokens` - 处理卖出交易（包括授权）
- `useCalculateTokenAmountOut` - 计算预期代币数量
- `useCalculateBNBAmountOut` - 计算预期 BNB 数量

### 状态管理

- 交易状态通过 wagmi hooks 管理
- 通知使用 Zustand store (useUIStore)
- 余额通过 wagmi 的 useBalance 实时更新

### 安全特性

- 交易前模拟执行
- 滑点保护
- 最小接收量验证
- 授权检查（卖出时）

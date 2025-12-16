'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAccount, useBalance, useWriteContract, useWaitForTransactionReceipt, useReadContracts } from 'wagmi'
import { parseUnits } from 'viem'
import { ChevronDown, Clock, CheckCircle } from 'lucide-react'
import { TOKENS, CONTRACTS } from '@/lib/constants'
import { cn, formatTokenAmount, parseInputAmount, shortenAddress } from '@/lib/utils'
import { ERC20_ABI } from '@/lib/contracts'

type Token = {
  address: string
  symbol: string
  name: string
  decimals: number
}

export default function AddLiquidity() {
  const { address, isConnected } = useAccount()
  const searchParams = useSearchParams()
  
  const [token0, setToken0] = useState<Token>(TOKENS.MNTokenA)
  const [token1, setToken1] = useState<Token>(TOKENS.MNTokenB)

  // 处理 URL 参数
  const paramToken0 = searchParams.get('token0') as `0x${string}`
  const paramToken1 = searchParams.get('token1') as `0x${string}`

  const { data: token0Data } = useReadContracts({
    contracts: paramToken0 ? [
      { address: paramToken0, abi: ERC20_ABI, functionName: 'symbol' },
      { address: paramToken0, abi: ERC20_ABI, functionName: 'name' },
      { address: paramToken0, abi: ERC20_ABI, functionName: 'decimals' },
    ] : [],
    query: { enabled: !!paramToken0 }
  })

  const { data: token1Data } = useReadContracts({
    contracts: paramToken1 ? [
      { address: paramToken1, abi: ERC20_ABI, functionName: 'symbol' },
      { address: paramToken1, abi: ERC20_ABI, functionName: 'name' },
      { address: paramToken1, abi: ERC20_ABI, functionName: 'decimals' },
    ] : [],
    query: { enabled: !!paramToken1 }
  })

  useEffect(() => {
    if (paramToken0 && token0Data) {
      const [symbol, name, decimals] = token0Data
      if (symbol.status === 'success' && name.status === 'success' && decimals.status === 'success') {
        setToken0({
          address: paramToken0,
          symbol: symbol.result as string,
          name: name.result as string,
          decimals: Number(decimals.result),
        })
      } else {
         // Fallback or check if it's ETH/WETH
         const known = Object.values(TOKENS).find(t => t.address.toLowerCase() === paramToken0.toLowerCase())
         if (known) setToken0(known)
      }
    }
  }, [paramToken0, token0Data])

  useEffect(() => {
    if (paramToken1 && token1Data) {
      const [symbol, name, decimals] = token1Data
      if (symbol.status === 'success' && name.status === 'success' && decimals.status === 'success') {
        setToken1({
          address: paramToken1,
          symbol: symbol.result as string,
          name: name.result as string,
          decimals: Number(decimals.result),
        })
      } else {
         const known = Object.values(TOKENS).find(t => t.address.toLowerCase() === paramToken1.toLowerCase())
         if (known) setToken1(known)
      }
    }
  }, [paramToken1, token1Data])

  const [amount0, setAmount0] = useState('')
  const [amount1, setAmount1] = useState('')
  const [fee, setFee] = useState(3000) // 默认费率 0.3%
  const [needsApproval0, setNeedsApproval0] = useState(false)
  const [needsApproval1, setNeedsApproval1] = useState(false)
  const [isCalculating, setIsCalculating] = useState(false)
  const [poolExists, setPoolExists] = useState(false)
  const [currentPool, setCurrentPool] = useState<string | null>(null)

  // 合约交互
  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })

  // 获取代币余额
  const { data: token0Balance } = useBalance({
    address: address,
    token: token0.address as `0x${string}`,
    query: {
      enabled: Boolean(address && isConnected),
    },
  })

  const { data: token1Balance } = useBalance({
    address: address,
    token: token1.address as `0x${string}`,
    query: {
      enabled: Boolean(address && isConnected),
    },
  })

  const tokenList = Object.values(TOKENS)

  // 检查池子是否存在
  const checkPoolExists = useCallback(async () => {
    if (!token0.address || !token1.address) return

    try {
      const response = await fetch('/api/pools/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token0: token0.address,
          token1: token1.address,
          fee,
        }),
      }).then(res => res.json())

      if (response.exists) {
        setPoolExists(true)
        setCurrentPool(response.poolAddress)
      } else {
        setPoolExists(false)
        setCurrentPool(null)
      }
    } catch (error) {
      console.error('检查池子失败:', error)
      setPoolExists(false)
      setCurrentPool(null)
    }
  }, [token0.address, token1.address, fee])

  // 当代币或费率变化时检查池子
  useEffect(() => {
    checkPoolExists()
  }, [token0.address, token1.address, fee, checkPoolExists])

  // 检查授权
  const checkAllowance = useCallback(async () => {
    if (!address || !token0.address || !token1.address || !amount0 || !amount1) {
      setNeedsApproval0(false)
      setNeedsApproval1(false)
      return
    }

    try {
      // 检查token0授权
      const allowance0Response = await fetch('/api/allowance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: token0.address,
          owner: address,
          spender: CONTRACTS.POOL_MANAGER,
        }),
      }).then(res => res.json())

      // 检查token1授权
      const allowance1Response = await fetch('/api/allowance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: token1.address,
          owner: address,
          spender: CONTRACTS.POOL_MANAGER,
        }),
      }).then(res => res.json())

      if (allowance0Response.success && allowance1Response.success) {
        const amountWei0 = parseUnits(amount0, token0.decimals)
        const amountWei1 = parseUnits(amount1, token1.decimals)
        
        setNeedsApproval0(BigInt(allowance0Response.allowance) < amountWei0)
        setNeedsApproval1(BigInt(allowance1Response.allowance) < amountWei1)
      }
    } catch (error) {
      console.error('检查授权失败:', error)
    }
  }, [address, token0, token1, amount0, amount1])

  // 当金额变化时检查授权
  useEffect(() => {
    checkAllowance()
  }, [amount0, amount1, token0, token1, address, checkAllowance])

  // 授权代币
  const approveToken = useCallback(async (tokenAddress: string, amount: string, decimals: number) => {
    if (!address) return

    const amountWei = parseUnits(amount, decimals)

    writeContract({
      address: tokenAddress as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [CONTRACTS.POOL_MANAGER as `0x${string}`, amountWei],
    })
  }, [address, writeContract])

  // 添加流动性
  const addLiquidity = useCallback(async () => {
    if (!address || !amount0 || !amount1 || !token0.address || !token1.address) return

    try {
      const amountWei0 = parseUnits(amount0, token0.decimals)
      const amountWei1 = parseUnits(amount1, token1.decimals)

      // 确保token0地址小于token1地址（Uniswap V4的要求）
      let sortedToken0 = token0
      let sortedToken1 = token1
      let sortedAmount0 = amountWei0
      let sortedAmount1 = amountWei1

      if (BigInt(token0.address) > BigInt(token1.address)) {
        sortedToken0 = token1
        sortedToken1 = token0
        sortedAmount0 = amountWei1
        sortedAmount1 = amountWei0
      }

      // 如果池子不存在，先创建池子
      if (!poolExists) {
        // 创建池子
        const sqrtPriceX96 = BigInt('1000000000000000000') // 初始价格 1.0
        
        writeContract({
          address: CONTRACTS.POOL_MANAGER as `0x${string}`,
          abi: [
            {
              type: 'function',
              name: 'createAndInitializePoolIfNecessary',
              stateMutability: 'payable',
              inputs: [
                { name: 'token0', type: 'address' },
                { name: 'token1', type: 'address' },
                { name: 'fee', type: 'uint24' },
                { name: 'sqrtPriceX96', type: 'uint160' },
              ],
              outputs: [{ name: 'pool', type: 'address' }],
            }
          ] as const,
          functionName: 'createAndInitializePoolIfNecessary',
          args: [
            sortedToken0.address as `0x${string}`,
            sortedToken1.address as `0x${string}`,
            fee,
            sqrtPriceX96,
          ],
        })
        return
      }

      // 如果池子存在，添加流动性
      writeContract({
        address: CONTRACTS.LIQUIDITY_MANAGER as `0x${string}`,
        abi: [
          {
            type: 'function',
            name: 'addLiquidity',
            stateMutability: 'payable',
            inputs: [
              {
                name: 'params',
                type: 'tuple',
                components: [
                  { name: 'token0', type: 'address' },
                  { name: 'token1', type: 'address' },
                  { name: 'fee', type: 'uint24' },
                  { name: 'tickLower', type: 'int24' },
                  { name: 'tickUpper', type: 'int24' },
                  { name: 'amount0Desired', type: 'uint256' },
                  { name: 'amount1Desired', type: 'uint256' },
                  { name: 'amount0Min', type: 'uint256' },
                  { name: 'amount1Min', type: 'uint256' },
                  { name: 'recipient', type: 'address' },
                  { name: 'deadline', type: 'uint256' },
                ],
              },
            ],
            outputs: [
              { name: 'tokenId', type: 'uint256' },
              { name: 'amount0', type: 'uint128' },
              { name: 'amount1', type: 'uint128' },
            ],
          }
        ] as const,
        functionName: 'addLiquidity',
        args: [{
          token0: sortedToken0.address as `0x${string}`,
          token1: sortedToken1.address as `0x${string}`,
          fee,
          tickLower: -887272, // 价格范围下限 - 这里简化处理
          tickUpper: 887272,  // 价格范围上限 - 这里简化处理
          amount0Desired: sortedAmount0,
          amount1Desired: sortedAmount1,
          amount0Min: BigInt(0),     // 最小接受数量 - 这里简化处理
          amount1Min: BigInt(0),     // 最小接受数量 - 这里简化处理
          recipient: address,
          deadline: BigInt(Math.floor(Date.now() / 1000) + 1200), // 20分钟后过期
        }],
      })
    } catch (error) {
      console.error('添加流动性失败:', error)
    }
  }, [address, amount0, amount1, token0, token1, fee, poolExists, writeContract])

  // 计算对应数量（简化版，实际应该根据池子价格计算）
  const calculateAmount = useCallback(async (inputToken: 'token0' | 'token1', amount: string) => {
    if (!amount || parseFloat(amount) === 0) {
      if (inputToken === 'token0') {
        setAmount1('')
      } else {
        setAmount0('')
      }
      return
    }

    setIsCalculating(true)

    try {
      // 如果池子存在，使用池子价格计算
      if (poolExists && currentPool) {
        const response = await fetch('/api/pools/price', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            poolAddress: currentPool,
            inputToken: inputToken === 'token0' ? token0.address : token1.address,
            inputAmount: amount,
          }),
        }).then(res => res.json())

        if (response.success) {
          if (inputToken === 'token0') {
            setAmount1(response.outputAmount)
          } else {
            setAmount0(response.outputAmount)
          }
        }
      } else {
        // 如果池子不存在，使用1:1的比例（简化处理）
        if (inputToken === 'token0') {
          setAmount1(amount)
        } else {
          setAmount0(amount)
        }
      }
    } catch (error) {
      console.error('计算数量失败:', error)
    } finally {
      setIsCalculating(false)
    }
  }, [poolExists, currentPool, token0.address, token1.address])

  const handleAmount0Change = (value: string) => {
    const parsed = parseInputAmount(value)
    setAmount0(parsed)
    calculateAmount('token0', parsed)
  }

  const handleAmount1Change = (value: string) => {
    const parsed = parseInputAmount(value)
    setAmount1(parsed)
    calculateAmount('token1', parsed)
  }

  const handleMaxAmount0 = () => {
    if (token0Balance) {
      setAmount0(token0Balance.formatted)
      calculateAmount('token0', token0Balance.formatted)
    }
  }

  const handleMaxAmount1 = () => {
    if (token1Balance) {
      setAmount1(token1Balance.formatted)
      calculateAmount('token1', token1Balance.formatted)
    }
  }

  const TokenSelector = ({ 
    selectedToken, 
    onSelect, 
    label,
    otherToken
  }: { 
    selectedToken: Token
    onSelect: (token: Token) => void
    label: string
    otherToken: Token
  }) => {
    const [isOpen, setIsOpen] = useState(false)

    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg transition-colors"
        >
          <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">{selectedToken.symbol[0]}</span>
          </div>
          <span className="font-medium">{selectedToken.symbol}</span>
          <ChevronDown className="w-4 h-4" />
        </button>

        {isOpen && (
          <div className="absolute top-full mt-1 w-48 bg-white border rounded-lg shadow-lg z-50">
            <div className="p-2">
              <div className="text-sm text-gray-500 px-2 py-1">{label}</div>
              {tokenList.map((token) => (
                <button
                  key={token.address}
                  onClick={() => {
                    onSelect(token)
                    setIsOpen(false)
                  }}
                  disabled={token.address === otherToken.address}
                  className={cn(
                    "w-full flex items-center space-x-3 px-2 py-2 rounded transition-colors",
                    selectedToken.address === token.address && "bg-blue-50",
                    token.address === otherToken.address ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-100"
                  )}
                >
                  <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">{token.symbol[0]}</span>
                  </div>
                  <div className="text-left">
                    <div className="font-medium">{token.symbol}</div>
                    <div className="text-sm text-gray-500">{token.name}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // 交易状态显示
  const TransactionStatus = () => {
    if (!hash) return null

    return (
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center space-x-2">
          {isPending && (
            <>
              <Clock className="w-5 h-5 text-blue-600 animate-spin" />
              <span className="text-blue-700">等待钱包确认...</span>
            </>
          )}
          {isConfirming && (
            <>
              <Clock className="w-5 h-5 text-blue-600 animate-spin" />
              <span className="text-blue-700">交易确认中...</span>
            </>
          )}
          {isConfirmed && (
            <>
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-green-700">交易成功！</span>
            </>
          )}
        </div>
        <div className="mt-2 text-sm text-blue-600">
          交易哈希: {shortenAddress(hash)}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-2xl border shadow-lg p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">添加流动性</h2>
        </div>

        {/* Transaction Status */}
        <TransactionStatus />

        {/* Wallet Status */}
        {isConnected && address && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <div className="text-sm text-blue-700">
              已连接: {shortenAddress(address)}
            </div>
          </div>
        )}

        {/* Pool Status */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">池子状态</span>
            <span className={cn(
              "text-sm font-medium",
              poolExists ? "text-green-600" : "text-orange-600"
            )}>
              {poolExists ? "已存在" : "未创建"}
            </span>
          </div>
          {currentPool && (
            <div className="mt-1 text-xs text-gray-500">
              池子地址: {shortenAddress(currentPool)}
            </div>
          )}
        </div>

        {/* Fee Selection */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">费率</span>
          </div>
          <div className="flex space-x-2">
            {[500, 3000, 10000].map((feeValue) => (
              <button
                key={feeValue}
                onClick={() => setFee(feeValue)}
                className={cn(
                  "px-3 py-2 rounded text-sm transition-colors flex-1",
                  fee === feeValue 
                    ? "bg-blue-500 text-white" 
                    : "bg-white border hover:bg-gray-50"
                )}
              >
                {feeValue / 10000}%
              </button>
            ))}
          </div>
        </div>

        {/* Token0 Input */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">代币 1</span>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">
                余额: {token0Balance ? formatTokenAmount(token0Balance.formatted) : '0'}
              </span>
              {token0Balance && parseFloat(token0Balance.formatted) > 0 && (
                <button
                  onClick={handleMaxAmount0}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  最大
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <input
              type="text"
              value={amount0}
              onChange={(e) => handleAmount0Change(e.target.value)}
              placeholder="0"
              className="text-2xl font-medium bg-transparent outline-none flex-1"
            />
            <TokenSelector
              selectedToken={token0}
              onSelect={setToken0}
              label="选择代币"
              otherToken={token1}
            />
          </div>
        </div>

        {/* Token1 Input */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">代币 2</span>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">
                余额: {token1Balance ? formatTokenAmount(token1Balance.formatted) : '0'}
              </span>
              {token1Balance && parseFloat(token1Balance.formatted) > 0 && (
                <button
                  onClick={handleMaxAmount1}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  最大
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <input
                type="text"
                value={isCalculating ? '计算中...' : amount1}
                onChange={(e) => handleAmount1Change(e.target.value)}
                placeholder="0"
                className="text-2xl font-medium bg-transparent outline-none flex-1"
                readOnly={isCalculating}
              />
              {isCalculating && <Clock className="w-4 h-4 text-gray-400 animate-spin ml-2" />}
            </div>
            <TokenSelector
              selectedToken={token1}
              onSelect={setToken1}
              label="选择代币"
              otherToken={token0}
            />
          </div>
        </div>

        {/* Action Buttons */}
        {!isConnected ? (
          <button
            disabled
            className="w-full py-4 rounded-lg font-medium text-lg bg-yellow-500 text-white cursor-not-allowed"
          >
            请先连接钱包
          </button>
        ) : needsApproval0 ? (
          <button
            onClick={() => approveToken(token0.address, amount0, token0.decimals)}
            disabled={isPending || !amount0}
            className={cn(
              "w-full py-4 rounded-lg font-medium text-lg transition-colors",
              isPending || !amount0
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-orange-500 hover:bg-orange-600 text-white"
            )}
          >
            {isPending ? '授权中...' : `授权 ${token0.symbol}`}
          </button>
        ) : needsApproval1 ? (
          <button
            onClick={() => approveToken(token1.address, amount1, token1.decimals)}
            disabled={isPending || !amount1}
            className={cn(
              "w-full py-4 rounded-lg font-medium text-lg transition-colors",
              isPending || !amount1
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-orange-500 hover:bg-orange-600 text-white"
            )}
          >
            {isPending ? '授权中...' : `授权 ${token1.symbol}`}
          </button>
        ) : (
          <button
            onClick={addLiquidity}
            disabled={!amount0 || !amount1 || isPending || isConfirming || isCalculating}
            className={cn(
              "w-full py-4 rounded-lg font-medium text-lg transition-colors",
              !amount0 || !amount1 || isPending || isConfirming || isCalculating
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            )}
          >
            {isPending || isConfirming 
              ? '处理中...' 
              : isCalculating
              ? '计算中...'
              : poolExists ? '添加流动性' : '创建池子并添加流动性'}
          </button>
        )}
      </div>
    </div>
  )
} 
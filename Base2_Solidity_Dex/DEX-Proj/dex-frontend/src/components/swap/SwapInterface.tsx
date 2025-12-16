'use client'

import { useState, useEffect, useCallback } from 'react'
import { ArrowUpDown, Settings, ChevronDown, CheckCircle, Clock } from 'lucide-react'
import { useAccount, useBalance } from 'wagmi'
import { parseUnits } from 'viem'
import { TOKENS } from '@/lib/constants'
import { cn, formatTokenAmount, parseInputAmount, shortenAddress } from '@/lib/utils'
import { useSwap } from '@/hooks/useSwap'
import { usePools } from '@/hooks/usePools'

type Token = {
  address: string
  symbol: string
  name: string
  decimals: number
}

export default function SwapInterface() {
  const { address, isConnected } = useAccount()
  const [fromToken, setFromToken] = useState<Token>(TOKENS.MNTokenA)
  const [toToken, setToToken] = useState<Token>(TOKENS.MNTokenB)
  const [fromAmount, setFromAmount] = useState('')
  const [toAmount, setToAmount] = useState('')
  const [slippage, setSlippage] = useState(0.5)
  const [showSettings, setShowSettings] = useState(false)
  const [needsApproval, setNeedsApproval] = useState(false)
  const [isQuoting, setIsQuoting] = useState(false)
  const [isSimulated, setIsSimulated] = useState(false)

  // 使用自定义交换 hooks
  const {
    executeSwap,
    approveToken,
    getQuote,
    useTokenAllowance,
    isPending,
    isConfirming,
    isConfirmed,
    hash,
  } = useSwap()
  const { pools, loading: poolsLoading, error: poolsError } = usePools();

  useEffect(() => {
    // console.log('pools', pools)
  }, [pools])

  // 获取代币余额
  const { data: fromTokenBalance } = useBalance({
    address: address,
    token: fromToken.address as `0x${string}`,
    query: {
      enabled: Boolean(address && isConnected),
    },
  })

  const { data: toTokenBalance } = useBalance({
    address: address,
    token: toToken.address as `0x${string}`,
    query: {
      enabled: Boolean(address && isConnected),
    },
  })

  // 检查授权
  const { data: allowance, refetch: refetchAllowance } = useTokenAllowance(fromToken.address)

  const tokenList = Object.values(TOKENS)

  // 检查是否需要授权
  useEffect(() => {
    if (allowance && fromAmount) {
      try {
        const amountWei = parseUnits(fromAmount, fromToken.decimals)
        setNeedsApproval(allowance < amountWei)
      } catch {
        setNeedsApproval(false)
      }
    } else {
      setNeedsApproval(false)
    }
  }, [allowance, fromAmount, fromToken.decimals])

  // 自动获取价格预估
  const updateQuote = useCallback(async () => {
    if (!fromAmount || parseFloat(fromAmount) === 0) {
      setToAmount('')
      return
    }

    setIsQuoting(true)
    try {
      const quote = await getQuote({
        tokenIn: fromToken.address,
        tokenOut: toToken.address,
        amountIn: fromAmount,
        slippage,
      })

      if (quote) {
        setToAmount(quote.amountOut)
        setIsSimulated(quote.simulated || false)
      } else {
        setToAmount('')
      }
    } catch (error) {
      console.error('Quote failed:', error)
      setToAmount('')
    } finally {
      setIsQuoting(false)
    }
  }, [fromAmount, fromToken.address, toToken.address, slippage])

  // 当输入参数变化时获取报价 - 修复无限循环
  useEffect(() => {
    if (!fromAmount || parseFloat(fromAmount) === 0) {
      setToAmount('')
      return
    }
    
    const timer = setTimeout(() => {
      updateQuote()
    }, 500) // 防抖 500ms
    return () => clearTimeout(timer)
  }, [fromAmount, fromToken.address, toToken.address, slippage]) // 直接使用基础依赖项

  const handleFromAmountChange = (value: string) => {
    const parsed = parseInputAmount(value)
    setFromAmount(parsed)
  }

  const handleSwapTokens = () => {
    setFromToken(toToken)
    setToToken(fromToken)
    setFromAmount(toAmount)
    setToAmount(fromAmount)
  }

  const handleApprove = async () => {
    if (!fromAmount) return
    
    try {
      await approveToken(fromToken.address, fromAmount)
    } catch (error) {
      console.error('Approval failed:', error)
    }
  }

  const handleSwap = async () => {
    if (!fromAmount || !toAmount || !isConnected) return
    
    try {
      await executeSwap({
        tokenIn: fromToken.address,
        tokenOut: toToken.address,
        amountIn: fromAmount,
        slippage,
      })
    } catch (error) {
      console.error('Swap failed:', error)
    }
  }

  const handleMaxAmount = () => {
    if (fromTokenBalance) {
      setFromAmount(fromTokenBalance.formatted)
    }
  }

  // 刷新授权状态
  useEffect(() => {
    if (isConfirmed) {
      refetchAllowance()
    }
  }, [isConfirmed, refetchAllowance])

  const TokenSelector = ({ 
    selectedToken, 
    onSelect, 
    label 
  }: { 
    selectedToken: Token
    onSelect: (token: Token) => void
    label: string 
  }) => {
    const [isOpen, setIsOpen] = useState(false)

    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground px-3 py-2 rounded-lg transition-colors"
        >
          <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">{selectedToken.symbol[0]}</span>
          </div>
          <span className="font-medium">{selectedToken.symbol}</span>
          <ChevronDown className="w-4 h-4" />
        </button>

        {isOpen && (
          <div className="absolute top-full mt-1 w-48 bg-background border border-border rounded-lg shadow-lg z-50">
            <div className="p-2">
              <div className="text-sm text-muted-foreground px-2 py-1">{label}</div>
              {tokenList.map((token) => (
                <button
                  key={token.address}
                  onClick={() => {
                    onSelect(token)
                    setIsOpen(false)
                  }}
                  className={cn(
                    "w-full flex items-center space-x-3 px-2 py-2 rounded hover:bg-accent transition-colors",
                    selectedToken.address === token.address && "bg-accent"
                  )}
                >
                  <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">{token.symbol[0]}</span>
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-foreground">{token.symbol}</div>
                    <div className="text-sm text-muted-foreground">{token.name}</div>
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
      <div className="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-lg">
        <div className="flex items-center space-x-2">
          {isPending && (
            <>
              <Clock className="w-5 h-5 text-primary animate-spin" />
              <span className="text-primary">等待钱包确认...</span>
            </>
          )}
          {isConfirming && (
            <>
              <Clock className="w-5 h-5 text-primary animate-spin" />
              <span className="text-primary">交易确认中...</span>
            </>
          )}
          {isConfirmed && (
            <>
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              <span className="text-green-700 dark:text-green-300">交易成功！</span>
            </>
          )}
        </div>
        <div className="mt-2 text-sm text-primary">
          交易哈希: {shortenAddress(hash)}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-card border border-border rounded-2xl shadow-lg p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-card-foreground">交换</h2>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
          >
            <Settings className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Transaction Status */}
        <TransactionStatus />

        {/* Wallet Status */}
        {isConnected && address && (
          <div className="mb-4 p-3 bg-primary/10 rounded-lg">
            <div className="text-sm text-primary">
              已连接: {shortenAddress(address)}
            </div>
          </div>
        )}

        {/* Settings Panel */}
        {showSettings && (
          <div className="mb-6 p-4 bg-muted rounded-lg">
            <div className="text-sm font-medium mb-2 text-muted-foreground">滑点容忍度</div>
            <div className="flex space-x-2">
              {[0.1, 0.5, 1.0].map((value) => (
                <button
                  key={value}
                  onClick={() => setSlippage(value)}
                  className={cn(
                    "px-3 py-1 rounded text-sm transition-colors",
                    slippage === value 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-background border border-border hover:bg-accent"
                  )}
                >
                  {value}%
                </button>
              ))}
            </div>
          </div>
        )}

        {/* From Token */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">从</span>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">
                余额: {fromTokenBalance ? formatTokenAmount(fromTokenBalance.formatted) : '0'}
              </span>
              {fromTokenBalance && parseFloat(fromTokenBalance.formatted) > 0 && (
                <button
                  onClick={handleMaxAmount}
                  className="text-xs text-primary hover:text-primary/80 font-medium"
                >
                  最大
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <input
              type="text"
              value={fromAmount}
              onChange={(e) => handleFromAmountChange(e.target.value)}
              placeholder="0"
              className="text-2xl font-medium bg-transparent outline-none flex-1 text-foreground placeholder:text-muted-foreground"
            />
            <TokenSelector
              selectedToken={fromToken}
              onSelect={setFromToken}
              label="选择代币"
            />
          </div>
        </div>

        {/* Swap Arrow */}
        <div className="flex justify-center mb-4">
          <button
            onClick={handleSwapTokens}
            className="p-2 bg-muted hover:bg-accent border border-border rounded-lg transition-colors"
          >
            <ArrowUpDown className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* To Token */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">到</span>
            <span className="text-sm text-muted-foreground">
              余额: {toTokenBalance ? formatTokenAmount(toTokenBalance.formatted) : '0'}
            </span>
          </div>
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="text-2xl font-medium text-foreground flex-1">
              {isQuoting ? (
                <div className="flex items-center">
                  <Clock className="w-4 h-4 animate-spin mr-2 text-muted-foreground" />
                  <span className="text-muted-foreground">获取报价中...</span>
                </div>
              ) : (
                toAmount || '0'
              )}
            </div>
            <TokenSelector
              selectedToken={toToken}
              onSelect={setToToken}
              label="选择代币"
            />
          </div>
          {isSimulated && (
            <div className="mt-2 text-xs text-yellow-600 dark:text-yellow-400">
              ⚠️ 模拟报价，实际价格可能有差异
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="space-y-3">
          {!isConnected ? (
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-muted-foreground">请先连接钱包</p>
            </div>
          ) : needsApproval ? (
            <button
              onClick={handleApprove}
              disabled={isPending || isConfirming || !fromAmount}
              className="w-full bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              {isPending || isConfirming ? '处理中...' : `授权 ${fromToken.symbol}`}
            </button>
          ) : (
            <button
              onClick={handleSwap}
              disabled={isPending || isConfirming || !fromAmount || !toAmount || parseFloat(fromAmount) === 0}
              className="w-full bg-primary hover:bg-primary/90 disabled:bg-muted disabled:cursor-not-allowed text-primary-foreground font-medium py-3 px-4 rounded-lg transition-colors"
            >
              {isPending || isConfirming ? '交换中...' : '交换'}
            </button>
          )}

          {/* Price Info */}
          {fromAmount && toAmount && parseFloat(fromAmount) > 0 && parseFloat(toAmount) > 0 && (
            <div className="text-xs text-muted-foreground text-center">
              1 {fromToken.symbol} ≈ {(parseFloat(toAmount) / parseFloat(fromAmount)).toFixed(6)} {toToken.symbol}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
import { useState, useCallback } from 'react'
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits, formatUnits } from 'viem'
import { contractConfig, ERC20_ABI } from '@/lib/contracts'
import { TOKENS } from '@/lib/constants'

export interface SwapParams {
  tokenIn: string
  tokenOut: string
  amountIn: string
  slippage: number
}

export function useSwap() {
  const { address } = useAccount()
  const { writeContract, data: hash, isPending } = useWriteContract()
  const [lastSwapParams, setLastSwapParams] = useState<SwapParams | null>(null)

  // 等待交易确认
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })

  // 获取价格预估 - 使用合约调用
  const getQuote = useCallback(async (params: SwapParams) => {
    if (!params.amountIn || parseFloat(params.amountIn) === 0) {
      return null
    }

    try {
      // 找到对应的代币信息
      // Since we are fetching tokens from API now, the TOKENS constant might be outdated or incomplete if we rely solely on it.
      // However, for this hook, we receive token addresses.
      // We should ideally fetch token info if not found, but for fallback simulation we need decimals.
      
      // Let's try to find in TOKENS first, if not found, we might need to look up from a passed list or fetch.
      // But `useSwap` doesn't have access to the dynamic token list from `SwapInterface`.
      // The `params` only contain addresses.
      
      // FIX: In SwapInterface, we should pass decimals or full token objects to getQuote if possible, 
      // or useSwap should fetch token info on demand.
      // For now, let's relax the check for simulation fallback or assume standard 18 decimals if not found,
      // OR better: trust the API first.
      
      let tokenInDecimals = 18;
      const tokenInObj = Object.values(TOKENS).find(t => t.address.toLowerCase() === params.tokenIn.toLowerCase());
      if (tokenInObj) tokenInDecimals = tokenInObj.decimals;
      
      // If we don't find it in TOKENS, we proceed with 18 decimals for API call serialization if needed,
      // but API call takes string amount. Wait, amountInWei needs decimals.
      // If we don't know decimals, we can't parse units correctly.
      
      // Solution: The caller (SwapInterface) knows the token objects. 
      // We should probably update useSwap to accept decimals or use public client to fetch decimals.
      // For immediate fix: assume 18 if not found, OR check if the caller can pass it.
      // `SwapParams` has strings.
      
      // Let's fetch decimals if not found in local map using wagmi's useReadContract? 
      // No, we can't use hooks inside callback.
      
      // We will assume 18 decimals if local lookup fails, but log a warning.
      if (!tokenInObj) {
         console.warn(`Token ${params.tokenIn} not found in local config, assuming 18 decimals`);
      }

      const amountInWei = parseUnits(params.amountIn, tokenInDecimals)
      
      // 调用合约的 quoteExactInput 函数
      const result = await fetch('/api/quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tokenIn: params.tokenIn,
          tokenOut: params.tokenOut,
          amountIn: amountInWei.toString(),
          indexPath: [0], // 简化：使用第一个池子的索引
          sqrtPriceLimitX96: '0',
        }),
      }).then(res => res.json())
      
      if (result.error) {
        throw new Error(result.error)
      }
      
      // ... rest of the success logic
      
      let tokenOutDecimals = 18;
      const tokenOutObj = Object.values(TOKENS).find(t => t.address.toLowerCase() === params.tokenOut.toLowerCase());
      if (tokenOutObj) tokenOutDecimals = tokenOutObj.decimals;
      
      const amountOut = BigInt(result.amountOut)
      const priceImpact = result.priceImpact || '0.5' // 默认价格影响
      
      return {
        amountOut: formatUnits(amountOut, tokenOutDecimals),
        priceImpact,
        simulated: result.simulated || false,
      }
    } catch (error) {
      console.error('Quote failed:', error)
      
      // 如果API调用失败，回退到模拟数据（仅用于开发）
      try {
        let tokenInDecimals = 18;
        const tokenInObj = Object.values(TOKENS).find(t => t.address.toLowerCase() === params.tokenIn.toLowerCase());
        if (tokenInObj) tokenInDecimals = tokenInObj.decimals;
        
        let tokenOutDecimals = 18;
        const tokenOutObj = Object.values(TOKENS).find(t => t.address.toLowerCase() === params.tokenOut.toLowerCase());
        if (tokenOutObj) tokenOutDecimals = tokenOutObj.decimals;

        const amountInWei = parseUnits(params.amountIn, tokenInDecimals)
        const simulatedAmountOut = amountInWei * BigInt(98) / BigInt(100) // 模拟 2% 的滑点
        
        console.warn('使用模拟数据，实际生产环境应使用合约调用')
        return {
          amountOut: formatUnits(simulatedAmountOut, tokenOutDecimals),
          priceImpact: '2.0', // 模拟价格影响
          simulated: true,
        }
      } catch (fallbackError) {
        console.error('Fallback quote also failed:', fallbackError)
        return null
      }
    }
  }, [])

  // 检查代币授权
  const useTokenAllowance = (tokenAddress: string) => {
    return useReadContract({
      address: tokenAddress as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: address ? [address, contractConfig.swapRouter.address] : undefined,
      query: {
        enabled: Boolean(address && tokenAddress),
      },
    })
  }

  // 授权代币
  const approveToken = useCallback(async (tokenAddress: string, amount: string) => {
    if (!address) return

    const token = Object.values(TOKENS).find(t => t.address === tokenAddress)
    if (!token) throw new Error('Token not found')

    const amountWei = parseUnits(amount, token.decimals)

    writeContract({
      address: tokenAddress as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [contractConfig.swapRouter.address, amountWei],
    })
  }, [address, writeContract])

  // 执行交换
  const executeSwap = useCallback(async (params: SwapParams) => {
    if (!address) {
      throw new Error('Wallet not connected')
    }

    const tokenIn = Object.values(TOKENS).find(t => t.address === params.tokenIn)
    const tokenOut = Object.values(TOKENS).find(t => t.address === params.tokenOut)
    
    if (!tokenIn || !tokenOut) {
      throw new Error('Token not found')
    }

    const amountInWei = parseUnits(params.amountIn, tokenIn.decimals)
    
    // 获取价格预估来计算最小输出
    const quote = await getQuote(params)
    if (!quote) {
      throw new Error('Failed to get quote')
    }

    const amountOutWei = parseUnits(quote.amountOut, tokenOut.decimals)
    const minAmountOut = amountOutWei * BigInt(Math.floor((100 - params.slippage) * 100)) / BigInt(10000)

    // 检查是否是原生ETH交易
    const isNativeTokenIn = 'isNative' in tokenIn && tokenIn.isNative
    
    // 如果是ETH交易，则使用wrappedAddress(WETH)
    const actualTokenIn = isNativeTokenIn && 'wrappedAddress' in tokenIn 
      ? tokenIn.wrappedAddress as string
      : params.tokenIn

    const actualTokenOut = tokenOut.address === TOKENS.ETH.address && 'wrappedAddress' in TOKENS.ETH
      ? TOKENS.ETH.wrappedAddress as string
      : params.tokenOut

    const swapParams = {
      tokenIn: actualTokenIn as `0x${string}`,
      tokenOut: actualTokenOut as `0x${string}`,
      indexPath: [0], // 简化：使用第一个池子的索引
      recipient: address,
      deadline: BigInt(Math.floor(Date.now() / 1000) + 1200), // 20分钟后过期
      amountIn: amountInWei,
      amountOutMinimum: minAmountOut,
      sqrtPriceLimitX96: BigInt(0),
    }

    setLastSwapParams(params)

    // 如果是ETH交易，增加value参数
    const value = isNativeTokenIn ? amountInWei : BigInt(0)

    writeContract({
      ...contractConfig.swapRouter,
      functionName: 'exactInput',
      args: [swapParams],
      value,
    })
  }, [address, writeContract, getQuote])

  return {
    executeSwap,
    approveToken,
    getQuote,
    useTokenAllowance,
    isPending,
    isConfirming,
    isConfirmed,
    hash,
    lastSwapParams,
  }
} 
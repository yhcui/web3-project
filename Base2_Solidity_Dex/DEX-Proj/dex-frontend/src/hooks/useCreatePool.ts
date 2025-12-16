'use client'

import { useState } from 'react'
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi'
import { contractConfig } from '@/lib/contracts'
import { TOKENS } from '@/lib/constants'

// Uniswap V3 价格计算相关常量
const Q96 = BigInt(2) ** BigInt(96)

// 价格转换函数：从价格比率计算 sqrtPriceX96
// 假设初始价格比率为 1:1（token0:token1）
const encodePriceSqrt = (reserve1: bigint, reserve0: bigint): bigint => {
  return (reserve1 * Q96) / reserve0
}

// 从费率计算 tick 范围的简化版本
const getTickRange = (fee: number): { tickLower: number; tickUpper: number } => {
  // 根据费率设置不同的 tick 范围
  switch (fee) {
    case 500:   // 0.05%
      return { tickLower: -60, tickUpper: 60 }     // 较小范围，适合稳定币
    case 3000:  // 0.3%
      return { tickLower: -887220, tickUpper: 887220 } // 全范围流动性
    case 10000: // 1%
      return { tickLower: -887220, tickUpper: 887220 } // 全范围流动性
    default:
      return { tickLower: -887220, tickUpper: 887220 }
  }
}

export interface CreatePoolParams {
  token0: string
  token1: string
  fee: number
}

export const useCreatePool = () => {
  const { address } = useAccount()
  const [isCreating, setIsCreating] = useState(false)
  const [txHash, setTxHash] = useState<string | null>(null)

  const { writeContract, data: hash, error: writeError } = useWriteContract()

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })

  const createPool = async (params: CreatePoolParams) => {
    if (!address) {
      throw new Error('请先连接钱包')
    }

    const { token0, token1, fee } = params

    // 确保 token0 < token1 (Uniswap V3 约定)
    const [sortedToken0, sortedToken1] = token0.toLowerCase() < token1.toLowerCase() 
      ? [token0, token1] 
      : [token1, token0]

    // 获取代币信息用于验证
    const token0Info = Object.values(TOKENS).find(
      t => t.address.toLowerCase() === sortedToken0.toLowerCase()
    )
    const token1Info = Object.values(TOKENS).find(
      t => t.address.toLowerCase() === sortedToken1.toLowerCase()
    )

    if (!token0Info || !token1Info) {
      throw new Error('无效的代币地址')
    }

    try {
      setIsCreating(true)

      // 计算初始价格 (1:1 比率)
      const sqrtPriceX96 = encodePriceSqrt(
        BigInt(10) ** BigInt(token1Info.decimals), // reserve1
        BigInt(10) ** BigInt(token0Info.decimals)  // reserve0
      )

      // 获取 tick 范围
      const { tickLower, tickUpper } = getTickRange(fee)

      // 构造创建池子的参数
      const createParams = {
        token0: sortedToken0 as `0x${string}`,
        token1: sortedToken1 as `0x${string}`,
        fee: fee,
        tickLower: tickLower,
        tickUpper: tickUpper,
        sqrtPriceX96: sqrtPriceX96,
      }

      console.log('创建池子参数:', {
        ...createParams,
        sqrtPriceX96: sqrtPriceX96.toString(),
        token0Symbol: token0Info.symbol,
        token1Symbol: token1Info.symbol,
      })

      // 调用合约
      await writeContract({
        ...contractConfig.poolManager,
        functionName: 'createAndInitializePoolIfNecessary',
        args: [createParams],
      })

      if (hash) {
        setTxHash(hash)
      }

    } catch (error) {
      console.error('创建池子失败:', error)
      throw error
    } finally {
      setIsCreating(false)
    }
  }

  return {
    createPool,
    isCreating: isCreating || isConfirming,
    isConfirmed,
    txHash: hash || txHash,
    error: writeError,
  }
} 
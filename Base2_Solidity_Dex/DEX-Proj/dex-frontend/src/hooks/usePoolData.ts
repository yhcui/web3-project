'use client'

import { useState, useEffect } from 'react'
import { useReadContracts } from 'wagmi'
import { formatUnits } from 'viem'
import { contractConfig } from '@/lib/contracts'
import { TOKENS } from '@/lib/constants'

export interface PoolData {
  poolAddress: string
  token0Balance: string
  token1Balance: string
  feeGrowthGlobal0X128: string
  feeGrowthGlobal1X128: string
  tvlUSD: number
  volumeUSD: number
  feesUSD: number
}

export const usePoolData = (poolAddress: string, token0: string, token1: string) => {
  const [poolData, setPoolData] = useState<PoolData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 获取代币信息
  const getTokenInfo = (address: string) => {
    const token = Object.values(TOKENS).find(
      t => t.address.toLowerCase() === address.toLowerCase()
    )
    return token || { symbol: 'UNKNOWN', name: 'Unknown Token', decimals: 18 }
  }

  const token0Info = getTokenInfo(token0)
  const token1Info = getTokenInfo(token1)

  // 设置合约调用
  const contracts = poolAddress && token0 && token1 ? [
    // 获取 token0 在池子中的余额
    {
      address: token0 as `0x${string}`,
      abi: contractConfig.erc20.abi,
      functionName: 'balanceOf',
      args: [poolAddress as `0x${string}`],
    },
    // 获取 token1 在池子中的余额
    {
      address: token1 as `0x${string}`,
      abi: contractConfig.erc20.abi,
      functionName: 'balanceOf',
      args: [poolAddress as `0x${string}`],
    },
    // 获取池子的费用增长信息
    {
      address: poolAddress as `0x${string}`,
      abi: contractConfig.pool.abi,
      functionName: 'feeGrowthGlobal0X128',
    },
    {
      address: poolAddress as `0x${string}`,
      abi: contractConfig.pool.abi,
      functionName: 'feeGrowthGlobal1X128',
    },
  ] : []

  const { data: contractData, isLoading, error: contractError } = useReadContracts({
    contracts,
    query: {
      enabled: !!poolAddress && !!token0 && !!token1,
    },
  })

  useEffect(() => {
    if (contractData && contractData.length === 4 && !isLoading) {
      try {
        const [
          token0BalanceResult,
          token1BalanceResult,
          feeGrowth0Result,
          feeGrowth1Result
        ] = contractData

        // 检查所有调用是否成功
        if (
          token0BalanceResult.status === 'success' &&
          token1BalanceResult.status === 'success' &&
          feeGrowth0Result.status === 'success' &&
          feeGrowth1Result.status === 'success'
        ) {
          // 格式化代币余额
          const token0Balance = formatUnits(
            token0BalanceResult.result as bigint,
            token0Info.decimals
          )
          const token1Balance = formatUnits(
            token1BalanceResult.result as bigint,
            token1Info.decimals
          )

          // 获取费用增长数据
          const feeGrowthGlobal0X128 = (feeGrowth0Result.result as bigint).toString()
          const feeGrowthGlobal1X128 = (feeGrowth1Result.result as bigint).toString()

          // 计算 TVL（简化版本，假设 token 价格为 $1）
          // 实际项目中需要从价格预言机或 API 获取真实价格
          const token0Value = parseFloat(token0Balance) * 1 // 假设价格为 $1
          const token1Value = parseFloat(token1Balance) * 1 // 假设价格为 $1
          const tvlUSD = token0Value + token1Value

          // 基于费用增长估算交易量（简化算法）
          // 实际项目中需要监听事件或使用专门的交易量计算
          const totalFeeGrowth = Number(feeGrowthGlobal0X128) + Number(feeGrowthGlobal1X128)
          const maxBigInt = Number(BigInt('0xffffffffffffffffffffffffffffffff')) // 2^128 - 1 的近似值
          const estimatedVolumeMultiplier = Math.max(1, totalFeeGrowth / maxBigInt)
          const volumeUSD = tvlUSD * 0.1 * estimatedVolumeMultiplier // 简化计算

          // 估算累计费用收入
          const feesUSD = volumeUSD * 0.003 // 假设平均费率 0.3%

          setPoolData({
            poolAddress,
            token0Balance,
            token1Balance,
            feeGrowthGlobal0X128,
            feeGrowthGlobal1X128,
            tvlUSD,
            volumeUSD,
            feesUSD,
          })
          setError(null)
        } else {
          throw new Error('部分合约调用失败')
        }
      } catch (err) {
        console.error('处理池子数据时出错:', err)
        setError('处理池子数据失败')
      }
    } else if (contractError) {
      console.error('获取池子数据出错:', contractError)
      setError('获取池子数据失败')
    }
    
    // 修复无限循环 - 只在loading状态真正变化时更新
    setLoading(prevLoading => prevLoading !== isLoading ? isLoading : prevLoading)
  }, [contractData, isLoading, contractError, poolAddress, token0Info.decimals, token1Info.decimals])

  return {
    poolData,
    loading,
    error,
  }
}

// 用于多个池子的批量数据获取
export const useMultiplePoolsData = (pools: Array<{ pool: string; token0: string; token1: string }>) => {
  const [poolsData, setPoolsData] = useState<Record<string, PoolData>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 创建稳定的pools标识符，避免数组引用变化导致的重新渲染
  const poolsKey = JSON.stringify(pools.map(p => `${p.pool}-${p.token0}-${p.token1}`).sort())

  // 为所有池子构建合约调用
  const contracts = pools.flatMap(({ pool, token0, token1 }) => [
    // Token0 余额
    {
      address: token0 as `0x${string}`,
      abi: contractConfig.erc20.abi,
      functionName: 'balanceOf',
      args: [pool as `0x${string}`],
    },
    // Token1 余额
    {
      address: token1 as `0x${string}`,
      abi: contractConfig.erc20.abi,
      functionName: 'balanceOf',
      args: [pool as `0x${string}`],
    },
    // 费用增长 0
    {
      address: pool as `0x${string}`,
      abi: contractConfig.pool.abi,
      functionName: 'feeGrowthGlobal0X128',
    },
    // 费用增长 1
    {
      address: pool as `0x${string}`,
      abi: contractConfig.pool.abi,
      functionName: 'feeGrowthGlobal1X128',
    },
  ])

  const { data: contractData, isLoading, error: contractError } = useReadContracts({
    contracts,
    query: {
      enabled: pools.length > 0,
    },
  })

  useEffect(() => {
    if (contractData && contractData.length === pools.length * 4 && !isLoading) {
      try {
        const newPoolsData: Record<string, PoolData> = {}

        pools.forEach((poolInfo, index) => {
          const baseIndex = index * 4
          const results = contractData.slice(baseIndex, baseIndex + 4)

          if (results.every(result => result.status === 'success')) {
            const getTokenInfo = (address: string) => {
              const token = Object.values(TOKENS).find(
                t => t.address.toLowerCase() === address.toLowerCase()
              )
              return token || { symbol: 'UNKNOWN', name: 'Unknown Token', decimals: 18 }
            }

            const token0Info = getTokenInfo(poolInfo.token0)
            const token1Info = getTokenInfo(poolInfo.token1)

            const token0Balance = formatUnits(
              results[0].result as bigint,
              token0Info.decimals
            )
            const token1Balance = formatUnits(
              results[1].result as bigint,
              token1Info.decimals
            )

            const feeGrowthGlobal0X128 = (results[2].result as bigint).toString()
            const feeGrowthGlobal1X128 = (results[3].result as bigint).toString()

            // 计算价值（简化版本）
            const token0Value = parseFloat(token0Balance) * 1
            const token1Value = parseFloat(token1Balance) * 1
            const tvlUSD = token0Value + token1Value

            const totalFeeGrowth = Number(feeGrowthGlobal0X128) + Number(feeGrowthGlobal1X128)
            const maxBigInt = Number(BigInt('0xffffffffffffffffffffffffffffffff')) // 2^128 - 1 的近似值
            const estimatedVolumeMultiplier = Math.max(1, totalFeeGrowth / maxBigInt)
            const volumeUSD = tvlUSD * 0.1 * estimatedVolumeMultiplier
            const feesUSD = volumeUSD * 0.003

            newPoolsData[poolInfo.pool] = {
              poolAddress: poolInfo.pool,
              token0Balance,
              token1Balance,
              feeGrowthGlobal0X128,
              feeGrowthGlobal1X128,
              tvlUSD,
              volumeUSD,
              feesUSD,
            }
          }
        })

        setPoolsData(newPoolsData)
        setError(null)
      } catch (err) {
        console.error('处理多个池子数据时出错:', err)
        setError('处理池子数据失败')
      }
    } else if (contractError) {
      console.error('获取多个池子数据出错:', contractError)
      setError('获取池子数据失败')
    }
    
    // 修复无限循环 - 只在loading状态真正变化时更新
    setLoading(prevLoading => prevLoading !== isLoading ? isLoading : prevLoading)
  }, [contractData, isLoading, contractError, poolsKey]) // 使用poolsKey代替pools

  return {
    poolsData,
    loading,
    error,
  }
} 
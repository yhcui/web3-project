'use client'

import { useState, useEffect } from 'react'
import { useReadContract, useAccount } from 'wagmi'
import { formatUnits } from 'viem'
import { contractConfig } from '@/lib/contracts'
import { TOKENS } from '@/lib/constants'
// import { useMultiplePoolsData } from './usePoolData'

export interface PoolInfo {
  pool: string
  token0: string
  token1: string
  index: number
  fee: number
  liquidity: string
  sqrtPriceX96: string
  tick: number
  token0Symbol: string
  token1Symbol: string
  token0Name: string
  token1Name: string
  tvl: string
  volume24h: string
  pair: string
  feePercent: string
  token0Balance: string
  token1Balance: string
  tvlUSD: number
  volumeUSD: number
  feesUSD: number
}

interface RawPoolData {
  pool: string
  token0: string
  token1: string
  index: number
  fee: number
  liquidity: string | bigint
  sqrtPriceX96: string | bigint
  tick: number
}

export const usePools = () => {
  const { isConnected } = useAccount()
  const [pools, setPools] = useState<PoolInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 获取所有池子
  const { data: poolsData, isLoading: poolsLoading, error: poolsError } = useReadContract({
    ...contractConfig.poolManager,
    functionName: 'getAllPools',
    query: {
      enabled: isConnected,
    },
  })

  console.log('poolsData', poolsData)

  // 准备池子地址列表用于批量获取数据
  const poolAddresses = poolsData && Array.isArray(poolsData) 
    ? (poolsData as RawPoolData[]).map(pool => ({
        pool: pool.pool,
        token0: pool.token0,
        token1: pool.token1,
      }))
    : []

  // 获取所有池子的真实链上数据
  // const { poolsData: realPoolsData, loading: poolDataLoading, error: poolDataError } = useMultiplePoolsData(poolAddresses)

  // 处理池子数据
  useEffect(() => {
    if (poolsData && Array.isArray(poolsData)) {
      try {
        const processedPools = (poolsData as RawPoolData[]).map((pool) => {
          // 获取代币信息
          const getTokenInfo = (address: string) => {
            const token = Object.values(TOKENS).find(
              t => t.address.toLowerCase() === address.toLowerCase()
            )
            return token || { symbol: 'UNKNOWN', name: 'Unknown Token' }
          }

          const token0Info = getTokenInfo(pool.token0)
          const token1Info = getTokenInfo(pool.token1)

          // 格式化流动性
          const liquidity = formatUnits(BigInt(pool.liquidity || '0'), 18)

          // 计算费率百分比
          const feePercent = (pool.fee / 10000).toFixed(2) + '%'

          // 获取真实的链上数据
          // const realData = realPoolsData[pool.pool]
          
          let tvl = '$0'
          let volume24h = '$0'
          const token0Balance = '0'
          const token1Balance = '0'
          let tvlUSD = 0
          let volumeUSD = 0
          const feesUSD = 0

          // if (realData) {
          //   // 使用真实的链上数据
          //   tvlUSD = realData.tvlUSD
          //   volumeUSD = realData.volumeUSD
          //   feesUSD = realData.feesUSD
          //   token0Balance = realData.token0Balance
          //   token1Balance = realData.token1Balance

          //   // 格式化显示
          //   tvl = tvlUSD >= 1000000 
          //     ? `$${(tvlUSD / 1000000).toFixed(2)}M`
          //     : tvlUSD >= 1000
          //     ? `$${(tvlUSD / 1000).toFixed(2)}K`
          //     : `$${tvlUSD.toFixed(2)}`

          //   volume24h = volumeUSD >= 1000000
          //     ? `$${(volumeUSD / 1000000).toFixed(2)}M`
          //     : volumeUSD >= 1000
          //     ? `$${(volumeUSD / 1000).toFixed(2)}K`
          //     : `$${volumeUSD.toFixed(2)}`
          // } else 
          // if (!poolDataLoading) {
            // 如果没有获取到真实数据且不在加载中，使用模拟数据
            const mockTvl = (Math.random() * 500000 + 50000)
            const mockVolume = (Math.random() * 50000 + 5000)
            
            tvlUSD = mockTvl
            volumeUSD = mockVolume
            
            tvl = `$${mockTvl.toFixed(0)}`
            volume24h = `$${mockVolume.toFixed(0)}`
          // }

          return {
            pool: pool.pool,
            token0: pool.token0,
            token1: pool.token1,
            index: pool.index,
            fee: pool.fee,
            liquidity,
            sqrtPriceX96: pool.sqrtPriceX96?.toString() || '0',
            tick: pool.tick,
            token0Symbol: token0Info.symbol,
            token1Symbol: token1Info.symbol,
            token0Name: token0Info.name,
            token1Name: token1Info.name,
            tvl,
            volume24h,
            pair: `${token0Info.symbol}/${token1Info.symbol}`,
            feePercent,
            token0Balance,
            token1Balance,
            tvlUSD,
            volumeUSD,
            feesUSD,
          }
        })

        setPools(processedPools)
        setError(null)
      } catch (err) {
        console.error('处理池子数据时出错:', err)
        setError('处理池子数据失败')
      }
    }
    setLoading(poolsLoading)
  }, [poolsData, poolsLoading])

  // 处理错误
  useEffect(() => {
    if (poolsError) {
      console.error('获取池子数据出错:', poolsError)
      setError('获取池子数据失败')
      setLoading(false)
    }
  }, [poolsError])

  // 计算总计数据
  const totalStats = {
    totalPools: pools.length,
    totalTVL: pools.reduce((sum, pool) => sum + pool.tvlUSD, 0),
    totalVolume24h: pools.reduce((sum, pool) => sum + pool.volumeUSD, 0),
    totalFeesGenerated: pools.reduce((sum, pool) => sum + pool.feesUSD, 0),
  }

  return {
    pools,
    loading,
    error,
    totalStats,
    refetch: () => {
      setLoading(true)
      // 重新获取数据的逻辑会自动触发，因为 useReadContract 会监听变化
    },
  }
} 
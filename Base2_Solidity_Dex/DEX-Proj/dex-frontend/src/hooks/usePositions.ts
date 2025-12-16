'use client'

import { useState, useEffect } from 'react'
import { useReadContract, useAccount } from 'wagmi'
import { formatUnits } from 'viem'
import { contractConfig } from '@/lib/contracts'
import { TOKENS } from '@/lib/constants'

export interface PositionInfo {
  id: string
  owner: string
  token0: string
  token1: string
  index: number
  fee: number
  liquidity: string
  tickLower: number
  tickUpper: number
  tokensOwed0: string
  tokensOwed1: string
  feeGrowthInside0LastX128: string
  feeGrowthInside1LastX128: string
  // 计算得出的字段
  token0Symbol: string
  token1Symbol: string
  token0Name: string
  token1Name: string
  pair: string
  feePercent: string
  liquidityValue: string
  totalFeesValue: string
  status: 'in-range' | 'out-of-range'
  priceRange: string
}

interface RawPositionData {
  id: string | bigint
  owner: string
  token0: string
  token1: string
  index: number
  fee: number
  liquidity: string | bigint
  tickLower: number
  tickUpper: number
  tokensOwed0: string | bigint
  tokensOwed1: string | bigint
  feeGrowthInside0LastX128: string | bigint
  feeGrowthInside1LastX128: string | bigint
}

// Tick 转价格的简化计算（实际项目中需要使用精确的数学库）
const tickToPrice = (tick: number): number => {
  return Math.pow(1.0001, tick)
}

export const usePositions = () => {
  const { address, isConnected } = useAccount()
  const [positions, setPositions] = useState<PositionInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 获取所有头寸
  const { data: positionsData, isLoading: positionsLoading, error: positionsError } = useReadContract({
    ...contractConfig.positionManager,
    functionName: 'getAllPositions',
    query: {
      enabled: isConnected,
    },
  })

  // 处理头寸数据
  useEffect(() => {
    if (positionsData && Array.isArray(positionsData) && address) {
      try {
        const processedPositions = (positionsData as RawPositionData[])
          .filter((position) => position.owner.toLowerCase() === address.toLowerCase()) // 只显示当前用户的头寸
          .map((position) => {
            // 获取代币信息
            const getTokenInfo = (tokenAddress: string) => {
              const token = Object.values(TOKENS).find(
                t => t.address.toLowerCase() === tokenAddress.toLowerCase()
              )
              return token || { symbol: 'UNKNOWN', name: 'Unknown Token', decimals: 18 }
            }

            const token0Info = getTokenInfo(position.token0)
            const token1Info = getTokenInfo(position.token1)

            // 格式化流动性和费用
            const liquidity = formatUnits(BigInt(position.liquidity || '0'), 18)
            const tokensOwed0 = formatUnits(BigInt(position.tokensOwed0 || '0'), token0Info.decimals)
            const tokensOwed1 = formatUnits(BigInt(position.tokensOwed1 || '0'), token1Info.decimals)

            // 计算费率百分比
            const feePercent = (position.fee / 10000).toFixed(2) + '%'

            // 计算价格范围
            const priceLower = tickToPrice(position.tickLower)
            const priceUpper = tickToPrice(position.tickUpper)
            const priceRange = `${priceLower.toFixed(4)} - ${priceUpper.toFixed(4)}`

            // 判断是否在范围内（简化版本，实际需要获取当前池子价格）
            const status: 'in-range' | 'out-of-range' = parseFloat(liquidity) > 0 ? 'in-range' : 'out-of-range'

            // 模拟流动性价值（实际项目中需要从价格预言机获取）
            const liquidityValueNum = parseFloat(liquidity) * 1000 // 简化计算
            const liquidityValue = liquidityValueNum >= 1000 
              ? `$${(liquidityValueNum / 1000).toFixed(2)}K`
              : `$${liquidityValueNum.toFixed(2)}`

            // 计算总费用价值
            const totalFeesNum = parseFloat(tokensOwed0) + parseFloat(tokensOwed1)
            const totalFeesValue = `$${totalFeesNum.toFixed(2)}`

            return {
              id: position.id.toString(),
              owner: position.owner,
              token0: position.token0,
              token1: position.token1,
              index: position.index,
              fee: position.fee,
              liquidity,
              tickLower: position.tickLower,
              tickUpper: position.tickUpper,
              tokensOwed0,
              tokensOwed1,
              feeGrowthInside0LastX128: position.feeGrowthInside0LastX128.toString(),
              feeGrowthInside1LastX128: position.feeGrowthInside1LastX128.toString(),
              token0Symbol: token0Info.symbol,
              token1Symbol: token1Info.symbol,
              token0Name: token0Info.name,
              token1Name: token1Info.name,
              pair: `${token0Info.symbol}/${token1Info.symbol}`,
              feePercent,
              liquidityValue,
              totalFeesValue,
              status,
              priceRange,
            }
          })

        setPositions(processedPositions)
        setError(null)
      } catch (err) {
        console.error('处理头寸数据时出错:', err)
        setError('处理头寸数据失败')
      }
    } else if (!address) {
      setPositions([])
    }
    setLoading(positionsLoading)
  }, [positionsData, positionsLoading, address])

  // 处理错误
  useEffect(() => {
    if (positionsError) {
      console.error('获取头寸数据出错:', positionsError)
      setError('获取头寸数据失败')
      setLoading(false)
    }
  }, [positionsError])

  // 计算统计数据
  const stats = {
    activePositions: positions.filter(p => p.status === 'in-range').length,
    totalValue: positions.reduce((sum, position) => {
      const value = parseFloat(position.liquidityValue.replace(/[$,K]/g, ''))
      return sum + (position.liquidityValue.includes('K') ? value * 1000 : value)
    }, 0),
    totalUnclaimedFees: positions.reduce((sum, position) => {
      const fees = parseFloat(position.totalFeesValue.replace(/[$,]/g, ''))
      return sum + fees
    }, 0),
    totalReturn: 0, // 简化版本，实际需要复杂计算
  }

  return {
    positions,
    loading,
    error,
    stats,
    refetch: () => {
      setLoading(true)
      // 重新获取数据的逻辑会自动触发，因为 useReadContract 会监听变化
    },
  }
} 
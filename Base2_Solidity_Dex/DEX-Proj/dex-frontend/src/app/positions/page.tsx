'use client'

import { usePositions } from '@/hooks/usePositions'
import { useAccount } from 'wagmi'
import { formatNumber } from '@/lib/utils'
import { NetworkChecker } from '@/components/NetworkChecker'
import { Loader2, Droplets, Plus, TrendingUp, TrendingDown } from 'lucide-react'

export default function PositionsPage() {
  const { isConnected } = useAccount()
  const { positions, loading, error, stats, refetch } = usePositions()

  // 格式化货币值
  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`
    }
    return `$${value.toFixed(2)}`
  }

  return (
    <div className="max-w-6xl mx-auto">
      <NetworkChecker>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">我的头寸</h1>
          <p className="text-gray-600">
            管理您的流动性头寸，查看收益和费用收入。
          </p>
        </div>

        {/* Position Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg border">
            <div className="text-2xl font-bold text-gray-900">
              {loading ? (
                <div className="flex items-center">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  -
                </div>
              ) : (
                stats.activePositions
              )}
            </div>
            <div className="text-sm text-gray-600">活跃头寸</div>
          </div>
          <div className="bg-white p-6 rounded-lg border">
            <div className="text-2xl font-bold text-gray-900">
              {loading ? (
                <div className="flex items-center">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  -
                </div>
              ) : (
                formatCurrency(stats.totalValue)
              )}
            </div>
            <div className="text-sm text-gray-600">总价值</div>
          </div>
          <div className="bg-white p-6 rounded-lg border">
            <div className="text-2xl font-bold text-gray-900">
              {loading ? (
                <div className="flex items-center">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  -
                </div>
              ) : (
                formatCurrency(stats.totalUnclaimedFees)
              )}
            </div>
            <div className="text-sm text-gray-600">未领取费用</div>
          </div>
          <div className="bg-white p-6 rounded-lg border">
            <div className="text-2xl font-bold text-gray-900">
              {loading ? (
                <div className="flex items-center">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  -
                </div>
              ) : (
                `+${stats.totalReturn.toFixed(2)}%`
              )}
            </div>
            <div className="text-sm text-gray-600">总收益率</div>
          </div>
        </div>

        {/* Positions List */}
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">我的头寸</h2>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2">
                <Plus className="h-4 w-4" />
                新建头寸
              </button>
            </div>
          </div>

          {!isConnected ? (
            <div className="p-12 text-center">
              <Droplets className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">请连接钱包</h3>
              <p className="text-gray-600">连接钱包以查看您的流动性头寸</p>
            </div>
          ) : error ? (
            <div className="p-12 text-center">
              <div className="text-red-500 text-lg font-medium mb-2">加载失败</div>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={refetch}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                重新加载
              </button>
            </div>
          ) : loading ? (
            <div className="p-12 text-center">
              <Loader2 className="h-8 w-8 text-blue-600 mx-auto mb-4 animate-spin" />
              <p className="text-gray-600">正在加载头寸数据...</p>
            </div>
          ) : positions.length === 0 ? (
            <div className="p-12 text-center">
              <Droplets className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">暂无流动性头寸</h3>
              <p className="text-gray-600 mb-4">
                开始提供流动性来赚取交易费用
              </p>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors inline-flex items-center gap-2">
                <Plus className="h-4 w-4" />
                新建头寸
              </button>
            </div>
          ) : (
            <div className="p-6">
              <div className="space-y-4">
                {positions.map((position) => (
                  <div key={position.id} className="border rounded-lg p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex -space-x-2">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center border-2 border-white">
                            <span className="text-white text-sm font-bold">{position.token0Symbol.charAt(0)}</span>
                          </div>
                          <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center border-2 border-white">
                            <span className="text-white text-sm font-bold">{position.token1Symbol.charAt(0)}</span>
                          </div>
                        </div>
                        <div>
                          <div className="font-semibold text-lg">{position.pair}</div>
                          <div className="text-sm text-gray-600">费率: {position.feePercent} | ID: #{position.id}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 ${
                          position.status === 'in-range' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {position.status === 'in-range' ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : (
                            <TrendingDown className="h-3 w-3" />
                          )}
                          {position.status === 'in-range' ? '范围内' : '范围外'}
                        </span>
                        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                          管理
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                      <div>
                        <div className="text-gray-600">价格范围</div>
                        <div className="font-medium">{position.priceRange}</div>
                      </div>
                      <div>
                        <div className="text-gray-600">流动性</div>
                        <div className="font-medium">{position.liquidityValue}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {formatNumber(parseFloat(position.liquidity))} LP
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-600">未领取费用</div>
                        <div className="font-medium text-green-600">{position.totalFeesValue}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {parseFloat(position.tokensOwed0).toFixed(4)} {position.token0Symbol} + {parseFloat(position.tokensOwed1).toFixed(4)} {position.token1Symbol}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-600">Tick 范围</div>
                        <div className="font-medium text-xs">
                          {position.tickLower} - {position.tickUpper}
                        </div>
                      </div>
                      <div className="flex flex-col space-y-2">
                        <button className="text-blue-600 hover:text-blue-800 text-xs px-2 py-1 border border-blue-200 rounded">
                          增加流动性
                        </button>
                        <button className="text-red-600 hover:text-red-800 text-xs px-2 py-1 border border-red-200 rounded">
                          移除流动性
                        </button>
                        <button className="text-green-600 hover:text-green-800 text-xs px-2 py-1 border border-green-200 rounded">
                          领取费用
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </NetworkChecker>
    </div>
  )
} 
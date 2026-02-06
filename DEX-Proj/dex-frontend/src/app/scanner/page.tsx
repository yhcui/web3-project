'use client';

import { useState, useEffect } from 'react';

interface SwapData {
  id: string;
  transaction_hash: string;
  block_number: string;
  block_timestamp: string;
  pool_address: string;
  sender: string;
  recipient: string;
  token_in: string;
  token_out: string;
  amount_in: string;
  amount_out: string;
  token_in_symbol: string;
  token_out_symbol: string;
  token_in_decimals: number;
  token_out_decimals: number;
  pool_fee: string;
}

interface StatsData {
  total_swaps: number;
  total_pools: number;
  total_liquidity_changes: number;
  unique_traders: number;
  daily_volume: string;
  daily_trades: number;
}

interface PoolData {
  id: string;
  pool_address: string;
  token0: string;
  token1: string;
  fee: string;
  token0_symbol: string;
  token1_symbol: string;
  token0_name: string;
  token1_name: string;
  total_swaps: number;
  total_volume: string;
  created_timestamp: string;
}

export default function ScannerPage() {
  const [activeTab, setActiveTab] = useState<'stats' | 'swaps' | 'pools'>('stats');
  const [stats, setStats] = useState<StatsData | null>(null);
  const [swaps, setSwaps] = useState<SwapData[]>([]);
  const [pools, setPools] = useState<PoolData[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // 获取统计数据
  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/scanner?action=stats');
      const result = await response.json();
      if (result.success) {
        setStats(result.data);
      }
    } catch (error) {
      console.error('获取统计数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 获取交易数据
  const fetchSwaps = async (page = 1) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/scanner?action=swaps&page=${page}&limit=20`);
      const result = await response.json();
      if (result.success) {
        setSwaps(result.data.swaps);
      }
    } catch (error) {
      console.error('获取交易数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 获取池子数据
  const fetchPools = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/scanner?action=pools');
      const result = await response.json();
      if (result.success) {
        setPools(result.data);
      }
    } catch (error) {
      console.error('获取池子数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 格式化大数字
  const formatBigNumber = (value: string, decimals: number = 18) => {
    if (!value) return '0';
    const num = BigInt(value);
    const divisor = BigInt(10 ** decimals);
    const result = Number(num) / Number(divisor);
    return result.toLocaleString(undefined, { maximumFractionDigits: 6 });
  };

  // 格式化地址
  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // 格式化时间
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('zh-CN');
  };

  useEffect(() => {
    if (activeTab === 'stats') {
      fetchStats();
    } else if (activeTab === 'swaps') {
      fetchSwaps(currentPage);
    } else if (activeTab === 'pools') {
      fetchPools();
    }
  }, [activeTab, currentPage]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">区块链扫描器</h1>
        
        {/* 标签页导航 */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            {[
              { key: 'stats', label: '统计概览' },
              { key: 'swaps', label: '交易记录' },
              { key: 'pools', label: '流动性池' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {loading && (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* 统计概览 */}
        {activeTab === 'stats' && stats && !loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">总交易数</h3>
              <p className="text-3xl font-bold text-blue-600">{stats.total_swaps.toLocaleString()}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">流动性池数</h3>
              <p className="text-3xl font-bold text-green-600">{stats.total_pools.toLocaleString()}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">独立交易者</h3>
              <p className="text-3xl font-bold text-purple-600">{stats.unique_traders.toLocaleString()}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">今日交易量</h3>
              <p className="text-3xl font-bold text-orange-600">
                {stats.daily_volume ? formatBigNumber(stats.daily_volume) : '0'}
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">今日交易次数</h3>
              <p className="text-3xl font-bold text-red-600">{stats.daily_trades.toLocaleString()}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">流动性变更</h3>
              <p className="text-3xl font-bold text-indigo-600">{stats.total_liquidity_changes.toLocaleString()}</p>
            </div>
          </div>
        )}

        {/* 交易记录 */}
        {activeTab === 'swaps' && !loading && (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      交易哈希
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      时间
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      交易对
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      输入数量
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      输出数量
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      发送者
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {swaps.map((swap) => (
                    <tr key={swap.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                        <a
                          href={`https://sepolia.etherscan.io/tx/${swap.transaction_hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          {formatAddress(swap.transaction_hash)}
                        </a>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatTime(swap.block_timestamp)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {swap.token_in_symbol} → {swap.token_out_symbol}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatBigNumber(swap.amount_in, swap.token_in_decimals)} {swap.token_in_symbol}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatBigNumber(swap.amount_out, swap.token_out_decimals)} {swap.token_out_symbol}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatAddress(swap.sender)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 流动性池 */}
        {activeTab === 'pools' && !loading && (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      池子地址
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      交易对
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      手续费
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      交易次数
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      总交易量
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      创建时间
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pools.map((pool) => (
                    <tr key={pool.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                        <a
                          href={`https://sepolia.etherscan.io/address/${pool.pool_address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          {formatAddress(pool.pool_address)}
                        </a>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {pool.token0_symbol} / {pool.token1_symbol}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {(parseInt(pool.fee) / 10000).toFixed(2)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {pool.total_swaps.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {pool.total_volume ? formatBigNumber(pool.total_volume) : '0'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatTime(pool.created_timestamp)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 
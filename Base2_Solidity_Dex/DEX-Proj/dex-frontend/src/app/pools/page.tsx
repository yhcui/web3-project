"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { formatNumber } from "@/lib/utils";
import { NetworkChecker } from "@/components/NetworkChecker";
import { CreatePoolModal } from "@/components/pools/CreatePoolModal";
import {
  Loader2,
  Droplets,
  Plus,
  TrendingUp,
  DollarSign,
  Activity,
  Zap,
} from "lucide-react";
import Image from "next/image";

// Interface based on API response
interface PoolData {
  pool: string;
  token0: string;
  token1: string;
  token0Symbol: string;
  token1Symbol: string;
  token0Decimals: number;
  token1Decimals: number;
  fee: number;
  feePercent: string;
  liquidity: string;
  sqrtPriceX96: string;
  tick: number;
  tvl: string;
  tvlUSD: number;
  volume24h: string;
  feesUSD: number;
  pair: string;
  index: number;
  token0Balance: string;
  token1Balance: string;
}

import { useRouter } from "next/navigation";

export default function PoolsPage() {
  const { isConnected } = useAccount();
  const router = useRouter();
  const [pools, setPools] = useState<PoolData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [totalStats, setTotalStats] = useState({
    totalPools: 0,
    totalTVL: 0,
    totalVolume24h: 0,
    totalFeesGenerated: 0,
  });

  const fetchPools = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/pools");
      if (!response.ok) {
        throw new Error("Failed to fetch pools");
      }
      const data = await response.json();
      setPools(data.data);
      setTotalStats({
        totalPools: data.pagination.total || 0,
        totalTVL: data.data.reduce(
          (acc: number, pool: PoolData) => acc + pool.tvlUSD,
          0
        ),
        totalVolume24h: 0, // Placeholder
        totalFeesGenerated: 0, // Placeholder
      });
    } catch (err) {
      console.error("Error loading pools:", err);
      setError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPools();
  }, []);

  // 格式化大数字
  const formatLargeNumber = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(2)}K`;
    }
    return `$${value.toFixed(2)}`;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <NetworkChecker>
        <div className="mb-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Pool</h1>
          <div className="flex items-center space-x-2">
            {/* Top right actions if needed, like settings or wallet */}
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              Add Pool
            </button>
          </div>
        </div>

        {/* Pools Table Card */}
        <div className="">

          {!isConnected ? (
            <div className="p-16 text-center">
              <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Droplets className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Please connect wallet
              </h3>
              <p className="text-gray-500">Connect wallet to view pool data</p>
            </div>
          ) : error ? (
            <div className="p-12 text-center">
              <div className="text-red-500 text-lg font-medium mb-2">
                Loading Failed
              </div>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={fetchPools}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Reload
              </button>
            </div>
          ) : loading ? (
            <div className="p-24 text-center">
              <Loader2 className="h-8 w-8 text-blue-600 mx-auto mb-4 animate-spin" />
              <p className="text-gray-500">Loading pools...</p>
            </div>
          ) : pools.length === 0 ? (
            <div className="p-16 text-center">
              <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Droplets className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No pools found
              </h3>
              <p className="text-gray-500 mb-6">
                Be the first to provide liquidity!
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors inline-flex items-center gap-2 shadow-sm"
              >
                <Plus className="h-4 w-4" />
                Add Pool
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Token
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fee Tier
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      TVL
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Volume 24h
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      APR
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Liquidity
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-50">
                  {pools.map((pool) => (
                    <tr
                      key={pool.pool}
                      onClick={() => router.push(`/pools/${pool.pool}`)}
                      className="hover:bg-gray-50/80 transition-colors group cursor-pointer"
                    >
                      <td className="px-6 py-6 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex -space-x-2 mr-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center border-2 border-white shadow-sm text-white text-xs font-bold z-10">
                              {pool.token0Symbol.charAt(0)}
                            </div>
                            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center border-2 border-white shadow-sm text-white text-xs font-bold">
                              {pool.token1Symbol.charAt(0)}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900">
                              {pool.token0Symbol} / {pool.token1Symbol}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600">
                          {pool.feePercent}
                        </span>
                      </td>
                      <td className="px-6 py-6 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {pool.tvlUSD >= 1000
                            ? `$${formatNumber(pool.tvlUSD)}`
                            : `$${pool.tvlUSD.toFixed(2)}`}
                        </div>
                      </td>
                      <td className="px-6 py-6 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {pool.volume24h}
                        </div>
                      </td>
                      <td className="px-6 py-6 whitespace-nowrap">
                        <div className="text-sm text-green-600 flex items-center">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          --%
                        </div>
                      </td>
                      <td className="px-6 py-6 whitespace-nowrap">
                        <div className="text-sm text-gray-900 font-medium">
                          {formatNumber(parseFloat(pool.liquidity))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* Simple Pagination UI Placeholder */}
              <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 disabled:opacity-50"
                  disabled
                >
                  &lt;
                </button>
                <button className="px-3 py-1 rounded-lg bg-blue-50 text-blue-600 font-medium text-sm">
                  1
                </button>
                <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
                  &gt;
                </button>
                <span className="text-sm text-gray-500 ml-2">10 / page</span>
              </div>
            </div>
          )}
        </div>

        {/* Create Pool Modal */}
        <CreatePoolModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
        />
      </NetworkChecker>
    </div>
  );
}

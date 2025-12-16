"use client";

import { useState, useEffect } from "react";
import { formatUnits } from "viem";
import { ArrowLeft, ArrowRightLeft, Clock, Activity, DollarSign, Layers } from "lucide-react";
import Link from "next/link";
import { formatNumber } from "@/lib/utils";

interface PoolDetailProps {
  address: string;
}

interface PoolData {
  pool: string;
  token0: string;
  token1: string;
  token0Symbol: string;
  token1Symbol: string;
  token0Name: string;
  token1Name: string;
  token0Decimals: number;
  token1Decimals: number;
  fee: number;
  feePercent: string;
  liquidity: string;
  sqrtPriceX96: string;
  tick: number;
  tickLower: number;
  tickUpper: number;
  createdAt: string;
}

interface SwapData {
  transaction_hash: string;
  log_index: number;
  pool_address: string;
  sender: string;
  recipient: string;
  amount0: string;
  amount1: string;
  sqrt_price_x96: string;
  liquidity: string;
  tick: number;
  block_number: number;
  block_timestamp: string;
}

export default function PoolDetailClient({ address }: PoolDetailProps) {
  const [pool, setPool] = useState<PoolData | null>(null);
  const [swaps, setSwaps] = useState<SwapData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch pool info
        const poolRes = await fetch(`/api/pools/${address}`);
        if (!poolRes.ok) throw new Error("Failed to fetch pool data");
        const poolJson = await poolRes.json();
        setPool(poolJson.data);

        // Fetch swaps
        const swapsRes = await fetch(`/api/pools/${address}/swaps`);
        if (!swapsRes.ok) throw new Error("Failed to fetch swaps");
        const swapsJson = await swapsRes.json();
        setSwaps(swapsJson.data);
      } catch (err) {
        console.error(err);
        setError("Failed to load pool details");
      } finally {
        setLoading(false);
      }
    };

    if (address) {
      fetchData();
    }
  }, [address]);

  // Calculate prices
  const calculatePrices = () => {
    if (!pool) return { price0: "0", price1: "0", minPrice: "0", maxPrice: "0" };

    // Price of Token0 in terms of Token1
    const sqrtPriceX96 = BigInt(pool.sqrtPriceX96);
    const two96 = BigInt(2) ** BigInt(96);
    // Use Number for display precision (be careful with precision loss)
    const priceRatio = Number(sqrtPriceX96) / Number(two96);
    const priceRaw = priceRatio * priceRatio;
    
    // Adjust for decimals
    const decimalDiff = pool.token0Decimals - pool.token1Decimals;
    const priceAdjusted = priceRaw * (10 ** decimalDiff);

    // Calculate Min/Max Price from ticks
    const getPriceFromTick = (tick: number) => {
      const p = 1.0001 ** tick;
      return p * (10 ** decimalDiff);
    };

    return {
      currentPrice: priceAdjusted,
      minPrice: getPriceFromTick(pool.tickLower),
      maxPrice: getPriceFromTick(pool.tickUpper),
    };
  };

  const { currentPrice, minPrice, maxPrice } = calculatePrices();

  // Helper to format address
  const shortenAddress = (addr: string) => {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !pool) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Error</h2>
        <p className="text-gray-600 mb-4">{error || "Pool not found"}</p>
        <Link href="/pools" className="text-blue-600 hover:underline">
          Back to Pools
        </Link>
      </div>
    );
  }

  // Calculate position in range (0-100%)
  const rangeProgress = Math.max(0, Math.min(100, 
    ((Math.log(currentPrice) - Math.log(Number(minPrice))) / 
    (Math.log(Number(maxPrice)) - Math.log(Number(minPrice)))) * 100
  ));

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link 
          href="/pools" 
          className="inline-flex items-center text-gray-500 hover:text-gray-700 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Pools
        </Link>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="flex -space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center border-2 border-white text-white font-bold shadow-sm">
                {pool.token0Symbol[0]}
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center border-2 border-white text-white font-bold shadow-sm">
                {pool.token1Symbol[0]}
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                {pool.token0Symbol} / {pool.token1Symbol}
                <span className="px-2 py-1 bg-gray-100 rounded-lg text-sm font-medium text-gray-600">
                  {pool.feePercent}
                </span>
              </h1>
              <div className="text-sm text-gray-500 flex gap-2">
                 <span>{pool.token0Name}</span>
                 <span>•</span>
                 <span>{pool.token1Name}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
             <Link 
               href={`/liquidity?pool=${pool.pool}`}
               className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
             >
               Add Liquidity
             </Link>
             <Link
               href={`/?tokenIn=${pool.token0}&tokenOut=${pool.token1}`}
               className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors"
             >
               Swap
             </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Stats & Chart */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Main Stats Card */}
          <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               <div className="col-span-1 md:col-span-2 lg:col-span-1">
                 <div className="text-sm text-gray-500 mb-1">Current Price</div>
                 <div className="text-2xl font-bold text-gray-900 break-words">
                   1 {pool.token0Symbol} = {formatNumber(Number(currentPrice))} {pool.token1Symbol}
                 </div>
                 <div className="text-sm text-gray-400 mt-1">
                   1 {pool.token1Symbol} = {formatNumber(1 / Number(currentPrice))} {pool.token0Symbol}
                 </div>
               </div>
               <div>
                  <div className="text-sm text-gray-500 mb-1">Liquidity</div>
                  <div className="text-2xl font-bold text-gray-900 break-all">
                    {formatNumber(Number(pool.liquidity))}
                  </div>
               </div>
               <div>
                  <div className="text-sm text-gray-500 mb-1">Current Tick</div>
                  <div className="text-2xl font-bold text-gray-900 break-all">
                    {pool.tick}
                  </div>
               </div>
             </div>
          </div>

          {/* Range Visualization (Depth-like) */}
          <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Layers className="w-5 h-5 text-gray-500" />
              Liquidity Range
            </h3>
            
            <div className="relative pt-8 pb-4 px-4">
              {/* Range Bar */}
              <div className="h-4 bg-gray-100 rounded-full w-full overflow-hidden flex relative">
                 {/* Active Range Highlight */}
                 <div className="absolute top-0 bottom-0 left-0 right-0 bg-blue-100 rounded-full border border-blue-200"></div>
                 
                 {/* Current Price Marker */}
                 <div 
                   className="absolute top-0 bottom-0 w-1 bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.5)]"
                   style={{ left: `${rangeProgress}%` }}
                 ></div>
              </div>

              {/* Labels */}
              <div className="flex justify-between mt-4 text-sm">
                <div className="text-left">
                  <div className="text-gray-500">Min Price</div>
                  <div className="font-medium">{formatNumber(Number(minPrice))}</div>
                </div>
                
                <div className="text-center absolute left-1/2 -translate-x-1/2 -top-1">
                   <div className="bg-blue-600 text-white text-xs px-2 py-1 rounded mb-1">Current Price</div>
                   <div className="font-bold text-blue-600">{formatNumber(Number(currentPrice))}</div>
                </div>

                <div className="text-right">
                  <div className="text-gray-500">Max Price</div>
                  <div className="font-medium">{formatNumber(Number(maxPrice))}</div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
                This pool provides liquidity in the price range of <strong>{formatNumber(Number(minPrice))}</strong> to <strong>{formatNumber(Number(maxPrice))}</strong> {pool.token1Symbol} per {pool.token0Symbol}.
                <br />
                Currently, the price is {rangeProgress >= 0 && rangeProgress <= 100 ? "within" : "outside"} the active range.
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Pool Details */}
        <div className="space-y-6">
           <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
             <h3 className="text-lg font-bold text-gray-900 mb-4">Pool Details</h3>
             <div className="space-y-4">
               <div className="flex justify-between">
                 <span className="text-gray-500">Pool Address</span>
                 <span className="font-mono text-sm">{shortenAddress(pool.pool)}</span>
               </div>
               <div className="flex justify-between">
                 <span className="text-gray-500">Token 0</span>
                 <a href={`https://sepolia.etherscan.io/token/${pool.token0}`} target="_blank" className="text-blue-600 hover:underline text-sm flex items-center">
                    {pool.token0Symbol} <span className="ml-1 text-xs text-gray-400">({shortenAddress(pool.token0)})</span>
                 </a>
               </div>
               <div className="flex justify-between">
                 <span className="text-gray-500">Token 1</span>
                 <a href={`https://sepolia.etherscan.io/token/${pool.token1}`} target="_blank" className="text-blue-600 hover:underline text-sm flex items-center">
                    {pool.token1Symbol} <span className="ml-1 text-xs text-gray-400">({shortenAddress(pool.token1)})</span>
                 </a>
               </div>
               <div className="flex justify-between">
                 <span className="text-gray-500">Fee Tier</span>
                 <span className="font-medium">{pool.feePercent}</span>
               </div>
               <div className="flex justify-between">
                 <span className="text-gray-500">Created At</span>
                 <span className="text-sm">{new Date(pool.createdAt).toLocaleDateString()}</span>
               </div>
             </div>
           </div>
        </div>
      </div>

      {/* Transactions Section */}
      <div className="mt-8">
         <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-gray-500" />
            Recent Transactions
         </h3>
         
         <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
           {swaps.length === 0 ? (
             <div className="p-8 text-center text-gray-500">
               No transactions found for this pool.
             </div>
           ) : (
             <div className="overflow-x-auto">
               <table className="w-full">
                 <thead className="bg-gray-50 border-b border-gray-100">
                   <tr>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Value</th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Token Amount</th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Token Amount</th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100">
                   {swaps.map((swap) => {
                     // Determine direction:
                     // amount0 < 0 => Pool outputs Token0 => User buys Token0
                     // amount0 > 0 => Pool inputs Token0 => User sells Token0
                     const amount0Big = BigInt(swap.amount0);
                     const isBuyToken0 = amount0Big < 0;
                     
                     const amount0Abs = amount0Big < 0 ? -amount0Big : amount0Big;
                     const amount1Big = BigInt(swap.amount1);
                     const amount1Abs = amount1Big < 0 ? -amount1Big : amount1Big;

                     const amount0 = formatUnits(amount0Abs, pool.token0Decimals);
                     const amount1 = formatUnits(amount1Abs, pool.token1Decimals);
                     
                     return (
                       <tr key={`${swap.transaction_hash}-${swap.log_index}`} className="hover:bg-gray-50/50">
                         <td className="px-6 py-4 whitespace-nowrap">
                           <a 
                             href={`https://sepolia.etherscan.io/tx/${swap.transaction_hash}`}
                             target="_blank"
                             className="text-blue-600 hover:underline text-sm font-medium"
                           >
                             <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                               isBuyToken0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                             }`}>
                               {isBuyToken0 ? `Buy ${pool.token0Symbol}` : `Sell ${pool.token0Symbol}`}
                             </span>
                           </a>
                         </td>
                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                           {/* Placeholder for USD value */}
                           -
                         </td>
                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                           {parseFloat(amount0).toFixed(4)} {pool.token0Symbol}
                         </td>
                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                           {parseFloat(amount1).toFixed(4)} {pool.token1Symbol}
                         </td>
                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                           {new Date(swap.block_timestamp).toLocaleString()}
                         </td>
                       </tr>
                     );
                   })}
                 </tbody>
               </table>
             </div>
           )}
         </div>
      </div>
    </div>
  );
}


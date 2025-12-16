import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createPublicClient, http, parseAbi } from 'viem';
import { sepolia } from 'viem/chains';

const client = createPublicClient({
  chain: sepolia,
  transport: http(process.env.NEXT_PUBLIC_INFURA_URL || 'https://rpc.sepolia.org')
});

const QUOTER_ABI = parseAbi([
  'function quoteExactInput(ExactInputParams params) external returns (uint256 amountOut)',
  'struct ExactInputParams { address tokenIn; address tokenOut; uint32[] indexPath; uint256 amountIn; uint160 sqrtPriceLimitX96; }'
]);

// Helper to find the best pool for a pair
async function findBestPool(tokenIn: string, tokenOut: string) {
  // Normalize addresses to lowercase for consistent querying
  const tIn = tokenIn.toLowerCase();
  const tOut = tokenOut.toLowerCase();

  // Query Supabase for pools containing both tokens
  // We use ilike or simple lowercase comparison if DB stores lowercase
  // Assuming DB stores addresses as they came from event (could be checksummed or not).
  // Safest is to try multiple combinations or use ILIKE if supabase supports it easily in this syntax.
  
  // Let's use `or` with explicit cases.
  // Note: RPC filters might handle case, but postgrest is case sensitive by default unless using ilike.
  // However, simpler to just fetch pools that match one token and filter in code if volume is low, 
  // OR rely on correct data ingestion (usually lowercased).
  
  // Let's try raw SQL-like filter if possible, or just exact match assuming stored as checksummed?
  // Let's try standard query.
  
  const { data: pools, error } = await supabase
    .from('pools')
    .select('address, fee, liquidity, token0, token1, sqrt_price_x96') // Fetch all needed fields here
    .or(`and(token0.ilike.${tIn},token1.ilike.${tOut}),and(token0.ilike.${tOut},token1.ilike.${tIn})`)
    .order('liquidity', { ascending: false })
    .limit(1);

  if (error) {
      console.error("Supabase pool query error:", error);
      return null;
  }

  if (!pools || pools.length === 0) {
    return null;
  }

  return pools[0];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tokenIn, tokenOut, amountIn } = body;
    // Fallback to hardcoded address if env var is missing (just for debugging/demo purposes, though env is preferred)
    const swapRouterAddress = process.env.NEXT_PUBLIC_SWAP_ROUTER_ADDRESS || '0xD2c220143F5784b3bD84ae12747d97C8A36CeCB2'; // From config.yaml

    if (!tokenIn || !tokenOut || !amountIn || !swapRouterAddress) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // 1. Find the best pool
    // Ensure tokens are checksummed or lowercased consistently for DB query
    // Supabase lookup uses exact string match unless configured otherwise.
    // Let's try both original and lowercase
    
    const pool = await findBestPool(tokenIn, tokenOut);
    
    // Debugging: Log what we are looking for if not found
    if (!pool) {
       console.log(`No pool found for ${tokenIn} <-> ${tokenOut}`);
       // Try fetching ALL pools to see what's available (for debugging purposes only)
       // Or return a helpful error
       return NextResponse.json({ error: `No pool found for pair ${tokenIn}-${tokenOut}` }, { status: 404 });
    }

    // 2. Call Quote
    // Instead of calling contract on-chain (which might fail if simulated without state overrides or if contract logic is complex/requires auth),
    // we can calculate locally using the pool state from DB.
    // Uniswap V3 calculation is complex (tick traversal), but if we assume simplified liquidity within current tick range
    // or just simplified x*y=k for V2 style (as user requested as fallback/alternative).
    // However, V3 is NOT x*y=k over the whole range, but within a tick it behaves like that with virtual reserves.
    
    // Let's implement a simplified calculation based on current sqrtPriceX96 and Liquidity.
    // Formula:
    // Delta amount1 = amount0 * price (roughly)
    // Precise V3 Swap Math:
    // If zeroForOne (token0 -> token1):
    //   price goes down.
    //   nextSqrtPrice = liquidity / (liquidity / sqrtPrice + amountIn)
    //   amountOut = liquidity * (sqrtPrice - nextSqrtPrice)
    // If oneForZero (token1 -> token0):
    //   price goes up.
    //   nextSqrtPrice = sqrtPrice + amountIn / liquidity
    //   amountOut = liquidity * (1/sqrtPrice - 1/nextSqrtPrice)
    
    // Note: These formulas ignore fees and tick crossing. 
    // For a simple estimation without tick crossing, this is "good enough" for small amounts.
    
    // Parse Pool State
    const liquidity = BigInt(pool.liquidity);
    const sqrtPriceX96 = BigInt(pool.sqrt_price_x96 || 0);
    const feePips = BigInt(pool.fee); // e.g. 3000 for 0.3%
    
    if (liquidity === 0n || sqrtPriceX96 === 0n) {
        return NextResponse.json({ error: 'Pool has no liquidity' }, { status: 400 });
    }

    const amountInBigInt = BigInt(amountIn);
    
    // Deduct fee first
    // amountInWithFee = amountIn * (1 - fee)
    // In basis points: amountIn * (1e6 - fee) / 1e6
    const feeMultiplier = 1000000n - feePips;
    const amountInAfterFee = (amountInBigInt * feeMultiplier) / 1000000n;
    
    const zeroForOne = tokenIn.toLowerCase() < tokenOut.toLowerCase(); 
    // Note: token0 is the smaller address.
    // If tokenIn < tokenOut, then tokenIn is token0. We are swapping token0 -> token1 (zeroForOne = true)
    // Check DB pool token0/token1 just to be safe, but usually sorted.
    // Let's verify against pool data if available, but findBestPool sorted query implies we matched one.
    // We need to know which is token0.
    
    // Re-fetch pool with token addresses to be sure
    // findBestPool returns address, fee, liquidity. Let's add token0, token1 to selection.
    
    let calcAmountOut = 0n;
    
    // We need to know if tokenIn is token0
    // poolData is already fetched in findBestPool
    const poolData = pool; 
        
    const isToken0 = tokenIn.toLowerCase() === poolData.token0.toLowerCase();
    const currentSqrtPriceX96 = BigInt(poolData.sqrt_price_x96 || 0);
    const Q96 = 2n ** 96n;

    // Check if price is zero (uninitialized pool)
    if (currentSqrtPriceX96 === 0n) {
         return NextResponse.json({ error: 'Pool price is zero' }, { status: 400 });
    }

    if (isToken0) {
        // zeroForOne: token0 -> token1
        // price decreases
        // nextSqrtPrice = liquidity * sqrtPrice / (liquidity + amountIn * sqrtPrice)
        // BE CAREFUL with overflow and precision.
        
        // Using formula from Uniswap V3 SwapMath (simplified):
        // amountOut = liquidity * (sqrtPrice - nextSqrtPrice)
        
        // nextSqrtPrice = (liquidity * sqrtPrice) / (liquidity + amount * sqrtPrice / Q96) 
        // ... wait simpler: 
        // L * (1/sqrtP_next - 1/sqrtP_current) = amountIn
        // => 1/sqrtP_next = amountIn/L + 1/sqrtP_current
        // => sqrtP_next = L / (amountIn + L/sqrtP_current) = L * sqrtP_current / (amountIn * sqrtP_current + L) ???
        // Let's use the nice math:
        // delta_y = x_in * price (approx)
        
        // Real math for single tick:
        // nextSqrtPrice = liquidity * sqrtPriceX96 / (liquidity + amountInAfterFee * sqrtPriceX96 / Q96)
        // But amountIn * sqrtPrice might overflow.
        
        // Let's use a simpler approach for "estimation" if we assume infinite liquidity (V2 style x*y=k)?
        // V2 style: x * y = k.
        // x = reserve0, y = reserve1.
        // We need reserves. V3 doesn't store reserves directly, only liquidity.
        // Reserve0 = liquidity / sqrtPrice
        // Reserve1 = liquidity * sqrtPrice
        
        // Calculate Virtual Reserves
        const reserve0 = (liquidity * Q96) / currentSqrtPriceX96;
        const reserve1 = (liquidity * currentSqrtPriceX96) / Q96;
        
        // standard V2 formula: dy = y * dx / (x + dx)
        const amountInWithFee = amountInAfterFee;
        calcAmountOut = (reserve1 * amountInWithFee) / (reserve0 + amountInWithFee);
        
    } else {
        // oneForZero: token1 -> token0
        // Calculate Virtual Reserves
        const reserve0 = (liquidity * Q96) / currentSqrtPriceX96;
        const reserve1 = (liquidity * currentSqrtPriceX96) / Q96;
        
        const amountInWithFee = amountInAfterFee;
        calcAmountOut = (reserve0 * amountInWithFee) / (reserve1 + amountInWithFee);
    }

    return NextResponse.json({ 
        amountOut: calcAmountOut.toString(),
        poolAddress: pool.address,
        success: true,
        simulated: true // Mark as simulated locally
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

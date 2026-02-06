import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const page = parseInt(searchParams.get('page') || '1');
    const offset = (page - 1) * limit;

    // Fetch pools with token information
    const { data: pools, error, count } = await supabase
      .from('pools')
      .select(`
        *,
        token0_data:tokens!token0(symbol, decimals),
        token1_data:tokens!token1(symbol, decimals)
      `, { count: 'exact' })
      .range(offset, offset + limit - 1)
      .order('liquidity', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Process and format data
    const formattedPools = pools.map((pool: any) => ({
      pool: pool.address,
      token0: pool.token0,
      token1: pool.token1,
      token0Symbol: pool.token0_data?.symbol || 'UNK',
      token1Symbol: pool.token1_data?.symbol || 'UNK',
      token0Decimals: pool.token0_data?.decimals || 18,
      token1Decimals: pool.token1_data?.decimals || 18,
      fee: pool.fee,
      feePercent: `${(pool.fee / 10000).toFixed(2)}%`,
      liquidity: pool.liquidity,
      sqrtPriceX96: pool.sqrt_price_x96,
      tick: pool.tick,
      // Calculate TVL, Volume, Fees - For now using placeholders or basic calculations
      // Ideally these should come from aggregated tables or real-time calculations
      tvl: '0', // TODO: Calculate from liquidity and price
      tvlUSD: 0, // TODO: Fetch price
      volume24h: '0', // TODO: Aggregate from swaps
      feesUSD: 0, // TODO: Aggregate from fees
      pair: `${pool.token0_data?.symbol || 'UNK'} / ${pool.token1_data?.symbol || 'UNK'}`,
      index: 0, // Use index if available in DB
      token0Balance: '0', // Needs on-chain call or indexer balance tracking
      token1Balance: '0',
    }));

    return NextResponse.json({
      data: formattedPools,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: count ? Math.ceil(count / limit) : 0
      }
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}


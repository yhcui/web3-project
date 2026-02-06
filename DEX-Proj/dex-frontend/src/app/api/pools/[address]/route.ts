import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  const { address } = await params;

  try {
    // Fetch pool details with token information
    const { data: pool, error } = await supabase
      .from('pools')
      .select(`
        *,
        token0_data:tokens!token0(symbol, decimals, name),
        token1_data:tokens!token1(symbol, decimals, name)
      `)
      .eq('address', address)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!pool) {
      return NextResponse.json({ error: 'Pool not found' }, { status: 404 });
    }

    // Format data
    const formattedPool = {
      pool: pool.address,
      token0: pool.token0,
      token1: pool.token1,
      token0Symbol: pool.token0_data?.symbol || 'UNK',
      token1Symbol: pool.token1_data?.symbol || 'UNK',
      token0Name: pool.token0_data?.name || 'Unknown Token',
      token1Name: pool.token1_data?.name || 'Unknown Token',
      token0Decimals: pool.token0_data?.decimals || 18,
      token1Decimals: pool.token1_data?.decimals || 18,
      fee: pool.fee,
      feePercent: `${(pool.fee / 10000).toFixed(2)}%`,
      liquidity: pool.liquidity,
      sqrtPriceX96: pool.sqrt_price_x96,
      tick: pool.tick,
      tickLower: pool.tick_lower,
      tickUpper: pool.tick_upper,
      createdAt: pool.created_at,
    };

    return NextResponse.json({ data: formattedPool });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}


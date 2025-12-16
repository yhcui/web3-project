import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/database';

// GET /api/scanner - 获取扫链统计数据
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    const connection = await getConnection();

    try {
      switch (action) {
        case 'stats':
          return await getStats(connection);
        case 'swaps':
          return await getSwaps(connection, searchParams);
        case 'liquidity':
          return await getLiquidityChanges(connection, searchParams);
        case 'pools':
          return await getPools(connection);
        case 'status':
          return await getScanStatus(connection);
        default:
          return NextResponse.json({ error: '无效的操作' }, { status: 400 });
      }
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('API 错误:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}

// 获取统计数据
async function getStats(connection: any) {
  const [statsRows] = await connection.execute(`
    SELECT 
      (SELECT COUNT(*) FROM swaps) as total_swaps,
      (SELECT COUNT(*) FROM pools) as total_pools,
      (SELECT COUNT(*) FROM liquidity_changes) as total_liquidity_changes,
      (SELECT COUNT(DISTINCT sender) FROM swaps) as unique_traders,
      (SELECT SUM(amount_in) FROM swaps WHERE DATE(block_timestamp) = CURDATE()) as daily_volume,
      (SELECT COUNT(*) FROM swaps WHERE DATE(block_timestamp) = CURDATE()) as daily_trades
  `);

  return NextResponse.json({
    success: true,
    data: statsRows[0]
  });
}

// 获取交易数据
async function getSwaps(connection: any, searchParams: URLSearchParams) {
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const poolAddress = searchParams.get('pool');
  const tokenIn = searchParams.get('token_in');
  const tokenOut = searchParams.get('token_out');
  const sender = searchParams.get('sender');
  
  const offset = (page - 1) * limit;
  
  let whereClause = '1=1';
  const params: any[] = [];
  
  if (poolAddress) {
    whereClause += ' AND s.pool_address = ?';
    params.push(poolAddress);
  }
  
  if (tokenIn) {
    whereClause += ' AND s.token_in = ?';
    params.push(tokenIn);
  }
  
  if (tokenOut) {
    whereClause += ' AND s.token_out = ?';
    params.push(tokenOut);
  }
  
  if (sender) {
    whereClause += ' AND s.sender = ?';
    params.push(sender);
  }

  const [rows] = await connection.execute(`
    SELECT 
      s.*,
      t1.symbol as token_in_symbol,
      t1.decimals as token_in_decimals,
      t2.symbol as token_out_symbol,
      t2.decimals as token_out_decimals,
      p.fee as pool_fee
    FROM swaps s
    LEFT JOIN tokens t1 ON s.token_in = t1.address
    LEFT JOIN tokens t2 ON s.token_out = t2.address
    LEFT JOIN pools p ON s.pool_address = p.pool_address
    WHERE ${whereClause}
    ORDER BY s.block_timestamp DESC
    LIMIT ? OFFSET ?
  `, [...params, limit, offset]);

  const [countRows] = await connection.execute(`
    SELECT COUNT(*) as total FROM swaps s WHERE ${whereClause}
  `, params);

  return NextResponse.json({
    success: true,
    data: {
      swaps: rows,
      pagination: {
        page,
        limit,
        total: countRows[0].total,
        pages: Math.ceil(countRows[0].total / limit)
      }
    }
  });
}

// 获取流动性变更数据
async function getLiquidityChanges(connection: any, searchParams: URLSearchParams) {
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const poolAddress = searchParams.get('pool');
  const owner = searchParams.get('owner');
  const changeType = searchParams.get('type');
  
  const offset = (page - 1) * limit;
  
  let whereClause = '1=1';
  const params: any[] = [];
  
  if (poolAddress) {
    whereClause += ' AND lc.pool_address = ?';
    params.push(poolAddress);
  }
  
  if (owner) {
    whereClause += ' AND lc.owner = ?';
    params.push(owner);
  }
  
  if (changeType) {
    whereClause += ' AND lc.change_type = ?';
    params.push(changeType);
  }

  const [rows] = await connection.execute(`
    SELECT 
      lc.*,
      p.token0,
      p.token1,
      p.fee as pool_fee,
      t1.symbol as token0_symbol,
      t1.decimals as token0_decimals,
      t2.symbol as token1_symbol,
      t2.decimals as token1_decimals
    FROM liquidity_changes lc
    LEFT JOIN pools p ON lc.pool_address = p.pool_address
    LEFT JOIN tokens t1 ON p.token0 = t1.address
    LEFT JOIN tokens t2 ON p.token1 = t2.address
    WHERE ${whereClause}
    ORDER BY lc.block_timestamp DESC
    LIMIT ? OFFSET ?
  `, [...params, limit, offset]);

  const [countRows] = await connection.execute(`
    SELECT COUNT(*) as total FROM liquidity_changes lc WHERE ${whereClause}
  `, params);

  return NextResponse.json({
    success: true,
    data: {
      liquidityChanges: rows,
      pagination: {
        page,
        limit,
        total: countRows[0].total,
        pages: Math.ceil(countRows[0].total / limit)
      }
    }
  });
}

// 获取池子数据
async function getPools(connection: any) {
  const [rows] = await connection.execute(`
    SELECT 
      p.*,
      t1.symbol as token0_symbol,
      t1.name as token0_name,
      t1.decimals as token0_decimals,
      t2.symbol as token1_symbol,
      t2.name as token1_name,
      t2.decimals as token1_decimals,
      (SELECT COUNT(*) FROM swaps WHERE pool_address = p.pool_address) as total_swaps,
      (SELECT SUM(amount_in) FROM swaps WHERE pool_address = p.pool_address) as total_volume
    FROM pools p
    LEFT JOIN tokens t1 ON p.token0 = t1.address
    LEFT JOIN tokens t2 ON p.token1 = t2.address
    ORDER BY p.created_timestamp DESC
  `);

  return NextResponse.json({
    success: true,
    data: rows
  });
}

// 获取扫描状态
async function getScanStatus(connection: any) {
  const [rows] = await connection.execute(`
    SELECT * FROM scan_status ORDER BY updated_at DESC
  `);

  return NextResponse.json({
    success: true,
    data: rows
  });
} 
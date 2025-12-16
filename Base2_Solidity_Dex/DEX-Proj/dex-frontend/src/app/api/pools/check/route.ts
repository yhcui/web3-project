import { NextResponse } from 'next/server'
import { createPublicClient, http } from 'viem'
import { sepolia } from 'viem/chains'
import { CONTRACTS } from '@/lib/constants'
import { POOL_MANAGER_ABI } from '@/lib/contracts'

// 创建公共客户端连接
const client = createPublicClient({
  chain: sepolia,
  transport: http('https://sepolia.infura.io/v3/d8ed0bd1de8242d998a1405b6932ab33'),
})

export async function POST(request: Request) {
  try {
    // 解析请求数据
    const body = await request.json()
    const { token0, token1, fee } = body

    if (!token0 || !token1 || !fee) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      )
    }

    // 确保token0地址小于token1地址（Uniswap V4的要求）
    const sortedToken0 = BigInt(token0) < BigInt(token1) ? token0 : token1
    const sortedToken1 = BigInt(token0) < BigInt(token1) ? token1 : token0

    // 获取所有池子
    const poolsData = await client.readContract({
      address: CONTRACTS.POOL_MANAGER as `0x${string}`,
      abi: POOL_MANAGER_ABI,
      functionName: 'getAllPools',
    })
    
    type PoolInfo = {
      pool: string;
      token0: string;
      token1: string;
      index: number;
    }
    
    const pools = (poolsData as unknown) as PoolInfo[]
    
    // 查找匹配的池子
    const matchingPool = pools.find(p => {
      return p.token0.toLowerCase() === sortedToken0.toLowerCase() && 
             p.token1.toLowerCase() === sortedToken1.toLowerCase()
    })
    
    if (matchingPool) {
      return NextResponse.json({
        success: true,
        exists: true,
        poolAddress: matchingPool.pool,
        poolIndex: matchingPool.index,
      })
    } else {
      return NextResponse.json({
        success: true,
        exists: false,
      })
    }
  } catch (error: unknown) {
    console.error('检查池子API错误:', error)
    
    const errorMessage = error instanceof Error ? error.message : '检查池子失败'
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage
      },
      { status: 500 }
    )
  }
} 
import { NextResponse } from 'next/server'
import { createPublicClient, http } from 'viem'
import { sepolia } from 'viem/chains'
import { ERC20_ABI } from '@/lib/contracts'

// 创建公共客户端连接
const client = createPublicClient({
  chain: sepolia,
  transport: http('https://sepolia.infura.io/v3/d8ed0bd1de8242d998a1405b6932ab33'),
})

export async function POST(request: Request) {
  try {
    // 解析请求数据
    const body = await request.json()
    const { token, owner, spender } = body

    if (!token || !owner || !spender) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      )
    }

    // 获取授权额度
    const allowance = await client.readContract({
      address: token as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [owner as `0x${string}`, spender as `0x${string}`],
    })

    return NextResponse.json({
      success: true,
      allowance: allowance.toString(),
    })
  } catch (error: unknown) {
    console.error('获取授权API错误:', error)
    
    const errorMessage = error instanceof Error ? error.message : '获取授权失败'
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage
      },
      { status: 500 }
    )
  }
} 
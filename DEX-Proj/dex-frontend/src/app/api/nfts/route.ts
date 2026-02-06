import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { owner, tokenType = 'ERC721', limit = 100, page = 1 } = await request.json()

    if (!owner) {
      return NextResponse.json(
        { success: false, error: '缺少owner参数' },
        { status: 400 }
      )
    }

    const options = {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        id: 1,
        jsonrpc: '2.0',
        method: 'zan_getNFTsByOwner',
        params: [owner, tokenType, limit, page]
      })
    }

    const response = await fetch('https://api.zan.top/data/v1/eth/mainnet/public', options)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    if (data.error) {
      return NextResponse.json(
        { success: false, error: data.error.message || '获取NFT失败' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data.result || [],
      pagination: {
        page,
        limit,
        total: data.result?.length || 0
      }
    })

  } catch (error) {
    console.error('获取NFT失败:', error)
    return NextResponse.json(
      { success: false, error: '获取NFT失败' },
      { status: 500 }
    )
  }
} 
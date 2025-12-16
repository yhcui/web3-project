'use client'

import { Suspense } from 'react'
import AddLiquidity from '@/components/pools/AddLiquidity'

export default function LiquidityPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-8 text-center">添加流动性</h1>
      
      <div className="flex justify-center">
        <Suspense fallback={<div className="text-center">加载中...</div>}>
          <AddLiquidity />
        </Suspense>
      </div>
    </div>
  )
} 
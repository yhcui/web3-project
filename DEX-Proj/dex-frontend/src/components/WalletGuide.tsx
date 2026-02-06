'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

export function WalletGuide() {
  const [isOpen, setIsOpen] = useState(true)

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-colors"
      >
        💡
      </button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 w-80 bg-white border shadow-lg rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">使用指南</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <div className="space-y-3 text-sm text-gray-600">
        <div>
          <p className="font-medium mb-1">1. 连接钱包</p>
          <p>点击右上角&quot;连接钱包&quot;按钮，支持 MetaMask、WalletConnect 等钱包。</p>
        </div>
        
        <div>
          <p className="font-medium mb-1">2. 切换网络</p>
          <p>确保您的钱包连接到 Sepolia 测试网络。</p>
        </div>
        
        <div>
          <p className="font-medium mb-1">3. 获取测试代币</p>
          <p>您可以从 Sepolia 水龙头获取 ETH，然后在测试合约中获取测试代币。</p>
        </div>
        
        <div>
          <p className="font-medium mb-1">4. 开始交换</p>
          <p>选择代币和数量，即可进行代币交换。</p>
        </div>
        
        <div className="pt-2 border-t">
          <p className="text-xs text-gray-500">
            这是一个教学项目，仅在测试网络运行。
          </p>
        </div>
      </div>
    </div>
  )
} 
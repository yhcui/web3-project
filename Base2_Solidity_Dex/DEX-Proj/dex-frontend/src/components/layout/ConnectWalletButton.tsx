'use client'

import { useState } from 'react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { shortenAddress } from '@/lib/utils'

export function ConnectWalletButton() {
  const { address, isConnected } = useAccount()
  const { connect } = useConnect()
  const { disconnect } = useDisconnect()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const handleConnect = () => {
    connect({ connector: injected() })
  }

  const handleDisconnect = () => {
    disconnect()
    setIsDropdownOpen(false)
  }

  if (isConnected && address) {
    return (
      <div className="relative">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          {shortenAddress(address)}
        </button>

        {isDropdownOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg z-50">
            <div className="p-2">
              <button
                onClick={handleDisconnect}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 rounded"
              >
                断开连接
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <button
      onClick={handleConnect}
      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
    >
      连接钱包
    </button>
  )
} 
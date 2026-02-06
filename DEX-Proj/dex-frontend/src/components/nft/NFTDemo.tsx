'use client'

import { useState } from 'react'
import { Search, Loader2 } from 'lucide-react'
import { NFTItem } from '@/hooks/useNFTs'
import { shortenAddress } from '@/lib/utils'

export default function NFTDemo() {
  const [address, setAddress] = useState('0xd46c8648f2ac4ce1a1aace620460fbd24f640853')
  const [tokenType, setTokenType] = useState<'ERC721' | 'ERC1155'>('ERC721')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nfts, setNfts] = useState<NFTItem[]>([])

  const handleSearch = async () => {
    if (!address) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/nfts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          owner: address,
          tokenType,
          limit: 20,
          page: 1,
        }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || '获取NFT失败')
      }

      setNfts(result.data)
    } catch (err) {
      console.error('获取NFT失败:', err)
      setError(err instanceof Error ? err.message : '获取NFT失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-card-foreground mb-4">NFT API 演示</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              钱包地址
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="输入以太坊地址"
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              代币类型
            </label>
            <div className="flex space-x-2">
              <button
                onClick={() => setTokenType('ERC721')}
                className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                  tokenType === 'ERC721'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary hover:bg-secondary/80 text-secondary-foreground'
                }`}
              >
                ERC721
              </button>
              <button
                onClick={() => setTokenType('ERC1155')}
                className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                  tokenType === 'ERC1155'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary hover:bg-secondary/80 text-secondary-foreground'
                }`}
              >
                ERC1155
              </button>
            </div>
          </div>

          <button
            onClick={handleSearch}
            disabled={loading || !address}
            className="flex items-center space-x-2 px-4 py-2 bg-primary hover:bg-primary/90 disabled:bg-muted disabled:cursor-not-allowed text-primary-foreground rounded-lg transition-colors"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            <span>{loading ? '搜索中...' : '搜索NFT'}</span>
          </button>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-destructive">{error}</p>
          </div>
        )}

        {nfts.length > 0 && (
          <div className="mt-6">
            <h4 className="text-md font-medium text-foreground mb-4">
              找到 {nfts.length} 个NFT
            </h4>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {nfts.map((nft, index) => (
                <div
                  key={`${nft.contractAddress}-${nft.tokenId}-${index}`}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div>
                    <p className="font-medium text-foreground">
                      {nft.metadata?.name || nft.name || `Token #${nft.tokenId}`}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {nft.symbol} • {shortenAddress(nft.contractAddress)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Token ID</p>
                    <p className="font-medium text-foreground">{nft.tokenId}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && nfts.length === 0 && !error && address && (
          <div className="mt-4 p-4 bg-muted rounded-lg text-center">
            <p className="text-muted-foreground">未找到NFT</p>
          </div>
        )}
      </div>
    </div>
  )
} 
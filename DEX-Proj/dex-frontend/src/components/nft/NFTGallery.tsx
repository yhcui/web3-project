'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'
import { 
  RefreshCw, 
  Image as ImageIcon, 
  ExternalLink, 
  Filter,
  Grid3X3,
  List,
  ChevronDown,
  Loader2
} from 'lucide-react'
import { useNFTs, NFTItem } from '@/hooks/useNFTs'
import { cn, shortenAddress } from '@/lib/utils'

interface NFTCardProps {
  nft: NFTItem
  viewMode: 'grid' | 'list'
}

function NFTCard({ nft, viewMode }: NFTCardProps) {
  const [imageError, setImageError] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)

  const handleImageLoad = () => {
    setImageLoading(false)
  }

  const handleImageError = () => {
    setImageError(true)
    setImageLoading(false)
  }

  if (viewMode === 'list') {
    return (
      <div className="flex items-center space-x-4 p-4 bg-card border border-border rounded-lg hover:bg-accent/50 transition-colors">
        <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
          {!imageError && nft.metadata?.image ? (
            <img
              src={nft.metadata.image}
              alt={nft.metadata?.name || `NFT ${nft.tokenId}`}
              className="w-full h-full object-cover"
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
          ) : (
            <ImageIcon className="w-6 h-6 text-muted-foreground" />
          )}
        </div>
        
        <div className="flex-1">
          <h3 className="font-medium text-card-foreground">
            {nft.metadata?.name || nft.name || `Token #${nft.tokenId}`}
          </h3>
          <p className="text-sm text-muted-foreground">
            {nft.symbol} • {shortenAddress(nft.contractAddress)}
          </p>
        </div>
        
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Token ID</p>
          <p className="font-medium text-card-foreground">{nft.tokenId}</p>
        </div>
        
        {nft.balance && nft.tokenType === 'ERC1155' && (
          <div className="text-right">
            <p className="text-sm text-muted-foreground">数量</p>
            <p className="font-medium text-card-foreground">{nft.balance}</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-square bg-muted flex items-center justify-center relative">
        {imageLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        )}
        
        {!imageError && nft.metadata?.image ? (
          <img
            src={nft.metadata.image}
            alt={nft.metadata?.name || `NFT ${nft.tokenId}`}
            className={cn(
              "w-full h-full object-cover",
              imageLoading && "opacity-0"
            )}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        ) : (
          <ImageIcon className="w-8 h-8 text-muted-foreground" />
        )}
        
        {nft.tokenType === 'ERC1155' && nft.balance && parseInt(nft.balance) > 1 && (
          <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
            {nft.balance}
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="font-medium text-card-foreground truncate">
          {nft.metadata?.name || nft.name || `Token #${nft.tokenId}`}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          {nft.symbol} • #{nft.tokenId}
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          {shortenAddress(nft.contractAddress)}
        </p>
        
        {nft.metadata?.external_url && (
          <a
            href={nft.metadata.external_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1 text-xs text-primary hover:text-primary/80 mt-2"
          >
            <span>查看详情</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  )
}

interface FilterPanelProps {
  tokenType: 'ERC721' | 'ERC1155'
  onTokenTypeChange: (type: 'ERC721' | 'ERC1155') => void
  contractAddresses: string[]
  selectedContract: string
  onContractChange: (contract: string) => void
}

function FilterPanel({ 
  tokenType, 
  onTokenTypeChange, 
  contractAddresses, 
  selectedContract, 
  onContractChange 
}: FilterPanelProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-lg transition-colors"
      >
        <Filter className="w-4 h-4" />
        <span>筛选</span>
        <ChevronDown className={cn("w-4 h-4 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 w-64 bg-background border border-border rounded-lg shadow-lg z-50 p-4">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">代币类型</label>
              <div className="flex space-x-2 mt-2">
                <button
                  onClick={() => onTokenTypeChange('ERC721')}
                  className={cn(
                    "px-3 py-1 rounded text-sm transition-colors",
                    tokenType === 'ERC721'
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-accent"
                  )}
                >
                  ERC721
                </button>
                <button
                  onClick={() => onTokenTypeChange('ERC1155')}
                  className={cn(
                    "px-3 py-1 rounded text-sm transition-colors",
                    tokenType === 'ERC1155'
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-accent"
                  )}
                >
                  ERC1155
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">合约地址</label>
              <select
                value={selectedContract}
                onChange={(e) => onContractChange(e.target.value)}
                className="w-full mt-2 px-3 py-2 bg-background border border-border rounded-lg text-sm"
              >
                <option value="">全部合约</option>
                {contractAddresses.map((address) => (
                  <option key={address} value={address}>
                    {shortenAddress(address)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function NFTGallery() {
  const { isConnected } = useAccount()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [tokenType, setTokenType] = useState<'ERC721' | 'ERC1155'>('ERC721')
  const [selectedContract, setSelectedContract] = useState('')

  const { 
    nfts, 
    loading, 
    error, 
    stats, 
    refreshNFTs, 
    fetchMoreNFTs, 
    hasMore 
  } = useNFTs({ tokenType, autoFetch: true })

  // 筛选NFT
  const filteredNFTs = nfts.filter(nft => {
    if (selectedContract && nft.contractAddress.toLowerCase() !== selectedContract.toLowerCase()) {
      return false
    }
    return true
  })

  // 获取唯一的合约地址
  const contractAddresses = Array.from(new Set(nfts.map(nft => nft.contractAddress)))

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">请连接钱包</h3>
        <p className="text-muted-foreground">连接您的钱包以查看NFT收藏</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">我的NFT</h2>
          <p className="text-muted-foreground mt-1">
            共 {stats.totalNFTs} 个NFT，来自 {stats.contractCount} 个合约
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <FilterPanel
            tokenType={tokenType}
            onTokenTypeChange={setTokenType}
            contractAddresses={contractAddresses}
            selectedContract={selectedContract}
            onContractChange={setSelectedContract}
          />
          
          <div className="flex items-center space-x-1 bg-secondary rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                "p-2 rounded transition-colors",
                viewMode === 'grid'
                  ? "bg-background shadow-sm"
                  : "hover:bg-accent"
              )}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                "p-2 rounded transition-colors",
                viewMode === 'list'
                  ? "bg-background shadow-sm"
                  : "hover:bg-accent"
              )}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          
          <button
            onClick={refreshNFTs}
            disabled={loading}
            className="flex items-center space-x-2 px-3 py-2 bg-primary hover:bg-primary/90 disabled:bg-muted disabled:cursor-not-allowed text-primary-foreground rounded-lg transition-colors"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            <span>刷新</span>
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-destructive">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && nfts.length === 0 && (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">加载NFT中...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredNFTs.length === 0 && !error && (
        <div className="text-center py-12">
          <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">暂无NFT</h3>
          <p className="text-muted-foreground">
            {selectedContract ? '在选定的合约中未找到NFT' : '您的钱包中暂无NFT'}
          </p>
        </div>
      )}

      {/* NFT Grid/List */}
      {filteredNFTs.length > 0 && (
        <>
          <div className={cn(
            viewMode === 'grid' 
              ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
              : "space-y-4"
          )}>
            {filteredNFTs.map((nft, index) => (
              <NFTCard 
                key={`${nft.contractAddress}-${nft.tokenId}-${index}`}
                nft={nft} 
                viewMode={viewMode}
              />
            ))}
          </div>

          {/* Load More */}
          {hasMore && (
            <div className="text-center">
              <button
                onClick={fetchMoreNFTs}
                disabled={loading}
                className="px-6 py-3 bg-secondary hover:bg-secondary/80 disabled:bg-muted disabled:cursor-not-allowed text-secondary-foreground rounded-lg transition-colors"
              >
                {loading ? '加载中...' : '加载更多'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
} 
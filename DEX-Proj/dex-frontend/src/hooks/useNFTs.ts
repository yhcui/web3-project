'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAccount } from 'wagmi'

export interface NFTMetadata {
  name?: string
  description?: string
  image?: string
  external_url?: string
  attributes?: Array<{
    trait_type: string
    value: string | number
  }>
}

export interface NFTItem {
  contractAddress: string
  tokenId: string
  tokenType: 'ERC721' | 'ERC1155'
  name?: string
  symbol?: string
  tokenUri?: string
  metadata?: NFTMetadata
  balance?: string
  lastUpdated?: string
}

interface NFTResponse {
  success: boolean
  data: NFTItem[]
  pagination: {
    page: number
    limit: number
    total: number
  }
  error?: string
}

interface UseNFTsOptions {
  tokenType?: 'ERC721' | 'ERC1155'
  limit?: number
  autoFetch?: boolean
}

export const useNFTs = (options: UseNFTsOptions = {}) => {
  const { address, isConnected } = useAccount()
  const { tokenType = 'ERC721', limit = 100, autoFetch = true } = options
  
  const [nfts, setNfts] = useState<NFTItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit,
    total: 0
  })

  const fetchNFTs = useCallback(async (page: number = 1, ownerAddress?: string) => {
    const targetAddress = ownerAddress || address
    
    if (!targetAddress) {
      setError('钱包地址不可用')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/nfts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          owner: targetAddress,
          tokenType,
          limit,
          page,
        }),
      })

      const result: NFTResponse = await response.json()

      if (!result.success) {
        throw new Error(result.error || '获取NFT失败')
      }

      if (page === 1) {
        setNfts(result.data)
      } else {
        setNfts(prev => [...prev, ...result.data])
      }

      setPagination(result.pagination)
    } catch (err) {
      console.error('获取NFT失败:', err)
      setError(err instanceof Error ? err.message : '获取NFT失败')
    } finally {
      setLoading(false)
    }
  }, [address, tokenType, limit])

  // 获取更多NFT（分页）
  const fetchMoreNFTs = useCallback(() => {
    if (!loading && pagination.page * pagination.limit < pagination.total) {
      fetchNFTs(pagination.page + 1)
    }
  }, [fetchNFTs, loading, pagination])

  // 刷新NFT列表
  const refreshNFTs = useCallback(() => {
    fetchNFTs(1)
  }, [fetchNFTs])

  // 根据合约地址获取NFT
  const getNFTsByContract = useCallback((contractAddress: string) => {
    return nfts.filter(nft => 
      nft.contractAddress.toLowerCase() === contractAddress.toLowerCase()
    )
  }, [nfts])

  // 自动获取NFT
  useEffect(() => {
    if (isConnected && address && autoFetch) {
      fetchNFTs(1)
    } else if (!isConnected) {
      setNfts([])
      setError(null)
      setPagination({ page: 1, limit, total: 0 })
    }
  }, [isConnected, address, autoFetch, fetchNFTs])

  // 计算统计信息
  const stats = {
    totalNFTs: nfts.length,
    contractCount: new Set(nfts.map(nft => nft.contractAddress)).size,
    erc721Count: nfts.filter(nft => nft.tokenType === 'ERC721').length,
    erc1155Count: nfts.filter(nft => nft.tokenType === 'ERC1155').length,
  }

  return {
    nfts,
    loading,
    error,
    pagination,
    stats,
    fetchNFTs,
    fetchMoreNFTs,
    refreshNFTs,
    getNFTsByContract,
    hasMore: pagination.page * pagination.limit < pagination.total,
  }
} 
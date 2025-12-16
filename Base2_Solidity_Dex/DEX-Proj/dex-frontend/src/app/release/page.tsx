'use client'

import { useState, useEffect } from 'react'
import { useAccount, useWalletClient, useWaitForTransactionReceipt, useWriteContract } from 'wagmi'
import { RELEASE_CONTRACT_ABI, RELEASE_CONTRACT_BYTECODE } from '@/lib/release-contract'
import { TOKENS } from '@/lib/constants'
import { useRouter } from 'next/navigation'
import { CheckCircle, Clock, ArrowRight, Rocket, Coins, Wallet } from 'lucide-react'
import { shortenAddress, parseInputAmount } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { parseUnits } from 'viem'

export default function ReleasePage() {
  const { address, isConnected } = useAccount()
  const { data: walletClient } = useWalletClient()
  const router = useRouter()

  // 部署状态
  const [name, setName] = useState('')
  const [symbol, setSymbol] = useState('')
  const [deployHash, setDeployHash] = useState<`0x${string}` | undefined>(undefined)
  const [deployedAddress, setDeployedAddress] = useState<string | null>(null)

  // 部署交易确认
  const { isLoading: isDeployConfirming, isSuccess: isDeployConfirmed, data: deployReceipt } = useWaitForTransactionReceipt({
    hash: deployHash,
  })

  // 铸币合约交互
  // const { writeContract: mintToken, data: mintHash, isPending: isMintPending } = useWriteContract()
  // const { isLoading: isMintConfirming, isSuccess: isMintConfirmed } = useWaitForTransactionReceipt({
  //   hash: mintHash,
  // })

  useEffect(() => {
    if (deployReceipt?.contractAddress) {
      setDeployedAddress(deployReceipt.contractAddress)
    }
  }, [deployReceipt])

  // useEffect(() => {
  //   if (isMintConfirmed) {
  //     setHasMinted(true)
  //   }
  // }, [isMintConfirmed])

  const handleDeploy = async () => {
    if (!walletClient || !address || !name || !symbol) return

    try {
      const hash = await walletClient.deployContract({
        abi: RELEASE_CONTRACT_ABI,
        bytecode: RELEASE_CONTRACT_BYTECODE,
        args: [name, symbol],
        gas: BigInt(3000000), // 手动指定 Gas Limit，避免自动估算过高
      })
      setDeployHash(hash)
    } catch (error) {
      console.error('Deployment failed:', error)
    }
  }

  // const handleMint = () => {
  //   if (!deployedAddress || !address || !mintAmount) return
  //
  //   try {
  //     mintToken({
  //       address: deployedAddress as `0x${string}`,
  //       abi: RELEASE_CONTRACT_ABI,
  //       functionName: 'mint',
  //       args: [address, parseUnits('1000000', 18)], // 假设精度为 18
  //     })
  //   } catch (error) {
  //     console.error('Mint failed:', error)
  //   }
  // }

  const handleAddTokenToWallet = async () => {
    if (!walletClient || !deployedAddress) return
    try {
      await walletClient.watchAsset({
        type: 'ERC20',
        options: {
          address: deployedAddress as `0x${string}`,
          symbol: symbol.slice(0, 11), // 某些钱包限制符号长度
          decimals: 18,
        },
      })
    } catch (error) {
      console.error('Failed to add token to wallet:', error)
      alert('添加到钱包失败。请确保您的钱包支持该功能，或者尝试手动添加。')
    }
  }

  const handleAddLiquidity = () => {
    if (deployedAddress) {
      router.push(`/liquidity?token0=${deployedAddress}&token1=${TOKENS.ETH.address}`)
    }
  }

  const isDeploying = isDeployConfirming || (deployHash && !isDeployConfirmed && !deployReceipt)
  // const isMinting = isMintPending || isMintConfirming

  return (
    <div className="container mx-auto py-12 px-4 max-w-lg">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">铸造代币</h1>
        <p className="text-gray-600">在 Sepolia 测试网上铸造你自己的 ERC20 代币</p>
      </div>

      <div className="bg-white rounded-2xl border shadow-lg p-6 space-y-8">
        
        {/* 第一步：部署合约 */}
        <div className={cn("space-y-4", deployedAddress && "opacity-50 pointer-events-none")}>
          <div className="flex items-center space-x-2 mb-2">
            <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold", deployedAddress ? "bg-green-500 text-white" : "bg-blue-600 text-white")}>1</div>
            <h3 className="font-semibold text-lg">部署合约</h3>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              代币名称 (Name)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如: My Awesome Token"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              disabled={!!deployHash}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              代币符号 (Symbol)
            </label>
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              placeholder="例如: MAT"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              disabled={!!deployHash}
            />
          </div>

          {!deployedAddress && (
             <button
              onClick={handleDeploy}
              disabled={!name || !symbol || isDeploying || !isConnected}
              className={cn(
                "w-full py-4 rounded-lg font-medium text-lg transition-colors flex items-center justify-center space-x-2",
                !name || !symbol || isDeploying || !isConnected
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              )}
            >
              {isDeploying ? (
                <>
                  <Clock className="w-5 h-5 animate-spin" />
                  <span>部署中...</span>
                </>
              ) : (
                <>
                  <Rocket className="w-5 h-5" />
                  <span>部署合约</span>
                </>
              )}
            </button>
          )}

           {/* 部署状态反馈 */}
           {deployHash && !deployedAddress && (
            <div className="p-3 bg-blue-50 text-blue-700 text-sm rounded-lg flex items-center">
              <Clock className="w-4 h-4 mr-2 animate-spin" />
              正在等待交易确认...
            </div>
          )}
        </div>

        {/* 第二步：完成 */}
        {deployedAddress && (
           <div className="space-y-4 pt-6 border-t animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center text-green-700 mb-2">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  <span className="font-medium">合约部署成功</span>
                </div>
                <div className="text-sm text-green-600 space-y-3">
                  <div className="space-y-1">
                    <p>合约地址: {deployedAddress}</p>
                    <p>已自动为您铸造 100,000 {symbol}。</p>
                  </div>
                  <button
                    onClick={handleAddTokenToWallet}
                    className="inline-flex items-center px-3 py-1.5 bg-white border border-green-200 hover:bg-green-50 text-green-700 rounded-md transition-colors text-sm font-medium shadow-sm"
                  >
                    <Wallet className="w-4 h-4 mr-1.5" />
                    添加到钱包
                  </button>
                </div>
             </div>

             <button
               onClick={handleAddLiquidity}
               className="w-full py-4 rounded-lg font-medium text-lg bg-green-600 hover:bg-green-700 text-white transition-colors flex items-center justify-center space-x-2"
             >
               <span>去添加流动性</span>
               <ArrowRight className="w-5 h-5" />
             </button>
           </div>
        )}

      </div>
    </div>
  )
}


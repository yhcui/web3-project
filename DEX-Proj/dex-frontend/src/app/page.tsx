import SwapInterface from '@/components/swap/SwapInterface'
import { NetworkChecker } from '@/components/NetworkChecker'
import { WalletGuide } from '@/components/WalletGuide'

export default function Home() {
  return (
    <>
      <div className="flex flex-col items-center justify-center min-h-[80vh]">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            MetaNodeSwap
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Secure, Fast, Decentralized Token Swapping on Sepolia.
          </p>
        </div>
        
        <NetworkChecker>
          <SwapInterface />
        </NetworkChecker>
        
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>Connect your wallet to start trading</p>
          <p className="mt-1">Supported Network: Sepolia Testnet</p>
        </div>
      </div>
      
      <WalletGuide />
    </>
  )
}

import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { sepolia } from 'wagmi/chains'
import { http } from 'wagmi'

// 配置支持的链
export const config = getDefaultConfig({
  appName: 'MetaNodeSwap',
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || 'YOUR_PROJECT_ID', // 可选，用于 WalletConnect
  chains: [sepolia],
  transports: {
    [sepolia.id]: http('https://sepolia.infura.io/v3/d8ed0bd1de8242d998a1405b6932ab33'),
  },
  ssr: true, // 如果你的 dApp 使用服务器端渲染 (SSR)
})

export { sepolia } 
import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { bsc, bscTestnet } from 'wagmi/chains'

// 使用环境变量或默认测试ID
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID as string

export const config = getDefaultConfig({
  appName: 'Coinroll',
  projectId,
  chains: [bscTestnet],
  ssr: true,
})

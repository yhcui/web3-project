'use client'

import * as React from 'react'
import {
  RainbowKitProvider,
  lightTheme,
  darkTheme,
} from '@rainbow-me/rainbowkit'
import { WagmiProvider } from 'wagmi'
import {
  QueryClientProvider,
  QueryClient,
} from '@tanstack/react-query'
import { useTheme } from './ThemeProvider'

import { config } from '@/lib/wagmi'

const queryClient = new QueryClient()

function RainbowKitProviderWrapper({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme()
  
  // 根据当前主题选择RainbowKit主题
  const rainbowTheme = React.useMemo(() => {
    const isDark = theme === 'dark' || 
      (theme === 'system' && typeof window !== 'undefined' && 
       window.matchMedia('(prefers-color-scheme: dark)').matches)
    
    const baseTheme = isDark ? darkTheme() : lightTheme()
    
    return {
      ...baseTheme,
      colors: {
        ...baseTheme.colors,
        accentColor: '#3b82f6',
        accentColorForeground: '#ffffff',
      },
      radii: {
        ...baseTheme.radii,
        actionButton: '8px',
        connectButton: '8px',
        menuButton: '8px',
        modal: '12px',
      },
    }
  }, [theme])

  return (
    <RainbowKitProvider
      theme={rainbowTheme}
      locale="zh-CN"
    >
      {children}
    </RainbowKitProvider>
  )
}

export function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProviderWrapper>
          {children}
        </RainbowKitProviderWrapper>
      </QueryClientProvider>
    </WagmiProvider>
  )
} 
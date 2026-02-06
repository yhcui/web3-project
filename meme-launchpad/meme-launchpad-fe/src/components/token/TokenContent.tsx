'use client'

import React from 'react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import { LeftPanel } from './LeftPanel'
import { CenterPanel } from './CenterPanel'
import { RightPanel } from './RightPanel'
import { useUIStore } from '@/stores/useUIStore'

interface TokenContentProps {
  tokenAddress: string
  tokenId?: number
  className?: string
}

export function TokenContent({
  tokenAddress,
  tokenId,
  className,
}: TokenContentProps) {
  const t = useTranslations('Token')
  const { leftPanelVisible } = useUIStore()

  // Calculate initial sizes as percentages
  // When left panel is visible:
  // Total width: 1432px (available width)
  // Gap: 16px between panels (2 gaps = 32px)
  // Usable width: 1400px
  // Left panel: 320/1400 ≈ 22.9%
  // Middle panel: 784/1400 ≈ 56%
  // Right panel: 320/1400 ≈ 22.9%

  // When left panel is hidden:
  // Middle panel gets larger percentage

  return (
    <div className={cn('w-full max-w-[1432px]', className)}>
      <ResizablePanelGroup
        key={`panel-group-${leftPanelVisible ? 'with-left' : 'without-left'}`}
        direction="horizontal"
        className="min-h-[600px] w-full"
      >
        {/* Left Panel - 320px initial, completely hidden when leftPanelVisible is false */}
        {leftPanelVisible && (
          <>
            <ResizablePanel
              defaultSize={22.9}
              minSize={22.9}
              maxSize={35}
              className="pr-1"
            >
              <div className="h-full overflow-hidden rounded-lg bg-[#181A20]">
                <LeftPanel
                  className="h-full"
                  currentTokenAddress={tokenAddress}
                />
              </div>
            </ResizablePanel>

            <div className="flex items-center justify-center">
              <ResizableHandle className="h-[75px] w-1 rounded-[20px] bg-[#474D57]"></ResizableHandle>
            </div>
          </>
        )}

        {/* Middle Panel - 784px initial, expands when left panel is hidden */}
        <ResizablePanel
          defaultSize={leftPanelVisible ? 56 : 78.9}
          minSize={leftPanelVisible ? 40 : 55}
          maxSize={leftPanelVisible ? 70 : 85}
          className={leftPanelVisible ? 'px-1' : 'pr-1'}
        >
          <div className="h-full overflow-hidden rounded-lg bg-[#181A20]">
            <CenterPanel
              tokenAddress={tokenAddress}
              tokenId={tokenId}
              className="h-full"
            />
          </div>
        </ResizablePanel>

        <div className="flex items-center justify-center">
          <ResizableHandle className="h-[75px] w-1 rounded-[20px] bg-[#474D57]"></ResizableHandle>
        </div>

        {/* Right Panel - 320px initial */}
        <ResizablePanel
          defaultSize={22.9}
          minSize={22.9}
          maxSize={35}
          className="pl-1"
        >
          <RightPanel tokenAddress={tokenAddress} className="h-full" />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}

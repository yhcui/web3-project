'use client'

import { useState } from 'react'
import { HelpCircle } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface QuickBuyData {
  mevProtection: boolean
  quickBuyAmount: string
  maxSlippage: number | string
}

interface QuickBuyProps {
  onDataChange?: (data: QuickBuyData) => void
  initialData?: Partial<QuickBuyData>
}

export default function QuickBuy({ onDataChange, initialData }: QuickBuyProps) {
  const [mevProtection, setMevProtection] = useState(
    initialData?.mevProtection ?? false
  )
  const [quickBuyAmount, setQuickBuyAmount] = useState(
    initialData?.quickBuyAmount ?? '0.1'
  )
  const [maxSlippage, setMaxSlippage] = useState(
    initialData?.maxSlippage ?? '5'
  )

  // 当数据变化时抛出
  const handleDataChange = (newData: Partial<QuickBuyData>) => {
    const updatedData = {
      mevProtection,
      quickBuyAmount,
      maxSlippage,
      ...newData,
    }
    onDataChange?.(updatedData)
  }

  const handleMevProtectionChange = (checked: boolean) => {
    setMevProtection(checked)
    handleDataChange({ mevProtection: checked })
  }

  const handleQuickBuyAmountChange = (value: string) => {
    setQuickBuyAmount(value)
    handleDataChange({ quickBuyAmount: value })
  }

  const handleMaxSlippageChange = (value: number | string) => {
    setMaxSlippage(value)
    handleDataChange({ maxSlippage: value })
  }

  return (
    <TooltipProvider>
      <div className="px-3 pb-4 text-xl font-bold text-[] md:hidden">
        {'Advanced Earn'}
      </div>
      <div className="hidden items-center justify-start gap-2 px-3 text-xs font-medium text-[#C8C7D8] md:flex md:px-7">
        {/* MEV Protection */}
        <div className="flex h-[32px] items-center gap-1 rounded-[8px] border border-[#2B3139] px-3 hover:border-[]">
          <span className="flex items-center text-white">
            <Switch
              checked={mevProtection}
              onCheckedChange={handleMevProtectionChange}
              className="mr-2 scale-65 data-[state=checked]:bg-[] data-[state=unchecked]:bg-[#2b3139]"
            />
            MEV Protection
          </span>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="ml-1 cursor-pointer text-[10px] text-[#44454A]">
                <HelpCircle size={12} />
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                MEV Protection helps prevent front-running and sandwich attacks
              </p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Quick Buy */}
        <div className="flex h-[32px] items-center gap-1 rounded-[8px] border border-[#2B3139] px-3 focus-within:border-[] hover:border-[] md:order-2">
          <div className="flex h-full items-center border-r border-[#2B3139] px-2 text-white">
            Quick Buy
          </div>
          <span className="ml-1 flex items-center border-r border-[#2B3139] px-2">
            <span className="mr-1 block flex h-4 w-4 items-center justify-center rounded-full bg-[#F0B90B]">
              <img
                className="h-3 w-3"
                src="/assets/images/bsc-chain-icon.svg"
                alt="BSC"
              />
            </span>
            <input
              type="text"
              value={quickBuyAmount}
              onChange={(e) => handleQuickBuyAmountChange(e.target.value)}
              className="w-[70px] bg-transparent text-right text-sm font-bold text-white outline-none"
              placeholder="0.1"
            />
          </span>
          <span className="ml-1 text-[11px] font-normal text-[#6E6D7A]">
            $67.76
          </span>
        </div>

        {/* Max Slippage */}
        <div className="flex h-[32px] items-center gap-1 rounded-[8px] border border-[#2B3139] px-3 focus-within:border-[] hover:border-[] md:order-3">
          <div className="flex h-full items-center border-r border-[#2B3139] px-2 text-white">
            Max Slippage
          </div>
          <Input
            type="text"
            value={maxSlippage}
            onChange={(e) => handleMaxSlippageChange(e.target.value)}
            className="w-[40px] border-none text-center font-bold text-white outline-none"
            placeholder="0.1"
          />
        </div>
      </div>

      {/* Mobile */}
      <div className="md:hidden">
        <div className="flex items-center justify-between">
          <div className="flex h-[32px] items-center gap-1 rounded-[8px] px-3">
            <span className="flex items-center text-white">
              <Switch
                checked={mevProtection}
                onCheckedChange={handleMevProtectionChange}
                className="mr-2 scale-65 data-[state=checked]:bg-[] data-[state=unchecked]:bg-[#2b3139]"
              />
              MEV Protection
            </span>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="ml-1 cursor-pointer text-[10px] text-[#44454A]">
                  <HelpCircle size={12} />
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  MEV Protection helps prevent front-running and sandwich
                  attacks
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="flex h-[32px] items-center gap-1 rounded-[8px] px-3 md:order-3">
            <div className="flex h-full items-center px-2 text-white">
              Max Slippage
            </div>
            <Input
              type="text"
              value={maxSlippage}
              onChange={(e) => handleMaxSlippageChange(e.target.value)}
              className="w-[50px] border-[#2B3139] font-bold text-white outline-none"
              placeholder="0.1"
            />
          </div>
        </div>
        {/* Quick Buy */}
        <div className="mt-3 flex h-[32px] items-center gap-1 rounded-[8px] px-3 md:order-2">
          <div className="flex h-full items-center px-2 text-white">
            Quick Buy
          </div>
          <div className="flex flex-1 items-center gap-3 rounded-sm border border-[#2B3139] bg-[#191B22] px-4 text-sm">
            <span className="mr-1 block flex h-4 w-4 items-center justify-center rounded-full bg-[#F0B90B]">
              <img
                className="h-3 w-3"
                src="/assets/images/bsc-chain-icon.svg"
                alt="BSC"
              />
            </span>
            <Input
              type="text"
              value={quickBuyAmount}
              onChange={(e) => handleQuickBuyAmountChange(e.target.value)}
              className="flex-1 border-none font-bold text-white outline-none"
              placeholder="0.1"
            />
            <span className="ml-1 font-normal text-[#6E6D7A]">$67.76</span>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}

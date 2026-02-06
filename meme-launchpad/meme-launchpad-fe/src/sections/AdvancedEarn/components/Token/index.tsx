import React from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  formatNumber,
  formatPercentage,
  formatEthAddress,
  formatAmount,
} from '@/utils/format'
import { type TokenTypeConfig } from '../../tokenTypes'
import { type AdvancedTokenItem } from '@/api/endpoints/advanced'
import { ADVANCED_TOKEN_LIMIT } from '@/enums/advanced'
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard'
import BadgeLaunchMode from '@/components/BadgeLaunchMode'
import { LAUNCH_MODE } from '@/enums/tokens'
import { notify } from '@/stores/useUIStore'
import { LaunchMode } from '@/types/token'
import { getTimeDiffLabel } from '@/utils/tools'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { CircularProgress } from './CircularProgress'
import { Ellipsis } from 'lucide-react'
interface TokenProps {
  className?: string
  config?: TokenTypeConfig
  token: AdvancedTokenItem
}

export default function Token({ className, config, token }: TokenProps) {
  const copy = useCopyToClipboard()

  const DivideLine: React.FC = () => {
    return <div className="mx-1 h-[10px] border-r border-r-[#FFFFFF1A]"></div>
  }

  const handleClick = async (text: string) => {
    await copy(text)
    notify.success('Copied to clipboard')
  }

  return (
    <div
      className={cn(
        className,
        {
          'border-b border-[#2B3139] px-3 py-3 md:px-2':
            !className?.includes('last:border-none') &&
            !className?.includes('last:pb-0'),
        },
        'cursor-pointer transition-all duration-150 last:border-none last:pb-0 hover:rounded-[8px] hover:border-[#191B22] hover:bg-[#191B22]'
      )}
    >
      <div className="flex items-center gap-2">
        {/* 头像部分 */}
        <div className="relative flex-shrink-0">
          <div className="relative">
            <CircularProgress
              currentValue={Number(token.progressPct) * 100 || 0}
              maxValue={100}
              size="lg"
              className="md:hidden"
              trackColor="#2B3139"
              progressColor={config?.progressColor || ''}
            />
            <CircularProgress
              currentValue={Number(token.progressPct) * 100 || 0}
              maxValue={100}
              size="xl"
              className="hidden md:block"
              trackColor="#2B3139"
              progressColor={config?.progressColor || ''}
            />

            <img
              src={token.tokenLogo || '/assets/images/placeholder-token.svg'}
              alt={token.tokenName}
              className="absolute right-[4px] bottom-[4px] h-[62px] w-[62px] rounded-[10px] object-cover"
              onError={(e) => {
                e.currentTarget.src = '/assets/images/placeholder-token.svg'
              }}
            />
            <div className="absolute right-[3px] bottom-[3px] flex h-[18px] w-[18px] items-center justify-center">
              <BadgeLaunchMode value={token.tokenLaunchMode as LaunchMode} />
            </div>
          </div>
        </div>

        {/* 信息部分 */}
        <div className="flex-1 shrink-0">
          <div className="flex items-center gap-1">
            <h3 className="text-base font-bold text-white">
              {token.tokenSymbol || 'Symbol'}
            </h3>
            <span className="text-sm text-[#656A79]">
              {token.tokenName || 'Token Name'}
            </span>
            <div className="flex h-[18px] w-[18px] items-center justify-center">
              {token.tokenRank ? (
                <img
                  src={`/assets/images/ranks/${token.tokenRank}.png`}
                  alt=""
                  className="h-[18px] w-[18px]"
                />
              ) : (
                <></>
              )}
            </div>
          </div>

          <div className="mb-3 hidden items-center md:flex">
            <span className="text-xs text-[#FFFFFFCC]">
              {getTimeDiffLabel(token.graduationTime || 0)}
            </span>
            <DivideLine />
            <div className="flex cursor-pointer items-center gap-1">
              <span
                className="text-xs text-[#FFFFFFCC]"
                onClick={() => handleClick(token.tokenContractAddress || '')}
              >
                {formatEthAddress(token.tokenContractAddress || '')}
              </span>
              <img
                src="/assets/images/copy-icon.svg"
                alt="copy"
                className="h-[10px] w-[10px]"
              />
            </div>
            <DivideLine />
            <div className="flex items-center gap-1">
              {token.website && (
                <Link href={token.website} target="_blank">
                  <img
                    src="/assets/images/social/website.svg"
                    width={12}
                    height={12}
                    className="cursor-pointer hover:opacity-80"
                  />
                </Link>
              )}
              {token.telegram && (
                <Link href={token.telegram} target="_blank">
                  <img
                    src="/assets/images/social/telegram.svg"
                    width={12}
                    height={12}
                    className="cursor-pointer hover:opacity-80"
                  />
                </Link>
              )}
              {token.twitter && (
                <Link href={token.twitter} target="_blank">
                  <img
                    src="/assets/images/social/x.svg"
                    className="cursor-pointer hover:opacity-80"
                    width={12}
                    height={12}
                  />
                </Link>
              )}
              {token.discord && (
                <Link href={token.discord} target="_blank">
                  <img
                    src="/assets/images/social/discord.svg"
                    className="cursor-pointer hover:opacity-80"
                    width={12}
                    height={12}
                  />
                </Link>
              )}
              {token.whitepaper && (
                <Link href={token.whitepaper} target="_blank">
                  <img
                    src="/assets/images/social/whitepaper.svg"
                    className="cursor-pointer hover:opacity-80"
                    width={12}
                    height={12}
                  />
                </Link>
              )}
            </div>
          </div>

          <div className="mt-3 flex items-center gap-1.5 text-xs md:mt-0">
            <div className="flex items-center">
              <span className="text-[]">
                {formatPercentage(token.progressPct || 0)}
              </span>
            </div>
            <div className="h-4 w-px bg-[#FFFFFF1A]"></div>
            <div className="flex items-center gap-1">
              <img
                src="/assets/images/advanced-earn/top-icon.svg"
                width={14}
                height={14}
                style={{
                  filter:
                    (token.top10SupplyPercent || 0) > ADVANCED_TOKEN_LIMIT.TOP
                      ? 'filter: brightness(0) saturate(100%) invert(100%) sepia(100%) saturate(1000%) hue-rotate(120deg) brightness(1) contrast(1)'
                      : 'brightness(0) saturate(100%) invert(67%) sepia(100%) saturate(1000%) hue-rotate(300deg) brightness(1) contrast(1)',
                }}
              />
              <span className="text-[#FF7DA4]">
                {formatPercentage(token.top10SupplyPercent || 0)}
              </span>
            </div>
            <div className="h-4 w-px bg-[#FFFFFF1A]"></div>
            <div className="flex items-center gap-1">
              <img
                src="/assets/images/comment-icon.svg"
                width={12}
                height={12}
              />
              <span className="text-white">
                {formatAmount(token.marginBnbNum || 0)}
              </span>
            </div>
            <div className="h-4 w-px bg-[#FFFFFF1A]"></div>
            <div className="flex items-center gap-1">
              <img
                src={
                  (token.sortPoints || 0) > ADVANCED_TOKEN_LIMIT.HOT
                    ? '/assets/images/advanced-earn/hot02-icon.svg'
                    : '/assets/images/fire-icon.svg'
                }
                width={12}
                height={12}
              />
              <span className="text-[#F69414]">{token.sortPoints || 0}</span>
            </div>
          </div>
        </div>

        {/* 按钮 */}
        <div className="flex flex-col items-end gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border border-[66] bg-transparent text-sm leading-[1.1] text-white hover:bg-yellow-400/10 hover:text-white"
          >
            <img
              className="w-4"
              src="/assets/images/advanced-earn/lightning.svg"
              alt=""
            />
            Buy
          </Button>

          <div className="hidden text-right text-[12px] md:block">
            <div className="text-muted-foreground flex items-center justify-end gap-1">
              <img
                className="w-3"
                src="/assets/images/advanced-earn/holders.svg"
                alt=""
              />

              <span className="text-white">{token.holdersCount || 0}</span>
              <span>TX</span>
              <span className="text-white">{token.buyCount24h || 0}</span>
            </div>
            <div className="text-muted-foreground flex items-center gap-1 text-xs">
              <span className="font-bold text-[#656A79]">V</span>
              <span className="text-white">
                ${formatNumber(token.tokenMarketCap)}
              </span>
              <span className="font-bold text-[#656A79]">MC</span>
              <span className="text-white">
                ${formatNumber(token.tokenMarketCap)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 手机端处理 */}
      <div className="mt-3 flex items-center gap-3 text-sm md:hidden">
        <div className="flex items-center gap-1">
          <span className="font-bold text-[#656A79]">V</span>
          <span className="text-white">
            ${formatNumber(token.tokenMarketCap)}
          </span>
          <span className="font-bold text-[#656A79]">MC</span>
          <span className="text-white">
            ${formatNumber(token.tokenMarketCap)}
          </span>
        </div>
        <div className="flex items-center gap-1 text-sm">
          <img
            className="w-3"
            src="/assets/images/advanced-earn/holders.svg"
            alt=""
          />
          <span className="text-white">{token.holdersCount || 0}</span>
          <span className="text-[#656A79]">TX</span>
          <span className="text-white">{token.buyCount24h || 0}</span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="ml-auto flex h-6 w-6 items-center justify-center rounded-full border border-[#2B3139] bg-[#111319A3] opacity-[0.64] transition-opacity hover:opacity-100 md:ml-0">
              <Ellipsis size={16} className="ml-auto text-white" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[156px] border-[#2B3139] bg-[#191B22]"
            align="end"
          >
            <DropdownMenuItem className="cursor-pointer text-sm text-white hover:bg-[#252832]">
              Twitter
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer text-sm text-white hover:bg-[#252832]">
              Telegram
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

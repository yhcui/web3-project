'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { useUIStore } from '@/stores/useUIStore'

interface SettingsDrawerProps {
  className?: string
}

export function SettingsDrawer({ className }: SettingsDrawerProps) {
  const t = useTranslations('TokenPage.Settings')

  const {
    settingsDrawerOpen,
    setSettingsDrawerOpen,
    klineColorScheme,
    toggleKlineColorScheme,
    leftPanelVisible,
    toggleLeftPanelVisible,
  } = useUIStore()

  // 处理ESC键关闭抽屉
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && settingsDrawerOpen) {
        setSettingsDrawerOpen(false)
      }
    }

    if (settingsDrawerOpen) {
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [settingsDrawerOpen, setSettingsDrawerOpen])

  // 处理背景点击关闭
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setSettingsDrawerOpen(false)
    }
  }

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex justify-end transition-all duration-300 ease-in-out',
        settingsDrawerOpen
          ? 'pointer-events-auto opacity-100'
          : 'pointer-events-none opacity-0'
      )}
      onClick={handleBackdropClick}
    >
      {/* 背景遮罩 */}
      <div
        className={cn(
          'absolute inset-0 bg-black transition-opacity duration-300 ease-in-out',
          settingsDrawerOpen ? 'opacity-50' : 'opacity-0'
        )}
      />

      {/* 抽屉内容 */}
      <div
        className={cn(
          'relative h-full w-80 border-l border-[#333B47] bg-[#181A20] shadow-xl transition-all duration-300 ease-in-out',
          settingsDrawerOpen
            ? 'translate-x-0 opacity-100'
            : 'translate-x-full opacity-0',
          className
        )}
      >
        {/* 抽屉头部 */}
        <div className="flex items-center justify-between border-b border-[#333B47] px-6 py-4">
          <h2 className="text-lg font-medium text-white">{t('title')}</h2>
          <button
            onClick={() => setSettingsDrawerOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-md text-[#798391] transition-colors hover:bg-[#2A2D3A] hover:text-white"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 4L4 12M4 4L12 12"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* 抽屉内容 */}
        <div
          className={cn(
            'flex flex-col gap-6 p-6 transition-all duration-500 ease-out',
            settingsDrawerOpen
              ? 'translate-y-0 opacity-100'
              : 'translate-y-4 opacity-0'
          )}
          style={{
            transitionDelay: settingsDrawerOpen ? '150ms' : '0ms',
          }}
        >
          {/* K线颜色设置 */}
          <div
            className={cn(
              'space-y-3 transition-all duration-300 ease-out',
              settingsDrawerOpen
                ? 'translate-y-0 opacity-100'
                : 'translate-y-2 opacity-0'
            )}
            style={{
              transitionDelay: settingsDrawerOpen ? '200ms' : '0ms',
            }}
          >
            <h3 className="text-sm font-medium text-white">
              {t('klineColors')}
            </h3>
            <p className="text-xs text-[#798391]">{t('klineColorsDesc')}</p>

            <div className="space-y-3">
              {/* 绿涨红跌选项 */}
              <div
                className={cn(
                  'flex cursor-pointer items-center justify-between rounded-lg border p-4 transition-all duration-200',
                  klineColorScheme === 'green-up-red-down'
                    ? 'border-[#0ECB81] bg-[#0ECB81]/10'
                    : 'border-[#333B47] bg-[#1E2026] hover:border-[#0ECB81]/50 hover:bg-[#0ECB81]/5'
                )}
                onClick={() =>
                  useUIStore.getState().setKlineColorScheme('green-up-red-down')
                }
              >
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-white">
                    {t('greenUpRedDown')}
                  </span>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1">
                      <span className="text-[#0ECB81]">↗</span>
                      <span className="text-[#798391]">{t('rise')}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="text-[#F6465D]">↘</span>
                      <span className="text-[#798391]">{t('fall')}</span>
                    </span>
                  </div>
                </div>
                {klineColorScheme === 'green-up-red-down' && (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0ECB81]">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M10 3L4.5 8.5L2 6"
                        stroke="white"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                )}
              </div>

              {/* 红涨绿跌选项 */}
              <div
                className={cn(
                  'flex cursor-pointer items-center justify-between rounded-lg border p-4 transition-all duration-200',
                  klineColorScheme === 'red-up-green-down'
                    ? 'border-[#F6465D] bg-[#F6465D]/10'
                    : 'border-[#333B47] bg-[#1E2026] hover:border-[#F6465D]/50 hover:bg-[#F6465D]/5'
                )}
                onClick={() =>
                  useUIStore.getState().setKlineColorScheme('red-up-green-down')
                }
              >
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-white">
                    {t('redUpGreenDown')}
                  </span>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1">
                      <span className="text-[#F6465D]">↗</span>
                      <span className="text-[#798391]">{t('rise')}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="text-[#0ECB81]">↘</span>
                      <span className="text-[#798391]">{t('fall')}</span>
                    </span>
                  </div>
                </div>
                {klineColorScheme === 'red-up-green-down' && (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#F6465D]">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M10 3L4.5 8.5L2 6"
                        stroke="white"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 市场面板切换 */}
          <div
            className={cn(
              'space-y-3 transition-all duration-300 ease-out',
              settingsDrawerOpen
                ? 'translate-y-0 opacity-100'
                : 'translate-y-2 opacity-0'
            )}
            style={{
              transitionDelay: settingsDrawerOpen ? '250ms' : '0ms',
            }}
          >
            <h3 className="text-sm font-medium text-white">
              {t('marketPanel')}
            </h3>
            <p className="text-xs text-[#798391]">{t('marketPanelDesc')}</p>

            <div className="flex items-center justify-between rounded-lg border border-[#333B47] bg-[#1E2026] p-4">
              <div className="flex flex-col gap-1">
                <span className="text-sm text-white">
                  {t('showMarketPanel')}
                </span>
                <span className="text-xs text-[#798391]">
                  {leftPanelVisible ? t('panelVisible') : t('panelHidden')}
                </span>
              </div>
              <Switch
                checked={leftPanelVisible}
                onCheckedChange={toggleLeftPanelVisible}
              />
            </div>
          </div>

          {/* 重置按钮 */}
          <div
            className={cn(
              'mt-4 border-t border-[#333B47] pt-6 transition-all duration-300 ease-out',
              settingsDrawerOpen
                ? 'translate-y-0 opacity-100'
                : 'translate-y-2 opacity-0'
            )}
            style={{
              transitionDelay: settingsDrawerOpen ? '300ms' : '0ms',
            }}
          >
            <Button
              variant="outline"
              className="w-full border-[#333B47] bg-transparent text-[#798391] hover:bg-[#2A2D3A] hover:text-white"
              onClick={() => {
                // 重置为默认设置
                useUIStore.getState().setKlineColorScheme('green-up-red-down')
                useUIStore.getState().setLeftPanelVisible(true)
              }}
            >
              {t('resetToDefaults')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { ChevronRightIcon } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { TokenPreviewCard } from '@/components/TokenPreviewCard'
import { TokenCreationForm } from '@/components/create-token/TokenCreationForm'
import { useTokenForm } from '@/components/create-token/hooks/useTokenForm'
import { AVAILABLE_TAGS } from '@/components/create-token/config/tabConfig'
import {
  NewTokenIcon,
  IDOIcon,
  BurningIcon,
} from '@/components/create-token/components/TabIcons'

type TabMode = 'new-coin' | 'ido' | 'burning'

export default function CreateTokenPage() {
  const t = useTranslations()
  const [activeTab, setActiveTab] = useState<TabMode>('new-coin')
  const [isPreviewVisible, setIsPreviewVisible] = useState(true)

  // Create separate form instances for each tab to maintain state when switching
  const newCoinForm = useTokenForm('new-coin')
  const idoForm = useTokenForm('ido')
  const burningForm = useTokenForm('burning')

  // Get the active form based on current tab
  const getActiveForm = () => {
    switch (activeTab) {
      case 'new-coin':
        return newCoinForm
      case 'ido':
        return idoForm
      case 'burning':
        return burningForm
      default:
        return newCoinForm
    }
  }

  const activeForm = getActiveForm()

  return (
    <div className="relative mx-auto min-h-screen max-w-[360px] py-8 md:max-w-[800px] xl:max-w-[1200px]">
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as TabMode)}
      >
        <TabsList className="mb-2 h-[40px] w-full p-0 md:mb-12 md:h-[76px] md:p-2">
          <TabsTrigger value="new-coin" className="flex items-center gap-2">
            <NewTokenIcon isActive={activeTab === 'new-coin'} />
            <span className="text-base md:text-[20px]">
              {t('createToken.tabs.newCoin')}
            </span>
          </TabsTrigger>
          <TabsTrigger value="ido" className="flex items-center gap-2">
            <IDOIcon isActive={activeTab === 'ido'} />
            <span className="text-base md:text-[20px]">
              {t('createToken.tabs.ido')}
            </span>
          </TabsTrigger>
          <TabsTrigger value="burning" className="flex items-center gap-2">
            <BurningIcon isActive={activeTab === 'burning'} />
            <span className="text-base md:text-[20px]">
              {t('createToken.tabs.burning')}
            </span>
          </TabsTrigger>
        </TabsList>

        {/* Content for each tab - using the same form component with different modes */}
        <TabsContent value="new-coin">
          <CreateTokenLayout
            mode="new-coin"
            formData={newCoinForm}
            isPreviewVisible={isPreviewVisible}
            onTogglePreview={() => setIsPreviewVisible(!isPreviewVisible)}
          />
        </TabsContent>

        <TabsContent value="ido">
          <CreateTokenLayout
            mode="ido"
            formData={idoForm}
            isPreviewVisible={isPreviewVisible}
            onTogglePreview={() => setIsPreviewVisible(!isPreviewVisible)}
          />
        </TabsContent>

        <TabsContent value="burning">
          <CreateTokenLayout
            mode="burning"
            formData={burningForm}
            isPreviewVisible={isPreviewVisible}
            onTogglePreview={() => setIsPreviewVisible(!isPreviewVisible)}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Layout component that includes the form and preview
function CreateTokenLayout({
  mode,
  formData,
  isPreviewVisible,
  onTogglePreview,
}: {
  mode: TabMode
  formData: ReturnType<typeof useTokenForm>
  isPreviewVisible: boolean
  onTogglePreview: () => void
}) {
  const t = useTranslations()
  const { form, logoPreview, bannerPreview, selectedTags } = formData

  return (
    <div className="relative flex items-stretch justify-center gap-12">
      {/* Left Column - Form with animated width */}
      <div
        className={`flex justify-center gap-4 transition-all duration-300 ease-in-out ${
          !isPreviewVisible
            ? 'w-[360px] md:w-[900px]'
            : 'w-[360px] md:w-[800px]'
        }`}
      >
        <TokenCreationForm mode={mode} formData={formData} />
      </div>

      {/* Show Preview Button - appears when preview is hidden */}
      <div
        className={`absolute top-0 right-0 z-10 transition-all duration-300 ${
          !isPreviewVisible
            ? 'translate-x-0 opacity-100'
            : 'pointer-events-none translate-x-4 opacity-0'
        }`}
      >
        <Button
          onClick={onTogglePreview}
          className="border-1 border-[#2B3139] bg-transparent text-[#656A79]"
        >
          <span>{t('createToken.preview.show')}</span>
          <ChevronRightIcon className="size-3 rotate-180" />
        </Button>
      </div>

      {/* Right Column - Live Preview with slide animation */}
      <div
        className={`relative hidden transition-all duration-500 ease-in-out xl:block ${
          isPreviewVisible ? 'w-[350px] opacity-100' : 'w-0 opacity-0'
        }`}
      >
        <div className="relative h-full w-[350px]">
          <div className="sticky top-32 z-10">
            <div className="space-y-4">
              <div className="flex w-full items-center justify-between">
                <h3 className="text-base font-bold text-[#F0F1F5]">
                  {t('createToken.preview.title')}
                </h3>
                <Button
                  onClick={onTogglePreview}
                  className="border-1 border-[#2B3139] bg-transparent text-[#656A79]"
                >
                  <span>{t('createToken.preview.hide')}</span>
                  <ChevronRightIcon className="size-3" />
                </Button>
              </div>
              <div className="relative pb-20">
                <div className="origin-top-left scale-[1.25] transform will-change-transform">
                  <TokenPreviewCard
                    id="preview"
                    tokenSymbol={form.watch('symbol') || 'SYMBOL'}
                    tokenName={form.watch('coinName') || 'Token Name'}
                    tokenImage={logoPreview}
                    bannerImage={bannerPreview}
                    description={
                      form.watch('description') ||
                      'Token description will appear here...'
                    }
                    tags={selectedTags.map(
                      (tag) =>
                        AVAILABLE_TAGS.find((t) => t.key === tag)?.label || tag
                    )}
                    currentVolume="0 BNB"
                    percentageComplete={0}
                    percentageChange="+0%"
                    launchTime="Launching soon"
                    isVerified={false}
                    commentCount={0}
                    fireCount={0}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

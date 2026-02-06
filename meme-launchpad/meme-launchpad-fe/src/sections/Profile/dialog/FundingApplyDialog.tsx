import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowIcon } from '@/components/ui/arrow-icon'
import { useState } from 'react'
import NewFunding from './TabsContent/NewFunding'
import ApplyingFunding from './TabsContent/ApplyingFunding'
import FinishedFunding from './TabsContent/FinishedFunding'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'

export default function FundingApplyDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [tabValue, setTabValue] = useState('new')
  const t = useTranslations('profile.dialog')
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[880px] rounded-2xl border border-[#2B3139] bg-[#1B1E25] px-8 py-5">
        <DialogHeader>
          <DialogTitle className="text-white">{t('fundingApply')}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <Tabs defaultValue={tabValue} onValueChange={setTabValue}>
            <TabsList className="h-12 w-full bg-[#252832]">
              <TabsTrigger value="new" className="text-base">
                {t('fundingApplyTabs.new')}
                {tabValue === 'new' && (
                  <ArrowIcon direction="down" fillClassName="fill-black" />
                )}
              </TabsTrigger>
              <TabsTrigger value="applying" className="text-base">
                {t('fundingApplyTabs.applying')}
                {tabValue === 'applying' && (
                  <ArrowIcon direction="down" fillClassName="fill-black" />
                )}
              </TabsTrigger>
              <TabsTrigger value="finished" className="text-base">
                {t('fundingApplyTabs.finished')}
                {tabValue === 'finished' && (
                  <ArrowIcon direction="down" fillClassName="fill-black" />
                )}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="new">
              <NewFunding />
            </TabsContent>
            <TabsContent value="applying">
              <ApplyingFunding />
            </TabsContent>
            <TabsContent value="finished">
              <FinishedFunding />
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}

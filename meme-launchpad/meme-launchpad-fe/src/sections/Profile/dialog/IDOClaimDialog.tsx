import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import ClaimImage from '@/assets/common/claim-image.png'
import Image from 'next/image'
import { useAuthStore } from '@/stores/useAuthStore'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'

export default function IDOClaimDialog({
  open,
  onOpenChange,
  tokenAddress,
  amount,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  tokenAddress: string
  amount: string
}) {
  const { user } = useAuthStore()
  const t = useTranslations('profile.dialog')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[388px] rounded-2xl border border-[#2B3139] bg-[#1B1E25] px-8 py-5">
        <DialogHeader>
          <Image
            src={ClaimImage}
            alt="claim"
            width={229}
            height={192}
            className="mx-auto mt-[-120px] block"
          />
          <DialogTitle className="mt-8 flex items-end justify-center gap-1 text-base text-[#FBD537]">
            <span className="text-white">{t('confirmClaim')}</span>
            <span className="text-[32px] leading-[1] font-bold">{amount}</span>
            <span className="font-bold">Token</span>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-2 py-4 text-center text-sm">
          <h3 className="text-white">{t('confirmClaimMessage')}</h3>
          <p className="text-[#656A79]">{user?.address}</p>
        </div>

        <Button className="h-[50px] w-full rounded-lg bg-[#FBD537] text-lg font-bold text-black hover:bg-[#FBD537]/90">
          {t('confirmClaimButton')}
        </Button>
      </DialogContent>
    </Dialog>
  )
}

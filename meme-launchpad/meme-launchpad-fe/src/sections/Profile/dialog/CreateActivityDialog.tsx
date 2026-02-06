import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useMemo, useState } from 'react'
import { debounce } from 'lodash'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import { useTokenDetail } from '@/api/endpoints/tokens/queries'
import { type TokenListItem } from '@/api/schemas/token.schema'
import { LoadingButton } from '@/components/Loading'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

export default function CreateActivityDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const t = useTranslations('profile.dialog')
  const params = useParams()
  const locale = params.locale as string
  const [validateAddress, setValidateAddress] = useState<string | undefined>(
    undefined
  )

  const debouncedSetCaAddress = useMemo(
    () =>
      debounce((value: string) => {
        setValidateAddress(value)
      }, 500),
    []
  )

  const { data, isLoading } = useTokenDetail(validateAddress as string)

  const tokenDetail = useMemo(() => {
    if (!data) return null
    return data.data
  }, [data])

  const onDialogOpenChange = (open: boolean) => {
    onOpenChange(open)
    setValidateAddress(undefined)
  }

  return (
    <Dialog open={open} onOpenChange={onDialogOpenChange}>
      <DialogContent className="w-[480px] rounded-2xl border border-[#2B3139] bg-[#1B1E25] px-8 py-5">
        <DialogHeader>
          <DialogTitle className="text-white">
            {t('createActivity')}
          </DialogTitle>
        </DialogHeader>
        <p className="pt-5 text-base text-white">
          {t('createActivityAboutCA')}
        </p>
        <Input
          placeholder={t('createActivityInput')}
          className="h-[50px] rounded-lg border-none bg-[#15181E] px-4 text-white"
          onChange={(e) => {
            debouncedSetCaAddress(e.target.value)
          }}
        />
        {isLoading && (
          <div className="mt-4 flex h-[50px] items-center justify-center rounded-lg bg-[#15181E]">
            <LoadingButton className="h-10 w-10" />
          </div>
        )}
        {tokenDetail && !isLoading && !!validateAddress && (
          <TokenDetail tokenDetail={tokenDetail} />
        )}
        {!tokenDetail && !isLoading && !!validateAddress && (
          <div className="mt-4 h-[50px] rounded-lg bg-[#15181E] text-center leading-[50px] text-white">
            No Data
          </div>
        )}
        <Link
          href={`/${locale}/profile/create-event/${tokenDetail?.tokenContractAddress || validateAddress} `}
        >
          <Button
            disabled={!tokenDetail}
            className="mt-6 h-[50px] w-full rounded-lg bg-[#FBD537] text-base font-bold text-black hover:bg-[#FBD537]/90"
          >
            {t('createActivityButton')} <ArrowRight size={16} />
          </Button>
        </Link>
      </DialogContent>
    </Dialog>
  )
}

function TokenDetail({ tokenDetail }: { tokenDetail: TokenListItem }) {
  return (
    <div className="mt-4 flex items-center gap-2 rounded-lg bg-[#15181E] px-3 py-2 text-white">
      <img
        src={tokenDetail.logo || '/assets/images/placeholder-token.svg'}
        alt="logo"
        className="h-11 w-11 rounded-lg"
      />
      <div>
        <p className="text-base text-white">{tokenDetail.symbol}</p>
        <p className="text-sm text-[#ffffff]/40">{tokenDetail.name}</p>
      </div>
    </div>
  )
}

import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'

export default function ApplyButton({ address }: { address: string }) {
  const params = useParams()
  const locale = params.locale as string
  const t = useTranslations('profile')
  return (
    <Link href={`/${locale}/profile/create-event/${address}`}>
      <button className="flex items-center justify-center gap-1 rounded-md bg-[#191B22] px-2 py-1.5 text-xs text-white hover:text-[#ffffff]/80">
        <span>{t('apply')}</span>
        <ChevronRight size={12} className="text-[#656A79]" />
      </button>
    </Link>
  )
}

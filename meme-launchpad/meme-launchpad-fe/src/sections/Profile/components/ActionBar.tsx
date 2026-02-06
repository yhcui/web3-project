import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { debounce } from 'lodash'

export default function ActionBar({
  isOnlySearch = false,
  onSearch,
  onCreateActivity,
}: {
  isOnlySearch?: boolean
  onSearch?: (value: string) => void
  onCreateActivity?: () => void
}) {
  const pathname = usePathname()
  const t = useTranslations('profile.actions')
  const [tokenSymbol, setTokenSymbol] = useState('')
  const currentLocale = pathname.split('/')[1] || 'en'

  const debouncedSearch = useMemo(
    () => debounce((value: string) => onSearch?.(value), 300),
    [onSearch]
  )

  return (
    <div className="flex items-center justify-start gap-4">
      {!isOnlySearch ? (
        <>
          <Link href={`/${currentLocale}/create-token`}>
            <button className="h-8 shrink-0 rounded-md bg-[] px-2 text-xs font-bold text-black transition-colors hover:bg-[#cbaa1e] md:h-10 md:px-6 md:text-sm">
              {t('createCoin')}
            </button>
          </Link>
          <button
            onClick={onCreateActivity}
            className="h-8 shrink-0 rounded-md bg-[] px-2 text-xs font-bold text-black transition-colors hover:bg-[#cbaa1e] md:h-10 md:px-6 md:text-sm"
          >
            {t('createActivity')}
          </button>
        </>
      ) : null}

      <div className="box-border flex h-8 items-center rounded-[8px] border border-[#2B3139] px-3 focus-within:border-[] md:h-10 md:h-auto md:w-[260px]">
        <Search size={16} color="#656A79" />
        <Input
          className="hidden h-10 border-0 bg-transparent px-2 text-sm text-[#C8C7D8] placeholder-[#6E6D7A] md:block"
          placeholder="Search"
          type="text"
          value={tokenSymbol}
          onChange={(e) => {
            setTokenSymbol(e.target.value)
            debouncedSearch(e.target.value)
          }}
          autoFocus={false}
        />
      </div>
    </div>
  )
}

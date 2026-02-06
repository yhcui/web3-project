import { useState, useMemo, useEffect } from 'react'
import {
  RANKING_PAGE_TYPE_VALUES,
  RANKING_CATEGORY_TYPE,
  RANKING_CATEGORY_TYPE_VALUES,
  RANKING_TABLE_LABELS,
  type RANKING_TABLE_LABEL_VALUES,
} from '@/enums/ranking'
import { useRankingList } from '@/api/endpoints/ranking'
import { Pagination } from '@/components/Pagination'
import { LoadingButton } from '@/components/Loading'
import TokenItem from './TokenItem'
import { AlignJustify } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import useIsMobile from '@/hooks/use-is-mobile'
import { useTranslations } from 'next-intl'
import Sort, { type SortDirection } from '@/components/TableHeadSort'
import { DataWrapper } from '@/components/DataWrapper'

export default function TokenList({
  pageType,
  enabledV3,
  tokenSymbol,
}: {
  pageType: RANKING_PAGE_TYPE_VALUES
  enabledV3: boolean
  tokenSymbol: string
}) {
  const pageSize = 10
  const [currentPage, setCurrentPage] = useState(1)
  const [category, setCategory] = useState('0')
  const isMobile = useIsMobile()
  const tTags = useTranslations('ranking.tags')
  const tSort = useTranslations('ranking.sort')
  const categories = {
    [RANKING_CATEGORY_TYPE.ALL]: tTags('all'),
    [RANKING_CATEGORY_TYPE.AI]: tTags('ai'),
    [RANKING_CATEGORY_TYPE.DEFI]: tTags('defi'),
    [RANKING_CATEGORY_TYPE.GAME]: tTags('games'),
    [RANKING_CATEGORY_TYPE.INFRA]: tTags('infra'),
    [RANKING_CATEGORY_TYPE.DESCI]: tTags('deSci'),
    [RANKING_CATEGORY_TYPE.DEPIN]: tTags('depin'),
    [RANKING_CATEGORY_TYPE.CHARITY]: tTags('charity'),
    [RANKING_CATEGORY_TYPE.OTHERS]: tTags('others'),
    [RANKING_CATEGORY_TYPE.SOCIAL]: tTags('social'),
  }

  const [tableHeader, setTableHeader] = useState<{
    [key in RANKING_TABLE_LABEL_VALUES]: {
      label: string
      direction: SortDirection
    }
  }>({})

  useEffect(() => {
    if (isMobile) {
      setTableHeader({
        [RANKING_TABLE_LABELS.NAME]: {
          label: tSort('name'),
          direction: 'default',
        },
        [RANKING_TABLE_LABELS.CHANGE24H]: {
          label: tSort('change24h'),
          direction: 'default',
        },
        [RANKING_TABLE_LABELS.MARKET_CAP]: {
          label: tSort('marketCap'),
          direction: 'default',
        },
      })
    } else {
      setTableHeader({
        [RANKING_TABLE_LABELS.NAME]: {
          label: tSort('name'),
          direction: 'default',
        },
        [RANKING_TABLE_LABELS.HOT]: {
          label: tSort('hot'),
          direction: 'default',
        },
        [RANKING_TABLE_LABELS.PRICE]: {
          label: tSort('price'),
          direction: 'default',
        },
        [RANKING_TABLE_LABELS.CHANGE24H]: {
          label: tSort('change24h'),
          direction: 'default',
        },
        [RANKING_TABLE_LABELS.VOLUME24H]: {
          label: tSort('volume24h'),
          direction: 'default',
        },
        [RANKING_TABLE_LABELS.MARKET_CAP]: {
          label: tSort('marketCap'),
          direction: 'default',
        },
        [RANKING_TABLE_LABELS.TX_COUNT]: {
          label: tSort('txCount'),
          direction: 'default',
        },
        [RANKING_TABLE_LABELS.HOLDERS]: {
          label: tSort('holders'),
          direction: 'default',
        },
        [RANKING_TABLE_LABELS.TOP10_PERCENT]: {
          label: tSort('top10'),
          direction: 'default',
        },
        [RANKING_TABLE_LABELS.AGE_DAYS]: {
          label: tSort('age'),
          direction: 'default',
        },
        [RANKING_TABLE_LABELS.PROGRESS]: {
          label: tSort('progress'),
          direction: 'default',
        },
      })
    }
  }, [isMobile])

  const params = useMemo(() => {
    const sort = Object.keys(tableHeader).reduce(
      (acc: any, cur: any) => {
        if (tableHeader[cur].direction !== 'default') {
          acc.type.push(tableHeader[cur].direction)
          acc.field.push(cur)
        }
        return acc
      },
      { type: [], field: [] }
    )

    const platform = enabledV3 ? 1 : 0
    return {
      pn: currentPage,
      ps: pageSize,
      pageType,
      category,
      platform: platform,
      tokenSymbol: tokenSymbol,
      sortField: sort.field.join(','),
      sortType: sort.type.join(','),
    }
  }, [pageType, category, tableHeader, currentPage, enabledV3, tokenSymbol])

  const {
    data: rankingList,
    isLoading,
    isError,
    error,
  } = useRankingList(params)

  const totalPages = useMemo(() => {
    return rankingList?.data.totalPage || 1
  }, [rankingList])

  const items = useMemo(() => {
    if (!rankingList?.data?.list) return []
    return rankingList.data.list.map((item) => ({
      ...item,
    }))
  }, [rankingList])

  return (
    <div className="mt-[12px]">
      {/* Category */}
      <div className="relative flex w-full items-center overflow-hidden">
        {Object.keys(categories).map((item) => (
          <div
            key={item}
            className={`shrink-0 cursor-pointer rounded-[4px] px-3 py-[3px] text-[14px] leading-[16px] transition-colors ${
              item === category
                ? 'bg-[#23262B] text-white'
                : 'font-normal text-[#656A79] hover:bg-[#23262B] hover:font-bold hover:text-white'
            } `}
            onClick={() => setCategory(item)}
          >
            {categories[item as RANKING_CATEGORY_TYPE_VALUES]}
          </div>
        ))}
        <div className="absolute top-0 right-0 bottom-0 flex w-24 items-center justify-end bg-gradient-to-l from-[#111319] via-[#111319]/50 to-transparent md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <AlignJustify size={20} className="text-white" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="min-w-[100px] border-[#2B3139] bg-[#1a1d29]">
              <DropdownMenuRadioGroup
                value={category}
                onValueChange={setCategory}
              >
                {Object.keys(categories).map((item) => (
                  <DropdownMenuRadioItem
                    key={item}
                    value={item}
                    className="cursor-pointer"
                  >
                    {categories[item as RANKING_CATEGORY_TYPE_VALUES]}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Table */}
      <div className="mt-5 w-full">
        {/* 表头 Desktop */}
        <div className="grid grid-cols-12 pb-4 text-[14px] text-[#FFFFFFCC] md:grid-cols-37">
          {Object.keys(tableHeader).map((key, idx) => (
            <div
              className={`col-span-3 ${
                idx === 0
                  ? 'col-span-5 flex items-center justify-start pl-8'
                  : idx === Object.keys(tableHeader).length - 1
                    ? 'col-span-3 pr-2 md:col-span-5'
                    : ''
              }`}
              key={key}
            >
              <Sort
                title={tableHeader[key].label}
                sortKey={
                  [
                    RANKING_TABLE_LABELS.NAME,
                    RANKING_TABLE_LABELS.PROGRESS,
                  ].includes(key)
                    ? null
                    : key
                }
                sortDirection={tableHeader[key].direction as SortDirection}
                onChange={(key, direction) => {
                  setTableHeader((prev) => {
                    const newState = { ...prev }
                    newState[key].direction = direction
                    return newState
                  })
                }}
              />
            </div>
          ))}
        </div>

        {/* 内容区域 */}
        <DataWrapper list={items} loading={isLoading}>
          {items.map((token, idx) => (
            <TokenItem
              key={idx}
              token={token}
              pageSize={pageSize}
              currentPage={currentPage}
              idx={idx}
            />
          ))}
        </DataWrapper>
      </div>

      {/* Pagination */}
      {!isLoading && !isError && totalPages > 1 && (
        <div className="mt-12 flex justify-end">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </div>
      )}
    </div>
  )
}

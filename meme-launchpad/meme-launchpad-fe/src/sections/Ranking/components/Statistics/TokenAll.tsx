import Tab from '@/components/Tab'
import TokenList from './TokenList'
import {
  RANKING_PAGE_TYPE,
  type RANKING_PAGE_TYPE_VALUES,
} from '@/enums/ranking'
import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import Image from 'next/image'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useTranslations } from 'next-intl'

export default function TokenAll() {
  const tTabs = useTranslations('ranking.tabs')

  // 当前激活的 tab
  const [activeTab, setActiveTab] = useState<RANKING_PAGE_TYPE_VALUES>(
    RANKING_PAGE_TYPE.CRYPTOS
  )

  // 记录已渲染过的 tab（懒加载 + 缓存）
  const [renderedTabs, setRenderedTabs] = useState<RANKING_PAGE_TYPE_VALUES[]>([
    RANKING_PAGE_TYPE.CRYPTOS,
  ])

  // 提升到父组件的筛选条件
  const [enabledV3, setEnabledV3] = useState(false)
  const [tokenSymbol, setTokenSymbol] = useState('')

  const handleTabChange = (key: RANKING_PAGE_TYPE_VALUES) => {
    setActiveTab(key)
    if (!renderedTabs.includes(key)) {
      setRenderedTabs([...renderedTabs, key])
    }
  }

  const tabs = [
    {
      label: tTabs('favorite'),
      key: RANKING_PAGE_TYPE.FAVORITES,
      content: renderedTabs.includes(RANKING_PAGE_TYPE.FAVORITES) && (
        <TokenList
          pageType={RANKING_PAGE_TYPE.FAVORITES}
          enabledV3={enabledV3}
          tokenSymbol={tokenSymbol}
        />
      ),
    },
    {
      label: tTabs('crypto'),
      key: RANKING_PAGE_TYPE.CRYPTOS,
      content: renderedTabs.includes(RANKING_PAGE_TYPE.CRYPTOS) && (
        <TokenList
          pageType={RANKING_PAGE_TYPE.CRYPTOS}
          enabledV3={enabledV3}
          tokenSymbol={tokenSymbol}
        />
      ),
    },
    {
      label: tTabs('new'),
      key: RANKING_PAGE_TYPE.NEW,
      content: renderedTabs.includes(RANKING_PAGE_TYPE.NEW) && (
        <TokenList
          pageType={RANKING_PAGE_TYPE.NEW}
          enabledV3={enabledV3}
          tokenSymbol={tokenSymbol}
        />
      ),
    },
  ]

  return (
    <div className="mt-[32px] w-full overflow-x-auto">
      <Tab
        tabs={tabs}
        activeKey={activeTab}
        onChange={(key) => handleTabChange(key as RANKING_PAGE_TYPE_VALUES)}
        tabClass="text-sm leading-[24px] md:text-[20px] md:leading-[36px]"
        activeTabClass="text-base leading-[30px] md:text-[20px] md:leading-[36px]"
        filterComponent={
          <FilterComponent
            enabledV3={enabledV3}
            setEnabledV3={setEnabledV3}
            tokenSymbol={tokenSymbol}
            setTokenSymbol={setTokenSymbol}
          />
        }
      />
    </div>
  )
}

// 筛选组件（无状态，依赖父组件传值）
const FilterComponent: React.FC<{
  enabledV3: boolean
  setEnabledV3: (v: boolean) => void
  tokenSymbol: string
  setTokenSymbol: (v: string) => void
}> = ({ enabledV3, setEnabledV3, tokenSymbol, setTokenSymbol }) => {
  return (
    <div className="flex items-center gap-3">
      {/* V3 Badge */}
      <Label className="ml-auto flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-[#2B3139] p-3 px-4 py-0 hover:border-[] has-[[aria-checked=true]]:border-[]">
        <Checkbox
          id="v3check"
          checked={enabledV3}
          onCheckedChange={(checked) => setEnabledV3(!!checked)}
          className="hidden"
        />
        <Image
          src="/assets/images/v3-icon.png"
          alt="V3"
          width={24}
          height={24}
        />
        <span className="text-sm leading-5 font-medium text-[#F3F3F3]">V3</span>
      </Label>

      {/* 搜索框 */}
      <div className="box-border flex h-9 items-center rounded-[8px] border border-[#2B3139] px-3 focus-within:border-[] md:h-auto">
        <Search size={16} color="#656A79" />
        <Input
          className="hidden border-0 bg-transparent px-2 text-sm text-[#C8C7D8] placeholder-[#6E6D7A] md:block"
          placeholder="Search"
          type="text"
          value={tokenSymbol}
          onChange={(e) => setTokenSymbol(e.target.value)}
          autoFocus={false}
        />
      </div>
    </div>
  )
}

import Token from '../Token'
import { type TokenTypeConfig } from '../../tokenTypes'
import { type AdvancedTokenItem } from '@/api/endpoints/advanced'
import React from 'react'
import { DataWrapper } from '@/components/DataWrapper'
interface TokenListProps {
  config?: TokenTypeConfig
  items?: AdvancedTokenItem[]
  isLoading?: boolean
}

function TokenList({ config, items = [], isLoading = false }: TokenListProps) {
  return (
    <div className="scrollbar-hide h-lvh overflow-y-auto md:px-3">
      <DataWrapper list={items} loading={isLoading} className="min-h-[500px]">
        {items.map((item, index) => (
          <Token
            key={`${item.tokenID}-${index}`}
            config={config}
            token={item}
          />
        ))}
      </DataWrapper>
    </div>
  )
}

export default React.memo(TokenList)

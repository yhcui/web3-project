"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TraitFilters } from "./trait-filters"
import { ListingsTable } from "./listings-table"
import { TradingView } from "./trading-view"
import { RecentActivity } from "./recent-activity"

export function CollectionView() {
  return (
    <div className="container mx-auto px-4 py-6">
      <Tabs defaultIndex={0} className="space-y-4">
        <TabsList>
          <TabsTrigger>物品</TabsTrigger>
          <TabsTrigger>活动</TabsTrigger>
          <TabsTrigger>分析</TabsTrigger>
        </TabsList>
        <TabsContent>
          <div className="grid grid-cols-[250px_1fr_250px] gap-6">
            <TraitFilters />
            <ListingsTable />
            <RecentActivity />
          </div>
          <TradingView />
        </TabsContent>
        <TabsContent>{/* 活动内容 */}</TabsContent>
        <TabsContent>{/* 分析内容 */}</TabsContent>
      </Tabs>
    </div>
  )
}


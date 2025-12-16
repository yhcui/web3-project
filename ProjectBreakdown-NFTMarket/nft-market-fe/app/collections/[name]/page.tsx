'use client'

import { CollectionView } from "./components/collection-view"
import { CollectionHeader } from "./components/collection-header"
import collectionApi from "@/api/collections"
import { useEffect } from "react"
import { useGlobalState } from "@/hooks/useGlobalState"


export default function Page() {

  const { state, setState } = useGlobalState();
  useEffect(() => {
    getCollectionDetail()
    getCollectionItems()
  }, [])

  async function getCollectionDetail() {
    // 从 path 中读取address
    const address = window.location.pathname.split('/').pop() || ''
    const res = await collectionApi.GetCollectionDetail({
      address,
      chain_id: state.chain_id,
    })
    // console.log(res, '=res')

    setState({
      // @ts-ignore
      collection: res.result,
    })
  }

  async function getCollectionItems() {
    const res = await collectionApi.GetCollectionItems({
      address: state.collection_address,
      filters: {
        sort: 1,
        status: [1, 2],
        markets: [],
        // token_id: '0',
        user_address: state.user_address,
        chain_id: state.chain_id,
        page: 1,
        page_size: 20,
      }
    })
    console.log(res, '=res')
  }


  return (
    <main className="min-h-screen bg-background text-foreground">
      <CollectionHeader />
      <CollectionView />
    </main>
  )
}


import NFTGallery from '@/components/nft/NFTGallery'
import NFTDemo from '@/components/nft/NFTDemo'
import { NetworkChecker } from '@/components/NetworkChecker'

export default function NFTsPage() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-12">
      <NetworkChecker>
        {/* 用户的NFT画廊 */}
        <NFTGallery />
        
        {/* 分隔线 */}
        <div className="border-t border-border"></div>
        
        {/* NFT API 演示 */}
        <div>
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold text-foreground mb-2">NFT API 演示</h2>
            <p className="text-muted-foreground">
              测试 zan_getNFTsByOwner API 接口，查询任意地址的NFT
            </p>
          </div>
          <NFTDemo />
        </div>
      </NetworkChecker>
    </div>
  )
}

export const metadata = {
  title: 'NFT收藏 - MetaNodeSwap',
  description: '查看您的NFT收藏并测试NFT API',
} 
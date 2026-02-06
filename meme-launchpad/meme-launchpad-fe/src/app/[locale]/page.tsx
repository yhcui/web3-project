import { TrendingSection } from '@/components/TrendingSection'
import { LaunchSection } from '@/components/LaunchSection'
import { TrendingTokensCarousel } from '@/components/TrendingTokensCarousel'

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center pb-10">
      <TrendingTokensCarousel />
      <TrendingSection />
      <LaunchSection />
    </div>
  )
}

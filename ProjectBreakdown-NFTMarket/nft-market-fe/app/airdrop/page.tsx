import { SeasonTabs } from "./components/season-tabs"
import { RarityBoxes } from "./components/rarity-boxes"
import { RccLogo } from "./components/rcc-logo"

export default function Page() {
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto relative">
        <SeasonTabs />

        <div className="mt-16 text-center space-y-12">
          <h1 className="text-6xl font-bold tracking-wider text-[#8e67e9] animate-glow">RCC SEASON ONE FINALE</h1>

          <p className="text-xl font-mono">
          RCC Season 1 is officially over. It's time to take Blur to the next level - Season 2 now begins.
          </p>

          <RarityBoxes />

          {/* <button className="px-8 py-3 bg-[#8e67e9] hover:bg-[#8e67e9] text-black font-bold rounded transition-colors uppercase tracking-wider">
            View Season 4
          </button> */}
        </div>

        {/* <div className="fixed left-4 top-1/2 -translate-y-1/2 space-y-4">
          <RccLogo />
          <RccLogo />
          <RccLogo />
        </div>

        <div className="fixed right-4 top-1/2 -translate-y-1/2 space-y-4">
          <RccLogo />
          <RccLogo />
          <RccLogo />
        </div> */}
      </div>
    </div>
  )
}


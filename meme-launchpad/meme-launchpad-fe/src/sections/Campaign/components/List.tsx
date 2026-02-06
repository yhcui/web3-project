import { useState } from 'react'
import Card from './Card'

export default function List() {
  const tabs = [
    { key: 'all', label: '所有活动', color: 'text-white', showHot: false },
    {
      key: 'airdrop',
      label: (
        <div className="flex items-center gap-1">
          <span
            style={{
              background: 'linear-gradient(270deg, #FFFFFD 0%,  100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            🏆空投活动
          </span>
          <svg
            width="17"
            height="17"
            viewBox="0 0 17 17"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M4.84172 17C3.96198 15.5125 4.41566 14.4387 5.24547 13.549C6.2814 12.4006 6.57358 11.0462 6.57358 11.0462C6.57358 11.0462 7.85814 12.0615 7.85814 13.549C9.37219 12.0681 9.24257 9.82789 9.03538 8.94011C12.9645 11.8056 13.5063 13.6831 11.5099 17C22.1115 11.7867 14.3415 3.96856 12.9655 3.13933C13.4468 4.02711 13.5159 5.50894 12.5512 6.21917C10.9681 1.00678 7.04427 0 7.04427 0C7.52558 2.66522 5.39209 5.5675 3.32661 7.75956C3.25754 6.69328 3.18848 5.98211 2.50105 4.91678C2.36293 6.87178 0.641688 8.41122 0.160378 10.3662C-0.460117 13.0314 0.641688 14.9269 4.84172 17Z"
              fill="url(#paint0_linear_604_17838)"
            />
            <defs>
              <linearGradient
                id="paint0_linear_604_17838"
                x1="8.05263"
                y1="3.10121e-09"
                x2="7.67252"
                y2="16.9915"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#FFC014" />
                <stop offset="1" stopColor="#EB2B00" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      ),
      color: 'text-[#FFD600]',
      showHot: false,
    },
    {
      key: 'launch',
      label: '🚀即将发射',
      color: 'text-[#A1A6B3]',
      showHot: false,
    },
    {
      key: 'trade',
      label: '🏆交易赛事',
      color: 'text-[#A1A6B3]',
      showHot: false,
    },
    { key: 'other', label: '其他', color: 'text-[#A1A6B3]', showHot: false },
  ]

  const [activeTab, setActiveTab] = useState(0)

  return (
    <div className="mt-[44px]">
      <div className="flex items-center gap-[32px] text-[18px] font-medium">
        {tabs.map((tab, idx) => (
          <div
            key={tab.key}
            className="flex cursor-pointer flex-col items-center"
            onClick={() => setActiveTab(idx)}
          >
            <div
              className={`flex items-center ${activeTab === idx ? 'text-white' : tab.color}`}
            >
              <span className="mr-1">{tab.label}</span>
              {tab.showHot && (
                <span className="ml-1 text-[16px] text-[#FF7A00]">🔥</span>
              )}
            </div>
            <div
              className={`mt-[4px] h-[3px] w-[24px] rounded bg-[#FFD600] transition-all duration-200 ${
                activeTab === idx ? 'opacity-100' : 'opacity-0'
              }`}
            />
          </div>
        ))}
      </div>
      <div className="mt-[20px] grid grid-cols-3 gap-[20px]">
        {Array.from({ length: 10 }).map((_, idx) => (
          <Card key={idx} />
        ))}
      </div>
    </div>
  )
}

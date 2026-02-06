import Tab from '@/components/Tab'
import User from './components/User'
import IDOTokens from './panels/IDOTokens'
import CreatedTokens from './panels/CreatedTokens'
import OwnedTokens from './panels/OwnedTokens'
import FollowedTokens from './panels/FollowedTokens'
import JoinedActivities from './panels/JoinedActivities'
import CreatedActivities from './panels/CreatedActivities'
import Following from './panels/Following'
import Follower from './panels/Follower'
import CreateActivityDialog from './dialog/CreateActivityDialog'
import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'

export default function Profile() {
  const t = useTranslations('profile')
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const tab = searchParams.get('tab')
  const currentLocale = pathname.split('/')[1] || 'en'
  const [activeTab, setActiveTab] = useState('created')

  useEffect(() => {
    if (tab) {
      setActiveTab(tab)
    } else {
      setActiveTab('created')
    }
  }, [tab])

  const tabs = [
    {
      label: t('tabs.ido'),
      key: 'ido',
      content: (
        <IDOTokens
          onCreateActivity={() => {
            setOpen(true)
          }}
        />
      ),
    },
    {
      label: t('tabs.created'),
      key: 'created',
      content: (
        <CreatedTokens
          onCreateActivity={() => {
            setOpen(true)
          }}
        />
      ),
    },
    {
      label: t('tabs.owned'),
      key: 'owned',
      content: (
        <OwnedTokens
          onCreateActivity={() => {
            setOpen(true)
          }}
        />
      ),
    },
    {
      label: t('tabs.followed'),
      key: 'followed',
      content: (
        <FollowedTokens
          onCreateActivity={() => {
            setOpen(true)
          }}
        />
      ),
    },
    {
      label: t('tabs.activities'),
      key: 'activities',
      content: (
        <JoinedActivities
          onCreateActivity={() => {
            setOpen(true)
          }}
        />
      ),
    },
    {
      label: t('tabs.createdActivities'),
      key: 'created_activities',
      content: (
        <CreatedActivities
          onCreateActivity={() => {
            setOpen(true)
          }}
        />
      ),
    },
    {
      label: t('tabs.following'),
      key: 'following',
      content: <Following />,
    },
    {
      label: t('tabs.followers'),
      key: 'followers',
      content: <Follower />,
    },
  ]

  return (
    <div className="mx-auto max-w-[1200px] px-2">
      <User />
      <div className="mt-8">
        <Tab
          tabs={tabs}
          activeKey={activeTab}
          showLine={true}
          className="w-full shrink-0 overflow-x-auto text-sm leading-[36px] md:text-base"
          activeTabClass="text-sm md:text-[18px] font-bold leading-[40px]"
          onChange={(key) => {
            setActiveTab(key as string)
            router.push(`/${currentLocale}/profile?tab=${key}`)
          }}
        />
      </div>

      <CreateActivityDialog open={open} onOpenChange={setOpen} />
    </div>
  )
}

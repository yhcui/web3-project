'use client'

import { useState, useRef, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { Send, Smile } from 'lucide-react'
import { useCommentList } from '@/api/endpoints/comments'
import { usePostComment } from '@/api/endpoints/comments'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDistanceToNow } from 'date-fns'
import { zhCN, enUS } from 'date-fns/locale'
import { useLocale } from 'next-intl'
import { useAccount } from 'wagmi'
import { IconsSendIcon } from '@/components/icons/generated/icons/IconsSendIcon'

interface ChatRoomProps {
  tokenAddress: string
  tokenId?: number
  className?: string
}

// Mock user star levels based on address for demo
const getUserStarLevel = (address: string): number => {
  const sum = address
    .toLowerCase()
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return sum % 6 // Returns 0-5
}

// Get star color based on level - matching Figma design
const getStarGradient = (level: number) => {
  switch (level) {
    case 5:
      return 'linear-gradient(208deg, rgba(255, 230, 126, 1) 12%, rgba(195, 150, 0, 1) 96%)' // Gold
    case 4:
      return 'linear-gradient(60deg, rgba(225, 175, 110, 1) 50%, rgba(188, 116, 69, 1) 88%)' // Bronze
    case 3:
      return 'linear-gradient(60deg, rgba(225, 175, 110, 1) 50%, rgba(188, 116, 69, 1) 88%)' // Bronze
    case 2:
      return 'linear-gradient(63deg, rgba(178, 203, 228, 1) 56%, rgba(150, 184, 218, 1) 87%)' // Silver
    case 1:
      return 'linear-gradient(51deg, rgba(144, 171, 200, 1) 19%, rgba(88, 132, 178, 1) 84%)' // Blue
    case 0:
    default:
      return 'linear-gradient(62deg, rgba(95, 117, 142, 1) 34%, rgba(78, 101, 125, 1) 75%)' // Gray
  }
}

// Star component with level indicator
const StarRating = ({ level }: { level: number }) => {
  return (
    <div className="relative h-4 w-4">
      {/* Star background */}
      <svg
        className="absolute inset-0"
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
      >
        <path
          d="M8 1L10.163 5.379L15 6.087L11.5 9.493L12.326 14.313L8 12.021L3.674 14.313L4.5 9.493L1 6.087L5.837 5.379L8 1Z"
          fill="url(#star-gradient)"
        />
        <defs>
          <linearGradient
            id="star-gradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop
              offset="0%"
              style={{
                stopColor:
                  level === 5
                    ? '#FFE67E'
                    : level === 4
                      ? '#E1AF6E'
                      : level === 3
                        ? '#E1AF6E'
                        : level === 2
                          ? '#B2CBE4'
                          : level === 1
                            ? '#90ABC8'
                            : '#5F758E',
              }}
            />
            <stop
              offset="100%"
              style={{
                stopColor:
                  level === 5
                    ? '#C39600'
                    : level === 4
                      ? '#BC7445'
                      : level === 3
                        ? '#BC7445'
                        : level === 2
                          ? '#96B8DA'
                          : level === 1
                            ? '#5884B2'
                            : '#4E657D',
              }}
            />
          </linearGradient>
        </defs>
      </svg>
      {/* Level number */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className="text-[6px] font-black"
          style={{
            color: level >= 3 ? '#62300F' : level >= 1 ? '#19222B' : '#13202D',
          }}
        >
          {level}
        </span>
      </div>
    </div>
  )
}

export function ChatRoom({
  tokenAddress,
  tokenId = 1,
  className,
}: ChatRoomProps) {
  const t = useTranslations('Token.ChatRoom')
  const locale = useLocale()
  const { isConnected } = useAccount()
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Fetch comments
  const { data: commentsData, isLoading, refetch } = useCommentList(tokenId)

  // Post comment mutation
  const postCommentMutation = usePostComment()

  // Mock comments for development
  const mockComments = [
    {
      id: 1,
      walletAddress: '0x31990c88e8b8e8b8e8b8e8b8e8b8e8b8e1d8a9a',
      content:
        '已付款，请尽快放行，谢谢谢谢谢谢谢谢谢谢谢谢谢谢谢谢谢谢谢谢谢谢谢谢谢谢',
      createdAt: '2025-07-18T10:30:00Z',
      holdingAmount: '1000',
    },
    {
      id: 2,
      walletAddress: '0x31990c88e8b8e8b8e8b8e8b8e8b8e8b8e1d8a9b',
      content:
        '已付款，请尽快放行，谢谢谢谢谢谢谢谢谢谢谢谢谢谢谢谢谢谢谢谢谢谢谢谢谢谢',
      createdAt: '2025-07-18T09:20:00Z',
      holdingAmount: '500',
    },
    {
      id: 3,
      walletAddress: '0x31990c88e8b8e8b8e8b8e8b8e8b8e8b8e1d8a9c',
      content:
        '♥1.付款后请在vx窗口发您币安账号《真实姓名》，不然无法核对发货。♥2.已下过单的亲，近期不要再次下单，不然风控收不了钱！.未付款请提前点击《我已付款》。.当前订单量较大，处理需要一定时间，急单勿拍。',
      createdAt: '2025-07-18T08:15:00Z',
      holdingAmount: '2000',
    },
    {
      id: 4,
      walletAddress: '0x31990c88e8b8e8b8e8b8e8b8e8b8e8b8e1d8a9d',
      content:
        '♥1.付款后请在vx窗口发您币安账号《真实姓名》，不然无法核对发货。♥2.已下过单的亲，近期不要再次下单，不然风控收不了钱！.未付款请提前点击《我已付款》。.当前订单量较大，处理需要一定时间，急单勿拍。',
      createdAt: '2025-07-18T07:30:00Z',
      holdingAmount: '100',
    },
    {
      id: 5,
      walletAddress: '0x31990c88e8b8e8b8e8b8e8b8e8b8e8b8e1d8a9e',
      content: '♥1.付款后请在vx窗口发您币安账号《真实姓名》',
      createdAt: '2025-07-18T06:45:00Z',
      holdingAmount: '750',
    },
    {
      id: 6,
      walletAddress: '0x31990c88e8b8e8b8e8b8e8b8e8b8e8b8e1d8a9f',
      content:
        'ahead and support the most popularmeme thase days\nHello everyone, go ahead and support the most popular meme these daysHello everyone, go',
      createdAt: '2025-07-18T05:20:00Z',
      holdingAmount: '300',
    },
    {
      id: 7,
      walletAddress: '0x31990c88e8b8e8b8e8b8e8b8e8b8e8b8e1d8aa0',
      content:
        'ahead and support the most popularmeme thase days\nHello everyone, go ahead and support the most popular meme these daysHello everyone, go',
      createdAt: '2025-07-18T04:10:00Z',
      holdingAmount: '450',
    },
  ]

  // Use mock data for now
  const comments = commentsData?.data?.comments || mockComments

  // Auto-scroll disabled
  // useEffect(() => {
  //   messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  // }, [comments])

  const formatAddress = (address: string) => {
    if (!address) return '0x0000...0000'
    if (address.length < 10) return address
    return `${address.slice(0, 6)}...${address.slice(-6)}`
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      // Format as YYYY-MM-DD
      return date.toISOString().split('T')[0]
    } catch {
      return '2025-07-18'
    }
  }

  const handleSendMessage = async () => {
    if (!message.trim() || isSubmitting) return

    // Check if user is connected
    if (!isConnected) {
      console.warn('User must be connected to post comments')
      // You might want to trigger wallet connection modal here
      return
    }

    // Check if we have a valid tokenId
    if (!tokenId || tokenId === 1) {
      console.error('Invalid tokenId for posting comment')
      return
    }

    setIsSubmitting(true)
    try {
      // Post the comment using the real API
      await postCommentMutation.mutateAsync({
        tokenId,
        content: message.trim(),
      })

      // Clear input on success
      setMessage('')

      // Refetch comments to get the new one
      await refetch()
    } catch (error) {
      console.error('Failed to send message:', error)
      // Error notification is handled by the mutation hook
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (isLoading) {
    return (
      <div className={cn('flex flex-col', className)}>
        {/* Loading skeleton for messages */}
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-lg bg-[#252832] p-3">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-12 w-full" />
            </div>
          ))}
        </div>
        {/* Input area skeleton */}
        <div className="border-t border-[#2B3139] bg-[#191B22] p-4">
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className={cn('flex h-full flex-col', className)}>
      {/* Messages area */}
      <div className="max-h-[745px] flex-1 overflow-y-auto bg-[#191B22] px-4 py-4">
        <div className="space-y-3">
          {comments.map((comment) => {
            const starLevel = getUserStarLevel(comment.walletAddress)
            const addressColor =
              starLevel === 5
                ? '#BFFB06'
                : starLevel === 4 || starLevel === 3
                  ? '#DFAC6C'
                  : starLevel === 2
                    ? '#B2CBE4'
                    : starLevel === 1
                      ? '#608AB5'
                      : '#879AAD'

            return (
              <div
                key={comment.id}
                className="flex flex-col gap-2 rounded-lg bg-[#252832] p-3"
              >
                {/* Header */}
                <div className="flex items-center gap-8">
                  <div className="flex items-center gap-[5px]">
                    <StarRating level={starLevel} />
                    <span
                      className="text-sm leading-[22px] font-normal"
                      style={{ color: addressColor }}
                    >
                      {formatAddress(comment.walletAddress)}
                    </span>
                  </div>
                  <span className="text-sm leading-[22px] font-normal text-[#656A79]">
                    {formatDate(comment.createdAt || '')}
                  </span>
                </div>
                {/* Content */}
                <p className="text-sm leading-[22px] font-normal break-words whitespace-pre-wrap text-white">
                  {comment.content}
                </p>
              </div>
            )
          })}
          {/* Auto-scroll anchor point (disabled) */}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area */}
      <div className="flex h-[76px] items-center border-t border-[#2B3139] bg-[#191B22] px-6">
        <div className="flex w-full items-center gap-4">
          {/* Emoji button */}
          <button className="text-[#656A79] hover:text-white">
            <Smile className="h-6 w-6" />
          </button>

          {/* Input field */}
          <div className="flex-1">
            <input
              ref={inputRef}
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={t('inputPlaceholder')}
              disabled={isSubmitting}
              className="h-10 w-full rounded-lg border border-[#2B3139] bg-[#15181E] px-3 text-sm font-medium text-white placeholder-[#656A79] focus:border-[#BFFB06] focus:outline-none disabled:opacity-50"
            />
          </div>

          {/* Send button */}
          <button
            onClick={handleSendMessage}
            disabled={!message.trim() || isSubmitting}
            className={cn(
              'flex h-6 w-6 items-center justify-center rounded text-[#656A79]',
              message.trim() && !isSubmitting
                ? 'hover:text-white'
                : 'cursor-not-allowed'
            )}
          >
            <IconsSendIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

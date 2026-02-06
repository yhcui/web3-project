import {
  ActivityCategoryType,
  ActivityPlayType,
  ActivityRewardTokenType,
} from '@/enums/activities'

export const categoryTypeOptions = [
  {
    label: 'categoryTypeOptions.airdrop',
    value: ActivityCategoryType.Airdrop,
  },
  {
    label: 'categoryTypeOptions.upcoming',
    value: ActivityCategoryType.Upcoming,
  },
]
export const playTypeOptions = [
  {
    label: 'playTypeOptions.trade',
    value: ActivityPlayType.Trade,
  },
  {
    label: 'playTypeOptions.invite',
    value: ActivityPlayType.Invite,
  },
  {
    label: 'playTypeOptions.heatVote',
    value: ActivityPlayType.HeatVote,
  },

  {
    label: 'playTypeOptions.comment',
    value: ActivityPlayType.Comment,
  },
]

export const rewardTokenTypeOptions = [
  {
    label: 'TOKEN',
    value: ActivityRewardTokenType.Token,
  },

  {
    label: 'BNB',
    value: ActivityRewardTokenType.BNB,
  },
  {
    label: 'USDT',
    value: ActivityRewardTokenType.USDT,
  },
]

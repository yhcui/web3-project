export enum ActivityInitiatorType {
  User = 1,
}

export enum ActivityAudienceType {
  All = 4,
}

export enum ActivityCategoryType {
  Airdrop = 2,
  Upcoming = 3,
}

export enum ActivityPlayType {
  Trade = 1,
  Invite = 2,
  HeatVote = 3,
  Comment = 4,
}

export enum ActivityRewardTokenType {
  Token = 1,
  BNB = 2,
  USDT = 3,
}

// 活动状态：0=(预留未审核),1=待开始,2=进行中,3=已结束待结算,4=已结算,5=已作废
export enum ActivityStatus {
  Pending = 0,
  Upcoming = 1,
  Ongoing = 2,
  Settled = 3,
  Complete = 4,
  Cancel = 5,
}

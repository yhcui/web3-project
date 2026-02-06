import { z } from 'zod'
import { LaunchMode } from '@/types/token'

// Base token fields that are common across different token types
const BaseTokenFieldsSchema = z.object({
  name: z.string().min(1).max(50),
  symbol: z.string().min(1).max(10).toUpperCase(),
  description: z.string().min(1).max(500).optional().default(''),
  launchMode: z.custom<LaunchMode>(),
  launchTime: z.number().nonnegative(),
  logo: z.string().url(),
  banner: z.string().url().optional(),
  website: z.string().optional().default(''),
  twitter: z.string().optional().default(''),
  telegram: z.string().optional().default(''),
  discord: z.string().optional().default(''),
  whitepaper: z.string().optional(),
  additionalLink2: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
  preBuyPercent: z.number().min(0).max(1),
  preBuyUsedPercent: z.array(z.number()).optional(),
  preBuyUsedType: z.array(z.number()).optional(),
  preBuyLockTime: z.array(z.number()).optional(),
  preBuyUsedName: z.array(z.string()).optional(),
  preBuyUsedDesc: z.array(z.string()).optional(),
  marginBnb: z.number().nonnegative(),
  marginTime: z.number().nonnegative(), // in seconds (not minutes)
  contractTg: z.string().optional(),
  contractEmail: z.string().email().optional(),
  digits: z.string().min(1).max(10).optional(),
  predictedAddress: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/)
    .optional(),
})

// IDO-specific fields
const IDOFieldsSchema = z.object({
  totalFundsRaised: z.number().nonnegative(),
  fundraisingCycle: z.number().nonnegative(), // in hours
  preUserLimit: z.number().nonnegative(),
  userLockupTime: z.number().nonnegative(), // in hours
  addLiquidity: z.number().min(0).max(1),
  protocolRevenue: z.number().min(0).max(1),
  coreTeam: z.number().min(0).max(1),
  communityTreasury: z.number().min(0).max(1),
  buybackReserve: z.number().min(0).max(1),
})

// Create Token Input - supports both regular and IDO tokens
// More flexible schema for API input
export const CreateTokenInputSchema = z.object({
  name: z.string().min(1).max(50),
  symbol: z.string().min(1).max(50).toUpperCase(),
  description: z.string().optional(),
  launchMode: z.custom<LaunchMode>(),
  launchTime: z.number().nonnegative(),
  logo: z.string().url(),
  banner: z.string().url().optional(),
  website: z.string().optional(),
  twitter: z.string().optional(),
  telegram: z.string().optional(),
  discord: z.string().optional(),
  whitepaper: z.string().optional(),
  additionalLink2: z.string().optional(),
  tags: z.array(z.string()).optional(),
  preBuyPercent: z.number().min(0).max(1),
  preBuyUsedPercent: z.array(z.number()).optional(),
  preBuyUsedType: z.array(z.number()).optional(),
  preBuyLockTime: z.array(z.number()).optional(),
  preBuyUsedName: z.array(z.string()).optional(),
  preBuyUsedDesc: z.array(z.string()).optional(),
  marginBnb: z.number().nonnegative(),
  marginTime: z.number().nonnegative(),
  contractTg: z.string().optional(),
  contractEmail: z.string().optional(),
  digits: z.string().optional(),
  predictedAddress: z.string().optional(),
  // IDO fields (all optional)
  totalFundsRaised: z.number().nonnegative().optional(),
  fundraisingCycle: z.number().nonnegative().optional(),
  preUserLimit: z.number().nonnegative().optional(),
  userLockupTime: z.number().nonnegative().optional(),
  addLiquidity: z.number().min(0).max(1).optional(),
  protocolRevenue: z.number().min(0).max(1).optional(),
  coreTeam: z.number().min(0).max(1).optional(),
  communityTreasury: z.number().min(0).max(1).optional(),
  buybackReserve: z.number().min(0).max(1).optional(),
})

// Create Token Response - Updated to match actual API response
export const CreateTokenResponseSchema = z.object({
  code: z.number(),
  message: z.string(),
  data: z
    .object({
      create2Salt: z.string(), // Salt for CREATE2 deployment
      createArg: z.string(), // Encoded arguments for contract's createToken method
      nonce: z.number(),
      predictedAddress: z.string(), // Predicted token address (may be empty if calculation fails)
      requestId: z.string(), // Unique request ID
      signature: z.string(), // Signature for contract's createToken method
      timestamp: z.number(), // Request timestamp
      // Optional fields from original schema (for backward compatibility)
      tokenId: z.number().optional(),
      tokenAddress: z.string().optional(),
      transactionHash: z.string().optional(),
      success: z.boolean().optional(),
    })
    .optional(),
})

// Calculate Address Input
export const CalculateAddressInputSchema = z.object({
  name: z.string().max(50), // No minimum length for address calculation
  symbol: z.string().max(50).toUpperCase(), // No minimum length for address calculation
  digits: z.string().max(4).optional().default(''), // Optional field, can be empty string
})

// Calculate Address Response
export const CalculateAddressResponseSchema = z.object({
  code: z.number(),
  message: z.string(),
  data: z
    .object({
      predictedAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
      salt: z.string().optional(),
    })
    .optional(),
})

// Calculate Favorite Input
export const CalculateFavoriteInputSchema = z.object({
  tokenId: z.number(),
})

// Calculate Favorite Response
export const CalculateFavoriteResponseSchema = z.object({
  code: z.number(),
  message: z.string(),
  data: z.boolean().nullable().optional(),
})

// Favorite Token Input
export const FavoriteTokenInputSchema = z.object({
  tokenId: z.number(),
})

// Favorite Token Response
export const FavoriteTokenResponseSchema = z.object({
  code: z.number(),
  message: z.string(),
  data: z.any().optional(),
})

// Unfavorite Token Input
export const UnfavoriteTokenInputSchema = z.object({
  tokenId: z.number(),
})

// Unfavorite Token Response
export const UnfavoriteTokenResponseSchema = z.object({
  code: z.number(),
  message: z.string(),
  data: z.any().optional(),
})

// Token List Item (for token list queries)
export const TokenListItemSchema = z.object({
  id: z.number().optional(),
  whitepaper: z.string().optional().nullable().default(''),
  additionalLink1: z.string().optional().nullable().default(''),
  additionalLink2: z.string().optional().nullable().default(''),
  banner: z
    .union([z.string().url(), z.string(), z.null()])
    .optional()
    .nullable()
    .default('')
    .transform((val) => (val === null || val === undefined ? '' : val)),
  createdAt: z.string().nullable().optional(),
  currentBnb: z.string().optional(),
  desc: z.string().optional(),
  discord: z.string().optional().nullable().default(''),
  hot: z.number().optional(),
  launchMode: z.custom<LaunchMode>(),
  launchTime: z.number().optional(),
  lockupTime: z.string().optional().default('0'),
  logo: z
    .union([z.string().url(), z.string(), z.null()])
    .optional()
    .nullable()
    .default('')
    .transform((val) => (val === null || val === undefined ? '' : val)),
  marginBnb: z.string().optional(),
  marketCap: z.string().optional(),
  name: z.string(),
  preUserLimit: z.string().optional(),
  progressPct: z.string().optional().default('0'),
  symbol: z.string().optional(),
  tags: z.array(z.string()).optional(),
  targetBnb: z.string().optional(),
  telegram: z.string().optional().nullable().default(''),
  tokenAddr: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/)
    .optional(),
  tokenLaunchReservation: z.any().nullable(),
  tokenLv: z.number().optional(),
  tokenRank: z.number().optional(),
  twitter: z.string().optional().nullable().default(''),
  website: z.string().optional().nullable().default(''),
  priceChangePercentage24H: z.string().optional(),
  description: z.string().optional().nullable().default(''),
  tokenContractAddress: z.string().optional(),
  isFavorite: z.boolean().optional(),
})

// Token List Response
export const TokenListResponseSchema = z.object({
  code: z.number(),
  message: z.string(),
  data: z.object({
    pageSize: z.number(),
    pageNo: z.number(),
    total: z.number(),
    totalPage: z.number(),
    result: z.array(TokenListItemSchema),
  }),
})

// Token Detail Response
export const TokenDetailResponseSchema = z.object({
  code: z.number(),
  message: z.string(),
  data: TokenListItemSchema,
})

// Type exports
export type CreateTokenInput = z.infer<typeof CreateTokenInputSchema>
export type CreateTokenResponse = z.infer<typeof CreateTokenResponseSchema>
export type CalculateAddressInput = z.infer<typeof CalculateAddressInputSchema>
export type CalculateAddressResponse = z.infer<
  typeof CalculateAddressResponseSchema
>
export type CalculateFavoriteInput = z.infer<
  typeof CalculateFavoriteInputSchema
>
export type CalculateFavoriteResponse = z.infer<
  typeof CalculateFavoriteResponseSchema
>
export type FavoriteTokenInput = z.infer<typeof FavoriteTokenInputSchema>
export type FavoriteTokenResponse = z.infer<typeof FavoriteTokenResponseSchema>
export type UnfavoriteTokenInput = z.infer<typeof UnfavoriteTokenInputSchema>
export type UnfavoriteTokenResponse = z.infer<
  typeof UnfavoriteTokenResponseSchema
>
export type TokenListItem = z.infer<typeof TokenListItemSchema>
export type TokenListResponse = z.infer<typeof TokenListResponseSchema>
export type TokenDetailResponse = z.infer<typeof TokenDetailResponseSchema>

// Hot Pick Token Schema
export const HotPickTokenSchema = z.object({
  isFavorite: z.boolean(),
  priceChange: z.string(),
  tokenAddr: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  tokenID: z.number(),
  tokenLogo: z.string().url(),
  tokenName: z.string(),
  tokenPrice: z.string(),
  tokenSymbol: z.string(),
  marketCap: z.string(),
})

// Hot Pick Response Schema
export const HotPickResponseSchema = z.object({
  code: z.number(),
  message: z.string(),
  data: z.array(HotPickTokenSchema),
})

export type HotPickToken = z.infer<typeof HotPickTokenSchema>
export type HotPickResponse = z.infer<typeof HotPickResponseSchema>

// Trending Token Response Schema
export const TrendingTokenResponseSchema = z.object({
  code: z.number(),
  message: z.string(),
  data: z.object({
    pageSize: z.number(),
    pageNo: z.number(),
    total: z.number(),
    totalPage: z.number(),
    result: z.array(TokenListItemSchema),
  }),
})

export type TrendingTokenResponse = z.infer<typeof TrendingTokenResponseSchema>

// Token Holder Schema
export const TokenHolderSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  balance: z.string(),
  percentage: z.string(),
})

// Token Holders Response Schema
export const TokenHoldersResponseSchema = z.object({
  code: z.number(),
  message: z.string(),
  data: z.array(TokenHolderSchema),
})

export type TokenHolder = z.infer<typeof TokenHolderSchema>
export type TokenHoldersResponse = z.infer<typeof TokenHoldersResponseSchema>

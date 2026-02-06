import * as z from 'zod'

export const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
export const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
]

// Base schema shared across all modes
const baseFormSchema = z.object({
  tokenLogo: z.any().optional(),
  tokenLogoUrl: z.string().url().optional(),
  symbol: z.string().min(1).max(50),
  coinName: z.string().min(1).max(50),
  description: z.string().optional(),
  banner: z.any().optional(),
  bannerUrl: z.string().url().optional(),
  tags: z.array(z.string()).max(3),
  twitter: z.string().optional().default(''),
  discord: z.string().optional().default(''),
  telegram: z.string().optional().default(''),
  website: z.string().optional().default(''),
  whitepaper: z.string().optional().default(''),
  contractPreview: z.boolean().default(false),
})

// Allocation module schema for prebuy token utility
const allocationModuleSchema = z.object({
  id: z.string(),
  percentage: z.number().min(0).max(100),
  type: z.enum(['normal', 'locked']),
  lockTime: z.number().min(0).optional(), // Lock time in seconds (only for 'locked' type)
  lockTimeValue: z.number().min(0).optional(), // User input value
  lockTimeUnit: z.enum(['days', 'hours', 'minutes']).optional(), // User selected unit
  name: z.string(),
  description: z.string(),
})

// Mode-specific schemas
export const newCoinSchema = baseFormSchema.extend({
  preBuy: z.number().min(0).max(99.9),
  preBuyAllocations: z
    .array(allocationModuleSchema)
    .optional()
    .refine(
      (allocations) => {
        if (!allocations || allocations.length === 0) return true
        const totalPercentage = allocations.reduce(
          (sum, a) => sum + a.percentage / 100,
          0
        )
        return totalPercentage <= 1
      },
      { message: 'Total percentage cannot exceed 100%' }
    ),
  addMargin: z.boolean().default(false),
  marginAmount: z.number().min(0).optional(),
  marginTime: z.number().min(1).optional(),
  tokenLaunchReservation: z.boolean().default(false),
  tokenLaunchReservationDate: z.string().optional(),
  officialContact: z.boolean().default(false),
  contractTg: z.string().optional().default(''),
  contractEmail: z.string().email().optional().or(z.literal('')),
})

export const idoSchema = baseFormSchema.extend({
  idoPrice: z.number().min(0),
  idoSupply: z.number().min(0),
  idoStartDate: z.date().optional(),
  idoEndDate: z.date().optional(),
  minPurchase: z.number().min(0).optional(),
  maxPurchase: z.number().min(0).optional(),
})

export const burningSchema = baseFormSchema.extend({
  burnRate: z.number().min(0).max(100),
  burnSchedule: z.enum(['hourly', 'daily', 'weekly', 'monthly']),
  totalBurnAmount: z.number().min(0),
  autoBurn: z.boolean().default(false),
})

// Get schema based on mode
export function getSchemaForMode(mode: 'new-coin' | 'ido' | 'burning') {
  switch (mode) {
    case 'new-coin':
      return newCoinSchema
    case 'ido':
      return idoSchema
    case 'burning':
      return burningSchema
    default:
      return newCoinSchema
  }
}

// Type exports
export type AllocationModule = z.infer<typeof allocationModuleSchema>
export type BaseFormData = z.infer<typeof baseFormSchema>
export type NewCoinFormData = z.infer<typeof newCoinSchema>
export type IDOFormData = z.infer<typeof idoSchema>
export type BurningFormData = z.infer<typeof burningSchema>
export type FormData = NewCoinFormData | IDOFormData | BurningFormData

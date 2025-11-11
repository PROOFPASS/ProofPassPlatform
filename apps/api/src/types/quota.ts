/**
 * Quota System Types
 * Defines organization tiers and their corresponding quotas
 */

export type OrganizationTier = 'free' | 'pro' | 'enterprise'

export interface QuotaLimits {
  requestsPerHour: number
  requestsPerDay: number
  requestsPerMonth: number
  credentialsPerMonth: number
  verificationsPerMonth: number
  storageGB: number
  apiKeysLimit: number
}

/**
 * Tier-based quota limits
 */
export const TIER_LIMITS: Record<OrganizationTier, QuotaLimits> = {
  free: {
    requestsPerHour: 100,
    requestsPerDay: 1000,
    requestsPerMonth: 10000,
    credentialsPerMonth: 100,
    verificationsPerMonth: 500,
    storageGB: 1,
    apiKeysLimit: 2,
  },
  pro: {
    requestsPerHour: 1000,
    requestsPerDay: 10000,
    requestsPerMonth: 200000,
    credentialsPerMonth: 5000,
    verificationsPerMonth: 20000,
    storageGB: 50,
    apiKeysLimit: 10,
  },
  enterprise: {
    requestsPerHour: 10000,
    requestsPerDay: 100000,
    requestsPerMonth: 2000000,
    credentialsPerMonth: 50000,
    verificationsPerMonth: 200000,
    storageGB: 500,
    apiKeysLimit: 50,
  },
}

export interface UsageStats {
  current: number
  limit: number
  percentage: number
  remaining: number
  resetAt: Date
}

export interface UsageReport {
  organizationId: string
  tier: OrganizationTier
  period: 'hour' | 'day' | 'month'
  requests: UsageStats
  credentials: UsageStats
  verifications: UsageStats
  generatedAt: Date
}

export type QuotaAction = 'request' | 'issue_credential' | 'verify_credential'
export type QuotaPeriod = 'hour' | 'day' | 'month'

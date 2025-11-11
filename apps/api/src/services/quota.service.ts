/**
 * Quota Service
 * Manages organization quotas and usage tracking with Redis
 */

import { redisClient } from '../config/redis'
import { query } from '../config/database'
import {
  TIER_LIMITS,
  OrganizationTier,
  UsageStats,
  UsageReport,
  QuotaAction,
  QuotaPeriod,
} from '../types/quota'

export class QuotaService {
  /**
   * Check if an organization can perform an action
   */
  async checkQuota(
    orgId: string,
    action: QuotaAction,
    period: QuotaPeriod = 'hour'
  ): Promise<boolean> {
    const org = await this.getOrganization(orgId)
    if (!org) return false

    const limits = TIER_LIMITS[org.tier as OrganizationTier]
    const currentUsage = await this.getUsage(orgId, action, period)

    switch (action) {
      case 'request':
        if (period === 'hour') return currentUsage < limits.requestsPerHour
        if (period === 'day') return currentUsage < limits.requestsPerDay
        return currentUsage < limits.requestsPerMonth

      case 'issue_credential':
        return currentUsage < limits.credentialsPerMonth

      case 'verify_credential':
        return currentUsage < limits.verificationsPerMonth

      default:
        return true
    }
  }

  /**
   * Record usage of an action
   */
  async recordUsage(orgId: string, action: QuotaAction): Promise<void> {
    const now = new Date()
    const hour = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}-${now.getHours()}`
    const day = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`
    const month = `${now.getFullYear()}-${now.getMonth() + 1}`

    // Increment counters for all periods
    const keys = [
      `usage:${orgId}:${action}:hour:${hour}`,
      `usage:${orgId}:${action}:day:${day}`,
      `usage:${orgId}:${action}:month:${month}`,
    ]

    // Use pipeline for atomic operations
    const pipeline = redisClient.multi()

    for (const key of keys) {
      pipeline.incr(key)
    }

    // Set TTL for each key
    pipeline.expire(keys[0], 3600) // 1 hour
    pipeline.expire(keys[1], 86400 * 2) // 2 days
    pipeline.expire(keys[2], 86400 * 32) // 32 days

    await pipeline.exec()
  }

  /**
   * Get current usage for a specific action and period
   */
  async getUsage(
    orgId: string,
    action: QuotaAction,
    period: QuotaPeriod
  ): Promise<number> {
    const now = new Date()
    let periodKey: string

    switch (period) {
      case 'hour':
        periodKey = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}-${now.getHours()}`
        break
      case 'day':
        periodKey = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`
        break
      case 'month':
        periodKey = `${now.getFullYear()}-${now.getMonth() + 1}`
        break
    }

    const key = `usage:${orgId}:${action}:${period}:${periodKey}`
    const value = await redisClient.get(key)
    return parseInt(value || '0', 10)
  }

  /**
   * Get usage statistics with limits and remaining quota
   */
  async getUsageStats(
    orgId: string,
    action: QuotaAction,
    period: QuotaPeriod
  ): Promise<UsageStats> {
    const org = await this.getOrganization(orgId)
    if (!org) {
      throw new Error(`Organization ${orgId} not found`)
    }

    const limits = TIER_LIMITS[org.tier as OrganizationTier]
    const current = await this.getUsage(orgId, action, period)

    let limit: number
    let resetAt: Date
    const now = new Date()

    // Determine limit based on action and period
    switch (action) {
      case 'request':
        if (period === 'hour') limit = limits.requestsPerHour
        else if (period === 'day') limit = limits.requestsPerDay
        else limit = limits.requestsPerMonth
        break
      case 'issue_credential':
        limit = limits.credentialsPerMonth
        break
      case 'verify_credential':
        limit = limits.verificationsPerMonth
        break
    }

    // Calculate reset time
    if (period === 'hour') {
      resetAt = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + 1, 0, 0)
    } else if (period === 'day') {
      resetAt = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0)
    } else {
      resetAt = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0)
    }

    return {
      current,
      limit,
      percentage: limit > 0 ? (current / limit) * 100 : 0,
      remaining: Math.max(0, limit - current),
      resetAt,
    }
  }

  /**
   * Get comprehensive usage report for an organization
   */
  async getUsageReport(
    orgId: string,
    period: QuotaPeriod = 'month'
  ): Promise<UsageReport> {
    const org = await this.getOrganization(orgId)
    if (!org) {
      throw new Error(`Organization ${orgId} not found`)
    }

    const [requests, credentials, verifications] = await Promise.all([
      this.getUsageStats(orgId, 'request', period),
      this.getUsageStats(orgId, 'issue_credential', 'month'),
      this.getUsageStats(orgId, 'verify_credential', 'month'),
    ])

    return {
      organizationId: orgId,
      tier: org.tier as OrganizationTier,
      period,
      requests,
      credentials,
      verifications,
      generatedAt: new Date(),
    }
  }

  /**
   * Reset usage for an organization (useful for testing)
   */
  async resetUsage(orgId: string): Promise<void> {
    const pattern = `usage:${orgId}:*`
    const keys = await redisClient.keys(pattern)

    if (keys.length > 0) {
      await redisClient.del(keys)
    }
  }

  /**
   * Get organization from database
   */
  private async getOrganization(orgId: string): Promise<{ tier: string } | null> {
    const result = await query(
      'SELECT tier FROM organizations WHERE id = $1',
      [orgId]
    )

    if (result.rows.length === 0) {
      return null
    }

    return result.rows[0]
  }
}

// Export singleton instance
export const quotaService = new QuotaService()

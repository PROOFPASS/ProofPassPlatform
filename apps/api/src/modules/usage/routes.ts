/**
 * Usage & Quota Routes
 * Endpoints for checking usage statistics and quotas
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { quotaService } from '../../services/quota.service'

interface UsageQueryParams {
  period?: 'hour' | 'day' | 'month'
}

/**
 * Register usage routes
 */
export async function usageRoutes(server: FastifyInstance) {
  /**
   * GET /usage/report
   * Get comprehensive usage report for authenticated organization
   */
  server.get(
    '/report',
    {
      schema: {
        description: 'Get usage and quota report',
        tags: ['usage'],
        querystring: {
          type: 'object',
          properties: {
            period: {
              type: 'string',
              enum: ['hour', 'day', 'month'],
              default: 'month',
            },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              organizationId: { type: 'string' },
              tier: { type: 'string' },
              period: { type: 'string' },
              requests: {
                type: 'object',
                properties: {
                  current: { type: 'number' },
                  limit: { type: 'number' },
                  percentage: { type: 'number' },
                  remaining: { type: 'number' },
                  resetAt: { type: 'string' },
                },
              },
              credentials: {
                type: 'object',
                properties: {
                  current: { type: 'number' },
                  limit: { type: 'number' },
                  percentage: { type: 'number' },
                  remaining: { type: 'number' },
                  resetAt: { type: 'string' },
                },
              },
              verifications: {
                type: 'object',
                properties: {
                  current: { type: 'number' },
                  limit: { type: 'number' },
                  percentage: { type: 'number' },
                  remaining: { type: 'number' },
                  resetAt: { type: 'string' },
                },
              },
              generatedAt: { type: 'string' },
            },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{ Querystring: UsageQueryParams }>,
      reply: FastifyReply
    ) => {
      try {
        // Get organization ID from authenticated client
        const client = (request as any).client
        if (!client || !client.orgId) {
          return reply.code(401).send({
            error: 'Unauthorized',
            message: 'Authentication required',
          })
        }

        const period = request.query.period || 'month'
        const report = await quotaService.getUsageReport(client.orgId, period)

        return reply.send(report)
      } catch (error) {
        request.log.error(error, 'Failed to get usage report')
        return reply.code(500).send({
          error: 'Internal Server Error',
          message: 'Failed to retrieve usage report',
        })
      }
    }
  )

  /**
   * GET /usage/stats
   * Get detailed usage statistics for all periods
   */
  server.get(
    '/stats',
    {
      schema: {
        description: 'Get detailed usage statistics',
        tags: ['usage'],
        response: {
          200: {
            type: 'object',
            properties: {
              requests: {
                type: 'object',
                properties: {
                  hourly: { type: 'object' },
                  daily: { type: 'object' },
                  monthly: { type: 'object' },
                },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const client = (request as any).client
        if (!client || !client.orgId) {
          return reply.code(401).send({
            error: 'Unauthorized',
            message: 'Authentication required',
          })
        }

        // Get stats for all periods
        const [hourly, daily, monthly] = await Promise.all([
          quotaService.getUsageStats(client.orgId, 'request', 'hour'),
          quotaService.getUsageStats(client.orgId, 'request', 'day'),
          quotaService.getUsageStats(client.orgId, 'request', 'month'),
        ])

        return reply.send({
          requests: {
            hourly,
            daily,
            monthly,
          },
        })
      } catch (error) {
        request.log.error(error, 'Failed to get usage stats')
        return reply.code(500).send({
          error: 'Internal Server Error',
          message: 'Failed to retrieve usage statistics',
        })
      }
    }
  )

  /**
   * GET /usage/check
   * Check if organization can perform a specific action
   */
  server.get(
    '/check',
    {
      schema: {
        description: 'Check quota availability',
        tags: ['usage'],
        querystring: {
          type: 'object',
          required: ['action'],
          properties: {
            action: {
              type: 'string',
              enum: ['request', 'issue_credential', 'verify_credential'],
            },
            period: {
              type: 'string',
              enum: ['hour', 'day', 'month'],
              default: 'hour',
            },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              allowed: { type: 'boolean' },
              usage: { type: 'object' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const client = (request as any).client
        if (!client || !client.orgId) {
          return reply.code(401).send({
            error: 'Unauthorized',
            message: 'Authentication required',
          })
        }

        const { action, period } = request.query as any
        const allowed = await quotaService.checkQuota(
          client.orgId,
          action,
          period || 'hour'
        )

        const usage = await quotaService.getUsageStats(
          client.orgId,
          action,
          period || 'hour'
        )

        return reply.send({
          allowed,
          usage,
        })
      } catch (error) {
        request.log.error(error, 'Failed to check quota')
        return reply.code(500).send({
          error: 'Internal Server Error',
          message: 'Failed to check quota',
        })
      }
    }
  )
}

# Rate Limiting Avanzado - Guía de Implementación

Esta guía te permitirá implementar el sistema completo de rate limiting avanzado en ProofPass.

## Archivos a Crear

### 1. Cliente Redis (`src/config/redis.ts`)

```typescript
import Redis from 'ioredis'

let redis: Redis | null = null

export function getRedisClient(): Redis {
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000)
        return delay
      },
      reconnectOnError(err) {
        const targetError = 'READONLY'
        if (err.message.includes(targetError)) {
          // Reconectar en caso de error de readonly
          return true
        }
        return false
      },
    })

    redis.on('connect', () => {
      console.log('✓ Redis connected')
    })

    redis.on('error', (err) => {
      console.error('Redis error:', err)
    })
  }

  return redis
}

export async function closeRedis(): Promise<void> {
  if (redis) {
    await redis.quit()
    redis = null
  }
}
```

### 2. Tipos de Quota (`src/types/quota.ts`)

```typescript
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
```

### 3. Servicio de Quotas (`src/services/quota.ts`)

```typescript
import { getRedisClient } from '../config/redis'
import { TIER_LIMITS, OrganizationTier, UsageStats, UsageReport } from '../types/quota'
import { getOrganizationById } from './organization' // Asume que existe

export class QuotaService {
  private redis = getRedisClient()

  /**
   * Verifica si una organización puede realizar una acción
   */
  async checkQuota(
    orgId: string,
    action: 'request' | 'issue_credential' | 'verify_credential',
    period: 'hour' | 'day' | 'month' = 'hour'
  ): Promise<boolean> {
    const org = await getOrganizationById(orgId)
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
   * Registra el uso de una acción
   */
  async recordUsage(
    orgId: string,
    action: 'request' | 'issue_credential' | 'verify_credential'
  ): Promise<void> {
    const now = new Date()
    const hour = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}-${now.getHours()}`
    const day = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`
    const month = `${now.getFullYear()}-${now.getMonth() + 1}`

    // Incrementar contadores
    const keys = [
      `usage:${orgId}:${action}:hour:${hour}`,
      `usage:${orgId}:${action}:day:${day}`,
      `usage:${orgId}:${action}:month:${month}`,
    ]

    const pipeline = this.redis.pipeline()
    for (const key of keys) {
      pipeline.incr(key)
    }

    // Establecer TTL
    pipeline.expire(keys[0], 3600) // 1 hora
    pipeline.expire(keys[1], 86400 * 2) // 2 días
    pipeline.expire(keys[2], 86400 * 32) // 32 días

    await pipeline.exec()
  }

  /**
   * Obtiene el uso actual
   */
  async getUsage(
    orgId: string,
    action: 'request' | 'issue_credential' | 'verify_credential',
    period: 'hour' | 'day' | 'month'
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
    const value = await this.redis.get(key)
    return parseInt(value || '0', 10)
  }

  /**
   * Obtiene estadísticas de uso
   */
  async getUsageStats(
    orgId: string,
    action: 'request' | 'issue_credential' | 'verify_credential',
    period: 'hour' | 'day' | 'month'
  ): Promise<UsageStats> {
    const org = await getOrganizationById(orgId)
    const limits = TIER_LIMITS[org.tier as OrganizationTier]
    const current = await this.getUsage(orgId, action, period)

    let limit: number
    let resetAt: Date

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

    // Calcular resetAt
    const now = new Date()
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
      percentage: (current / limit) * 100,
      remaining: Math.max(0, limit - current),
      resetAt,
    }
  }

  /**
   * Obtiene reporte completo de uso
   */
  async getUsageReport(
    orgId: string,
    period: 'hour' | 'day' | 'month' = 'month'
  ): Promise<UsageReport> {
    const org = await getOrganizationById(orgId)

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
   * Limpia los contadores (útil para testing)
   */
  async resetUsage(orgId: string): Promise<void> {
    const keys = await this.redis.keys(`usage:${orgId}:*`)
    if (keys.length > 0) {
      await this.redis.del(...keys)
    }
  }
}

// Singleton
export const quotaService = new QuotaService()
```

### 4. Middleware de Rate Limiting (`src/middleware/rate-limit.ts`)

```typescript
import { FastifyRequest, FastifyReply, FastifyPluginAsync } from 'fastify'
import rateLimit from '@fastify/rate-limit'
import { getRedisClient } from '../config/redis'
import { quotaService } from '../services/quota'
import { getOrganizationById } from '../services/organization'

/**
 * Hook para extraer API key del request
 */
export async function extractApiKey(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<string | null> {
  // Intentar obtener de header
  const headerKey = request.headers['x-api-key'] as string
  if (headerKey) return headerKey

  // Intentar obtener de query string
  const queryKey = (request.query as any).api_key
  if (queryKey) return queryKey

  // Intentar obtener del JWT (si está autenticado)
  if (request.user?.organizationId) {
    // Buscar API key de la organización
    const org = await getOrganizationById(request.user.organizationId)
    return org?.apiKeys?.[0]?.key || null
  }

  return null
}

/**
 * Plugin de rate limiting por API key con cuotas por tier
 */
export const rateLimitByApiKey: FastifyPluginAsync = async (fastify) => {
  const redis = getRedisClient()

  await fastify.register(rateLimit, {
    max: async (request) => {
      try {
        const apiKey = await extractApiKey(request, null as any)

        if (!apiKey) {
          // Sin API key, límite bajo
          return 100
        }

        // Buscar organización por API key
        const org = await getOrganizationByApiKey(apiKey)
        if (!org) {
          return 100
        }

        // Obtener límites según tier
        const limits = getTierLimits(org.tier)
        return limits.requestsPerHour
      } catch (error) {
        fastify.log.error('Error checking rate limit:', error)
        return 100
      }
    },
    timeWindow: '1 hour',
    redis,
    nameSpace: 'rl:',
    continueExceeding: false,
    skipOnError: true,
    keyGenerator: async (request) => {
      const apiKey = await extractApiKey(request, null as any)
      return apiKey || request.ip
    },
    errorResponseBuilder: (request, context) => {
      return {
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Try again in ${Math.ceil(context.ttl / 1000)} seconds.`,
        statusCode: 429,
        ttl: context.ttl,
      }
    },
  })
}

/**
 * Middleware para verificar cuotas mensuales
 */
export async function checkMonthlyQuota(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const apiKey = await extractApiKey(request, reply)

  if (!apiKey) {
    // Sin API key, permitir (rate limit base se aplicará)
    return
  }

  const org = await getOrganizationByApiKey(apiKey)
  if (!org) {
    return reply.code(401).send({
      error: 'Invalid API key',
    })
  }

  // Verificar cuota mensual de requests
  const canMakeRequest = await quotaService.checkQuota(org.id, 'request', 'month')

  if (!canMakeRequest) {
    const stats = await quotaService.getUsageStats(org.id, 'request', 'month')
    return reply.code(429).send({
      error: 'Monthly quota exceeded',
      message: `You have exceeded your monthly request quota of ${stats.limit} requests.`,
      usage: {
        current: stats.current,
        limit: stats.limit,
        resetAt: stats.resetAt,
      },
      upgradeUrl: '/pricing',
    })
  }

  // Registrar uso
  await quotaService.recordUsage(org.id, 'request')

  // Agregar headers de cuota al response
  const stats = await quotaService.getUsageStats(org.id, 'request', 'month')
  reply.headers({
    'X-RateLimit-Limit': stats.limit.toString(),
    'X-RateLimit-Remaining': stats.remaining.toString(),
    'X-RateLimit-Reset': stats.resetAt.toISOString(),
  })
}

/**
 * Middleware específico para issue credential
 */
export async function checkCredentialQuota(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const apiKey = await extractApiKey(request, reply)
  if (!apiKey) return

  const org = await getOrganizationByApiKey(apiKey)
  if (!org) return

  const canIssue = await quotaService.checkQuota(org.id, 'issue_credential', 'month')

  if (!canIssue) {
    const stats = await quotaService.getUsageStats(org.id, 'issue_credential', 'month')
    return reply.code(429).send({
      error: 'Credential quota exceeded',
      message: `You have exceeded your monthly credential issuance quota of ${stats.limit}.`,
      usage: {
        current: stats.current,
        limit: stats.limit,
        resetAt: stats.resetAt,
      },
    })
  }

  await quotaService.recordUsage(org.id, 'issue_credential')
}

// Helper functions
function getTierLimits(tier: string) {
  const limits = {
    free: { requestsPerHour: 100 },
    pro: { requestsPerHour: 1000 },
    enterprise: { requestsPerHour: 10000 },
  }
  return limits[tier as keyof typeof limits] || limits.free
}

async function getOrganizationByApiKey(apiKey: string) {
  // Implementar según tu modelo de datos
  // Este es un ejemplo simplificado
  return null
}
```

### 5. Endpoint de Uso (`src/routes/usage.ts`)

```typescript
import { FastifyInstance } from 'fastify'
import { quotaService } from '../services/quota'
import { authenticate } from '../middleware/auth'

export async function usageRoutes(fastify: FastifyInstance) {
  // Obtener reporte de uso
  fastify.get(
    '/usage',
    {
      preHandler: [authenticate],
    },
    async (request, reply) => {
      const orgId = request.user.organizationId
      const period = (request.query as any).period || 'month'

      const report = await quotaService.getUsageReport(orgId, period)
      return report
    }
  )

  // Obtener estadísticas detalladas
  fastify.get(
    '/usage/stats',
    {
      preHandler: [authenticate],
    },
    async (request, reply) => {
      const orgId = request.user.organizationId

      const [hourly, daily, monthly] = await Promise.all([
        quotaService.getUsageStats(orgId, 'request', 'hour'),
        quotaService.getUsageStats(orgId, 'request', 'day'),
        quotaService.getUsageStats(orgId, 'request', 'month'),
      ])

      return {
        requests: {
          hourly,
          daily,
          monthly,
        },
      }
    }
  )
}
```

## Integración en el App Principal

Actualizar `src/app.ts`:

```typescript
import { rateLimitByApiKey, checkMonthlyQuota } from './middleware/rate-limit'
import { usageRoutes } from './routes/usage'

// Registrar rate limiting global
await app.register(rateLimitByApiKey)

// Agregar middleware de cuotas a rutas protegidas
app.addHook('preHandler', checkMonthlyQuota)

// Registrar rutas de uso
await app.register(usageRoutes, { prefix: '/api' })
```

## Variables de Entorno

Agregar a `.env`:

```env
# Redis
REDIS_URL=redis://localhost:6379

# Rate Limiting (opcional, para override)
RATE_LIMIT_FREE_HOUR=100
RATE_LIMIT_PRO_HOUR=1000
RATE_LIMIT_ENTERPRISE_HOUR=10000
```

## Testing

```bash
# Instalar dependencias
npm install ioredis

# Iniciar Redis (si no está corriendo)
docker run -d -p 6379:6379 redis:alpine

# Probar
curl -H "X-API-Key: your-api-key" http://localhost:3000/api/usage
```

## Próximos Pasos

1. ✅ Implementar archivos listados arriba
2. Agregar tests para QuotaService
3. Crear dashboard en el frontend para visualizar uso
4. Implementar alertas cuando se acerca al límite
5. Agregar webhooks para notificar cuando se excede cuota

## Beneficios

- ✅ Rate limiting por tier
- ✅ Cuotas mensuales por organización
- ✅ Distribuid con Redis
- ✅ Headers de quota en responses
- ✅ Protección contra abuso
- ✅ Monetización por tier
- ✅ Reportes de uso en tiempo real

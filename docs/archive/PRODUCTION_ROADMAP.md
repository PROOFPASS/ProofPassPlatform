# ProofPass - Production Roadmap

Este documento detalla las mejoras críticas necesarias antes de llevar ProofPass a producción.

## Estado Actual

La plataforma ProofPass actualmente tiene:
- ✅ Backend API funcional con autenticación JWT
- ✅ Base de datos PostgreSQL con migraciones
- ✅ Sistema de Verifiable Credentials básico
- ✅ Frontend administrativo y de cliente
- ✅ Integración blockchain (Stellar/Optimism) básica
- ✅ Generación de QR codes
- ✅ Tests unitarios e integración

## Mejoras Críticas para Producción

### 1. Zero-Knowledge Proofs Reales

**Estado Actual:**
- El paquete `packages/zk-toolkit` contiene implementaciones simuladas
- No se están utilizando circuitos ZK reales

**Requerido:**
- Migrar a **Circom + SnarkJS** para circuitos ZK reales
- Implementar circuitos para casos de uso específicos:
  - Age verification (mayor de edad sin revelar fecha exacta)
  - Range proofs (rango de salario sin monto exacto)
  - Membership proofs (pertenencia a grupo sin identidad)
- Setup de trusted setup o usar sistemas más modernos (Plonk/Halo2)

**Implementación:**

```bash
# Instalar dependencias
npm install snarkjs circomlib

# Estructura propuesta
packages/zk-toolkit/
  ├── circuits/
  │   ├── age_verification.circom
  │   ├── range_proof.circom
  │   └── membership.circom
  ├── ptau/            # Powers of Tau
  ├── build/           # Circuitos compilados
  └── src/
      ├── prover.ts
      └── verifier.ts
```

**Referencias:**
- https://github.com/iden3/circom
- https://github.com/iden3/snarkjs
- https://zkp.science/

---

### 2. Firmas VC con DIDs Reales

**Estado Actual:**
- Sistema de firma simplificado
- No utiliza DIDs estándar W3C

**Requerido:**
- Implementar soporte para DIDs estándar:
  - **did:key** - Para desarrollo y casos simples
  - **did:web** - Para organizaciones con dominio
  - **did:ion** - Para producción con Bitcoin/ION
- Usar **LD-Proofs** o **JWS** para firmas verificables
- Integrar con librerías maduras:
  - `did-jwt` para JWT-based VCs
  - `jsonld-signatures` para Linked Data signatures

**Implementación:**

```typescript
// packages/vc-toolkit/src/did/resolver.ts
import { Resolver } from 'did-resolver'
import { getResolver as getKeyResolver } from 'key-did-resolver'
import { getResolver as getWebResolver } from 'web-did-resolver'
import { getResolver as getIonResolver } from '@decentralized-identity/ion-tools'

export const resolver = new Resolver({
  ...getKeyResolver(),
  ...getWebResolver(),
  ...getIonResolver(),
})

// packages/vc-toolkit/src/issuer.ts
import { createVerifiableCredentialJwt } from 'did-jwt-vc'

export async function issueVC(
  issuerDID: string,
  subjectDID: string,
  claims: any,
  privateKey: string
) {
  const vcPayload = {
    sub: subjectDID,
    vc: {
      '@context': ['https://www.w3.org/2018/credentials/v1'],
      type: ['VerifiableCredential'],
      credentialSubject: claims,
    },
  }

  const vcJwt = await createVerifiableCredentialJwt(vcPayload, {
    did: issuerDID,
    signer: createSigner(privateKey),
  })

  return vcJwt
}
```

**Referencias:**
- https://www.w3.org/TR/did-core/
- https://github.com/decentralized-identity/did-jwt-vc
- https://identity.foundation/ion/

---

### 3. Key Management System (KMS)

**Estado Actual:**
- Claves almacenadas en variables de entorno
- Sin rotación de claves
- Sin HSM/KMS

**Requerido:**
- Integrar con servicios de gestión de claves:
  - **AWS KMS** - Para deployment en AWS
  - **HashiCorp Vault** - Para on-premise o multi-cloud
  - **Google Cloud KMS** - Para GCP
- Implementar rotación automática de claves
- Separar claves por ambiente (dev/staging/prod)
- Audit trail de uso de claves

**Implementación con AWS KMS:**

```typescript
// apps/api/src/services/kms.ts
import { KMSClient, SignCommand, GetPublicKeyCommand } from '@aws-sdk/client-kms'

export class KMSService {
  private client: KMSClient

  constructor() {
    this.client = new KMSClient({ region: process.env.AWS_REGION })
  }

  async sign(keyId: string, message: Buffer): Promise<Buffer> {
    const command = new SignCommand({
      KeyId: keyId,
      Message: message,
      SigningAlgorithm: 'ECDSA_SHA_256',
    })

    const response = await this.client.send(command)
    return Buffer.from(response.Signature!)
  }

  async getPublicKey(keyId: string): Promise<Buffer> {
    const command = new GetPublicKeyCommand({ KeyId: keyId })
    const response = await this.client.send(command)
    return Buffer.from(response.PublicKey!)
  }

  async rotateKey(oldKeyId: string): Promise<string> {
    // Implementar lógica de rotación
    // 1. Crear nueva clave
    // 2. Migrar firmas activas
    // 3. Deprecar clave antigua
    // 4. Actualizar configuración
  }
}
```

**Implementación con Vault:**

```typescript
// apps/api/src/services/vault.ts
import * as vault from 'node-vault'

export class VaultService {
  private client: any

  constructor() {
    this.client = vault({
      apiVersion: 'v1',
      endpoint: process.env.VAULT_ADDR,
      token: process.env.VAULT_TOKEN,
    })
  }

  async getSecret(path: string): Promise<any> {
    const result = await this.client.read(path)
    return result.data
  }

  async signWithTransit(keyName: string, data: string): Promise<string> {
    const result = await this.client.write(`transit/sign/${keyName}`, {
      input: Buffer.from(data).toString('base64'),
    })
    return result.data.signature
  }

  async rotateTransitKey(keyName: string): Promise<void> {
    await this.client.write(`transit/keys/${keyName}/rotate`, {})
  }
}
```

**Referencias:**
- https://docs.aws.amazon.com/kms/
- https://www.vaultproject.io/docs/secrets/transit
- https://cloud.google.com/kms/docs

---

### 4. Observabilidad y Monitoring

**Estado Actual:**
- Logs básicos con Pino
- Sin tracing distribuido
- Sin métricas de negocio

**Requerido:**
- Implementar **OpenTelemetry** para tracing
- Métricas de aplicación con Prometheus
- Dashboards en Grafana
- Alertas en PagerDuty/Opsgenie
- APM con DataDog o New Relic (opcional)

**Implementación OpenTelemetry:**

```typescript
// apps/api/src/config/telemetry.ts
import { NodeSDK } from '@opentelemetry/sdk-node'
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { Resource } from '@opentelemetry/resources'
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions'

export function initTelemetry() {
  const sdk = new NodeSDK({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: 'proofpass-api',
      [SemanticResourceAttributes.SERVICE_VERSION]: process.env.VERSION,
    }),
    traceExporter: new OTLPTraceExporter({
      url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
    }),
    instrumentations: [getNodeAutoInstrumentations()],
  })

  sdk.start()
}
```

**Métricas Prometheus:**

```typescript
// apps/api/src/middleware/metrics.ts
import { register, Counter, Histogram } from 'prom-client'

// Contadores
export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status'],
})

export const vcIssuedTotal = new Counter({
  name: 'vc_issued_total',
  help: 'Total Verifiable Credentials issued',
  labelNames: ['type', 'organization'],
})

// Histogramas
export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration',
  labelNames: ['method', 'route'],
  buckets: [0.1, 0.5, 1, 2, 5],
})

// Endpoint para Prometheus
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType)
  res.end(await register.metrics())
})
```

**Dashboard Grafana:**

```yaml
# docker-compose.monitoring.yml
version: '3.8'
services:
  prometheus:
    image: prom/prometheus
    ports:
      - '9090:9090'
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana
    ports:
      - '3000:3000'
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - ./monitoring/grafana/dashboards:/etc/grafana/provisioning/dashboards

  jaeger:
    image: jaegertracing/all-in-one
    ports:
      - '16686:16686'  # UI
      - '4318:4318'    # OTLP HTTP
```

**Referencias:**
- https://opentelemetry.io/
- https://prometheus.io/
- https://grafana.com/

---

### 5. Rate Limiting y API Key Management

**Estado Actual:**
- Rate limiting global básico con `@fastify/rate-limit`
- Sin rate limiting por API key o tenant
- Sin cuotas por plan

**Requerido:**
- Rate limiting por ruta
- Límites por API key
- Cuotas mensuales por organización
- Diferentes límites por tier (free/pro/enterprise)
- Redis para rate limiting distribuido

**Implementación:**

```typescript
// apps/api/src/middleware/rate-limit.ts
import rateLimit from '@fastify/rate-limit'
import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL)

export const rateLimitByApiKey = rateLimit({
  max: async (request) => {
    // Obtener API key del header
    const apiKey = request.headers['x-api-key'] as string
    if (!apiKey) return 100 // Límite bajo para requests sin API key

    // Buscar organización y su tier
    const org = await getOrganizationByApiKey(apiKey)

    // Retornar límites según tier
    const limits = {
      free: 1000,
      pro: 10000,
      enterprise: 100000,
    }

    return limits[org.tier] || 100
  },
  timeWindow: '1 hour',
  redis,
  nameSpace: 'rl:',
  continueExceeding: false,
  skipOnError: true,
})

// Rate limit por ruta
app.register(rateLimit, {
  max: 10,
  timeWindow: '1 minute',
  redis,
})

app.post('/api/credentials/issue', {
  preHandler: rateLimitByApiKey,
}, async (request, reply) => {
  // Verificar cuota mensual
  const apiKey = request.headers['x-api-key'] as string
  const org = await getOrganizationByApiKey(apiKey)

  const currentUsage = await redis.get(`quota:${org.id}:${currentMonth}`)
  if (currentUsage >= org.monthlyQuota) {
    return reply.code(429).send({
      error: 'Monthly quota exceeded',
      quota: org.monthlyQuota,
      used: currentUsage,
    })
  }

  // Incrementar contador
  await redis.incr(`quota:${org.id}:${currentMonth}`)
  await redis.expire(`quota:${org.id}:${currentMonth}`, 60 * 60 * 24 * 32) // 32 días

  // Procesar request
  // ...
})
```

**Sistema de Cuotas:**

```typescript
// apps/api/src/services/quota.ts
export interface QuotaLimits {
  requestsPerHour: number
  requestsPerDay: number
  requestsPerMonth: number
  credentialsPerMonth: number
  verificationsPerMonth: number
}

export const TIER_LIMITS: Record<string, QuotaLimits> = {
  free: {
    requestsPerHour: 100,
    requestsPerDay: 1000,
    requestsPerMonth: 10000,
    credentialsPerMonth: 100,
    verificationsPerMonth: 500,
  },
  pro: {
    requestsPerHour: 1000,
    requestsPerDay: 10000,
    requestsPerMonth: 200000,
    credentialsPerMonth: 5000,
    verificationsPerMonth: 20000,
  },
  enterprise: {
    requestsPerHour: 10000,
    requestsPerDay: 100000,
    requestsPerMonth: 2000000,
    credentialsPerMonth: 50000,
    verificationsPerMonth: 200000,
  },
}

export class QuotaService {
  async checkQuota(orgId: string, action: string): Promise<boolean> {
    const org = await getOrganization(orgId)
    const limits = TIER_LIMITS[org.tier]

    const currentUsage = await this.getUsage(orgId, action, 'month')

    switch (action) {
      case 'issue_credential':
        return currentUsage < limits.credentialsPerMonth
      case 'verify_credential':
        return currentUsage < limits.verificationsPerMonth
      default:
        return true
    }
  }

  async recordUsage(orgId: string, action: string): Promise<void> {
    const key = `usage:${orgId}:${action}:${currentMonth()}`
    await redis.incr(key)
    await redis.expire(key, 60 * 60 * 24 * 32)
  }

  async getUsageReport(orgId: string): Promise<UsageReport> {
    // Retornar reporte detallado de uso
  }
}
```

---

### 6. Jobs Asíncronos y Webhooks

**Estado Actual:**
- Procesamiento síncrono de todas las operaciones
- Anclado en blockchain bloquea el request

**Requerido:**
- Queue system con **BullMQ** o **RabbitMQ**
- Workers para procesos largos:
  - Anclado en blockchain
  - Envío de emails
  - Generación de reportes
  - Procesamiento de lotes
- Sistema de webhooks para notificaciones
- Retry con backoff exponencial

**Implementación con BullMQ:**

```typescript
// apps/api/src/queues/setup.ts
import { Queue, Worker, Job } from 'bullmq'
import Redis from 'ioredis'

const connection = new Redis(process.env.REDIS_URL)

// Definir colas
export const blockchainQueue = new Queue('blockchain', { connection })
export const webhookQueue = new Queue('webhooks', { connection })
export const emailQueue = new Queue('emails', { connection })

// Workers
const blockchainWorker = new Worker(
  'blockchain',
  async (job: Job) => {
    const { credentialId, blockchainNetwork } = job.data

    try {
      // Anclar en blockchain
      const txHash = await anchorToBlockchain(credentialId, blockchainNetwork)

      // Actualizar base de datos
      await updateCredentialBlockchainInfo(credentialId, txHash)

      // Trigger webhook
      await webhookQueue.add('credential.anchored', {
        credentialId,
        txHash,
        network: blockchainNetwork,
      })

      return { success: true, txHash }
    } catch (error) {
      // Retry automático con backoff
      throw error
    }
  },
  {
    connection,
    concurrency: 5,
    limiter: {
      max: 10,
      duration: 1000,
    },
  }
)

const webhookWorker = new Worker(
  'webhooks',
  async (job: Job) => {
    const { event, data, webhookUrl } = job.data

    try {
      const signature = signWebhookPayload(data)

      await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-ProofPass-Event': event,
          'X-ProofPass-Signature': signature,
        },
        body: JSON.stringify(data),
      })

      return { success: true }
    } catch (error) {
      // Retry con backoff exponencial
      throw error
    }
  },
  {
    connection,
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  }
)
```

**API para Jobs:**

```typescript
// apps/api/src/routes/credentials.ts
app.post('/api/credentials/issue', async (request, reply) => {
  // Crear credencial
  const credential = await createCredential(request.body)

  // Encolar job de anclado en blockchain (asíncrono)
  if (request.body.anchorToBlockchain) {
    await blockchainQueue.add('anchor', {
      credentialId: credential.id,
      blockchainNetwork: request.body.network || 'stellar',
    })
  }

  // Retornar inmediatamente
  return reply.code(201).send({
    credential,
    message: 'Credential created. Blockchain anchoring in progress.',
  })
})

// Endpoint para webhooks de la organización
app.post('/api/webhooks', async (request, reply) => {
  const { url, events } = request.body

  await createWebhook({
    organizationId: request.user.organizationId,
    url,
    events, // ['credential.issued', 'credential.verified', 'credential.revoked']
    secret: generateWebhookSecret(),
  })

  return reply.send({ success: true })
})
```

**Dashboard de Jobs:**

```typescript
// Usar Bull Board para UI
import { createBullBoard } from '@bull-board/api'
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter'
import { FastifyAdapter } from '@bull-board/fastify'

const serverAdapter = new FastifyAdapter()

createBullBoard({
  queues: [
    new BullMQAdapter(blockchainQueue),
    new BullMQAdapter(webhookQueue),
    new BullMQAdapter(emailQueue),
  ],
  serverAdapter,
})

serverAdapter.setBasePath('/admin/queues')
app.register(serverAdapter.registerPlugin(), {
  prefix: '/admin/queues',
  basePath: '/admin/queues',
})
```

**Referencias:**
- https://docs.bullmq.io/
- https://www.rabbitmq.com/
- https://github.com/OptimalBits/bull-board

---

## Priorización

### Alta Prioridad (Antes de Production)
1. ✅ **KMS/Vault** - Crítico para seguridad
2. ✅ **DID Real + Firmas Verificables** - Esencial para interoperabilidad
3. ✅ **Rate Limiting Avanzado** - Protección y monetización

### Media Prioridad (Primeras semanas de production)
4. ✅ **Observabilidad** - Necesario para troubleshooting
5. ✅ **Jobs Asíncronos** - Mejora experiencia de usuario
6. ✅ **Webhooks** - Integración con sistemas externos

### Baja Prioridad (Optimización posterior)
7. ⚠️ **ZK Proofs Reales** - Feature avanzado, no bloqueante para MVP

## Estimación de Esfuerzo

| Tarea | Complejidad | Tiempo Estimado | Dependencias |
|-------|-------------|-----------------|--------------|
| KMS Integration | Media | 1-2 semanas | AWS/Vault setup |
| DID + LD-Proofs | Alta | 2-3 semanas | did-jwt-vc, ION |
| Rate Limiting | Baja | 3-5 días | Redis |
| Observability | Media | 1-2 semanas | OTEL, Prometheus |
| Jobs + Webhooks | Media | 1-2 semanas | BullMQ, Redis |
| ZK Circuits | Alta | 3-4 semanas | Circom expertise |

**Total estimado:** 8-12 semanas para completar todas las tareas

## Próximos Pasos

1. Revisar y aprobar este roadmap
2. Priorizar tareas según necesidades del negocio
3. Asignar recursos (developers, DevOps, security)
4. Comenzar con KMS y DID (bloqueantes para production)
5. Paralelizar Observability y Rate Limiting
6. Implementar Jobs/Webhooks una vez API estable
7. ZK Proofs como mejora post-launch

## Referencias y Recursos

### Estándares
- W3C Verifiable Credentials: https://www.w3.org/TR/vc-data-model/
- W3C DIDs: https://www.w3.org/TR/did-core/
- OpenID Connect for VCs: https://openid.net/specs/openid-connect-4-verifiable-credentials-1_0.html

### Librerías
- did-jwt-vc: https://github.com/decentralized-identity/did-jwt-vc
- Circom: https://github.com/iden3/circom
- SnarkJS: https://github.com/iden3/snarkjs
- BullMQ: https://docs.bullmq.io/

### Servicios
- AWS KMS: https://aws.amazon.com/kms/
- HashiCorp Vault: https://www.vaultproject.io/
- OpenTelemetry: https://opentelemetry.io/
- Grafana Cloud: https://grafana.com/products/cloud/

---

*Documento creado: 2025-01-02*
*Última actualización: 2025-01-02*

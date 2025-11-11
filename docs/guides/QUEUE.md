# Job Queues with BullMQ

Complete async job processing system using BullMQ and Redis.

## Overview

BullMQ is a Redis-based queue system for handling async operations:
- **VC Issuance**: Async credential issuance with webhooks
- **VC Verification**: Batch verification processing
- **Webhooks**: Reliable event notifications with retries
- **Emails**: Email sending with templates
- **DID Operations**: Async DID creation and updates

## Architecture

```
┌─────────────┐      ┌──────────┐      ┌──────────┐
│   API       │────▶ │  Queue   │────▶ │  Worker  │
│  Endpoint   │      │  (Redis) │      │(Processor│
└─────────────┘      └──────────┘      └──────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │  Callbacks  │
                    │  (Webhooks) │
                    └─────────────┘
```

## Quick Start

### 1. Start Redis

```bash
# Using Docker
docker run -d --name redis -p 6379:6379 redis:alpine

# Or using docker-compose
docker-compose up -d redis
```

### 2. Configure Environment

```bash
# apps/api/.env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=  # Optional

# Queue configuration
QUEUE_CONCURRENCY=5  # Workers per queue
```

### 3. Queue System Auto-Starts

The queue system initializes automatically when the API starts.

## Available Queues

### 1. VC Issuance Queue

**Purpose**: Async Verifiable Credential issuance

**Job Data**:
```typescript
{
  issuerDid: string;
  subjectDid: string;
  credentialType: string;
  claims: Record<string, any>;
  expirationDate?: string;
  organizationId: string;
  userId: string;
  callbackUrl?: string;  // Webhook notification
}
```

**Result**:
```typescript
{
  vcJwt: string;
  credentialId: string;
  issuedAt: string;
}
```

**Example**:
```typescript
const queue = queueManager.getQueue(QueueName.VC_ISSUANCE);
await queue.add('issue-vc', {
  issuerDid: 'did:key:z6Mk...',
  subjectDid: 'did:key:z6Mk...',
  credentialType: 'VerifiableCredential',
  claims: {
    name: 'John Doe',
    degree: 'Computer Science',
  },
  organizationId: 'org-123',
  userId: 'user-456',
  callbackUrl: 'https://example.com/webhooks/vc-issued',
}, {
  priority: 5,
});
```

### 2. VC Verification Queue

**Purpose**: Async credential verification

**Job Data**:
```typescript
{
  vcJwt: string;
  verifierDid?: string;
  organizationId: string;
  userId: string;
  callbackUrl?: string;
}
```

**Result**:
```typescript
{
  valid: boolean;
  claims?: Record<string, any>;
  issuer?: string;
  subject?: string;
  error?: string;
}
```

### 3. Webhooks Queue

**Purpose**: HTTP callbacks with retries

**Job Data**:
```typescript
{
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH';
  headers?: Record<string, string>;
  payload: Record<string, any>;
  event: string;
  organizationId: string;
}
```

**Features**:
- Automatic retries (3 attempts)
- Exponential backoff
- 5xx errors trigger retry
- 4xx errors recorded as failed

### 4. Emails Queue

**Purpose**: Email sending (template-based)

**Job Data**:
```typescript
{
  to: string;
  subject: string;
  template: string;
  context: Record<string, any>;
  organizationId: string;
  userId?: string;
  attachments?: Array<{
    filename: string;
    content: string;
    encoding?: string;
  }>;
}
```

**Note**: Integrate with SendGrid, AWS SES, or similar service in production.

### 5. DID Operations Queue

**Purpose**: Async DID management

**Job Data**:
```typescript
{
  operation: 'create' | 'update' | 'deactivate';
  didMethod: 'key' | 'web';
  organizationId: string;
  userId: string;
  metadata?: Record<string, any>;
  callbackUrl?: string;
}
```

## API Endpoints

### Queue Statistics

**GET /queue/stats**

Get stats for all queues:

```bash
curl http://localhost:3000/queue/stats
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "name": "vc-issuance",
      "waiting": 5,
      "active": 2,
      "completed": 150,
      "failed": 3,
      "delayed": 0,
      "total": 160
    }
  ]
}
```

**GET /queue/:name/stats**

Get stats for specific queue:

```bash
curl http://localhost:3000/queue/vc-issuance/stats
```

### Job Management

**GET /queue/:name/jobs?status=waiting&start=0&end=10**

List jobs by status:

```bash
curl "http://localhost:3000/queue/vc-issuance/jobs?status=failed"
```

Status options: `waiting`, `active`, `completed`, `failed`, `delayed`

**GET /queue/:name/job/:jobId**

Get job details:

```bash
curl http://localhost:3000/queue/vc-issuance/job/12345
```

**POST /queue/:name/job/:jobId/retry**

Retry a failed job:

```bash
curl -X POST http://localhost:3000/queue/vc-issuance/job/12345/retry
```

**DELETE /queue/:name/job/:jobId**

Remove a job:

```bash
curl -X DELETE http://localhost:3000/queue/vc-issuance/job/12345
```

### Queue Control

**POST /queue/:name/pause**

Pause queue processing:

```bash
curl -X POST http://localhost:3000/queue/vc-issuance/pause
```

**POST /queue/:name/resume**

Resume queue processing:

```bash
curl -X POST http://localhost:3000/queue/vc-issuance/resume
```

**POST /queue/:name/clean**

Clean completed jobs:

```bash
curl -X POST http://localhost:3000/queue/vc-issuance/clean \
  -H "Content-Type: application/json" \
  -d '{"grace": 3600000}'  # 1 hour
```

## Job Priorities

```typescript
enum JobPriority {
  CRITICAL = 0,  // Highest
  HIGH = 1,
  NORMAL = 5,
  LOW = 10,      // Lowest
}
```

Example with priority:
```typescript
await queue.add('critical-job', data, {
  priority: JobPriority.CRITICAL,
});
```

## Job Options

```typescript
await queue.add('job-name', data, {
  priority: 5,
  delay: 5000,              // Delay 5 seconds
  attempts: 3,              // Max 3 retries
  backoff: {
    type: 'exponential',
    delay: 2000,
  },
  removeOnComplete: true,   // Auto-remove when done
  removeOnFail: false,      // Keep failed jobs
});
```

## Error Handling

Jobs automatically retry on failure with exponential backoff:

1. **First attempt fails** → Wait 2 seconds → Retry
2. **Second attempt fails** → Wait 4 seconds → Retry
3. **Third attempt fails** → Mark as failed

Failed jobs are kept for 7 days for debugging.

## Monitoring

### Metrics (OpenTelemetry)

All job processors automatically record:
- Job duration
- Success/failure rates
- Queue depths
- Worker utilization

View in Prometheus:
```promql
# Jobs per second
rate(bullmq_jobs_total[5m])

# Failed jobs rate
rate(bullmq_jobs_failed_total[5m])

# Queue depth
bullmq_jobs_waiting
```

### Logs

Job events are logged:
```
✅ [vc-issuance] Job 12345 completed
❌ [vc-verification] Job 67890 failed: Signature invalid
```

## Production Configuration

### 1. Redis Cluster

For high availability, use Redis Cluster:

```typescript
const redisConnection = {
  host: 'redis-cluster',
  port: 6379,
  password: process.env.REDIS_PASSWORD,
  tls: true,  // Enable TLS in production
};
```

### 2. Worker Scaling

Scale workers horizontally:

```bash
# Run multiple API instances
# Workers will distribute load automatically
pm2 start apps/api/dist/main.js -i 4
```

### 3. Rate Limiting

Configure per-queue rate limits:

```typescript
limiter: {
  max: 100,      // Max 100 jobs
  duration: 1000 // per second
}
```

### 4. Monitoring

- **Bull Board**: Web UI for queue monitoring
- **Prometheus**: Metrics and alerting
- **Grafana**: Visualization

```bash
npm install @bull-board/api @bull-board/fastify
```

## Webhooks Integration

Jobs can trigger webhooks on completion:

```typescript
await queue.add('issue-vc', {
  // ... job data
  callbackUrl: 'https://your-app.com/webhooks/vc-issued',
});
```

Webhook payload:
```json
{
  "event": "vc.issued",
  "credentialId": "vc-12345",
  "vcJwt": "eyJhbGci...",
  "issuedAt": "2025-01-01T00:00:00Z"
}
```

## Best Practices

1. **Idempotency**: Design job processors to be idempotent
2. **Timeouts**: Set reasonable timeouts for long-running jobs
3. **Retries**: Use retries for transient failures only
4. **Dead Letter Queue**: Move permanently failed jobs to DLQ
5. **Monitoring**: Track queue depths and job durations
6. **Cleanup**: Regularly clean old completed jobs
7. **Testing**: Test job processors in isolation

## Troubleshooting

### Jobs stuck in "waiting"

Check if workers are running:
```bash
# Check worker health
curl http://localhost:3000/queue/stats
```

### High memory usage

Clean old jobs:
```bash
curl -X POST http://localhost:3000/queue/vc-issuance/clean
```

### Jobs failing repeatedly

Check logs and retry failed jobs manually:
```bash
curl -X POST http://localhost:3000/queue/vc-issuance/job/12345/retry
```

### Redis connection issues

Verify Redis is accessible:
```bash
redis-cli -h localhost -p 6379 ping
```

## Examples

### Example 1: Async VC Issuance

```typescript
import { queueManager } from './queue/queue-manager';
import { QueueName } from './queue/config';

// Add job to queue
const queue = queueManager.getQueue(QueueName.VC_ISSUANCE);
const job = await queue.add('issue-credential', {
  issuerDid: 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK',
  subjectDid: 'did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH',
  credentialType: 'UniversityDegreeCredential',
  claims: {
    degree: 'Bachelor of Science',
    major: 'Computer Science',
    graduationYear: 2024,
  },
  organizationId: 'org-123',
  userId: 'user-456',
  callbackUrl: 'https://myapp.com/webhooks/vc-issued',
});

console.log(`Job enqueued: ${job.id}`);
```

### Example 2: Bulk Verification

```typescript
const queue = queueManager.getQueue(QueueName.VC_VERIFICATION);

// Verify multiple VCs
for (const vcJwt of vcJwts) {
  await queue.add('verify-vc', {
    vcJwt,
    organizationId: 'org-123',
    userId: 'user-456',
  });
}
```

### Example 3: Custom Worker

```typescript
import { Worker } from 'bullmq';
import { redisConnection } from './queue/config';

const customWorker = new Worker('custom-queue', async (job) => {
  console.log(`Processing job ${job.id}`);
  // Your custom logic here
  return { success: true };
}, {
  connection: redisConnection,
  concurrency: 10,
});

customWorker.on('completed', (job) => {
  console.log(`Job ${job.id} completed`);
});
```

## Resources

- [BullMQ Documentation](https://docs.bullmq.io/)
- [Redis Best Practices](https://redis.io/docs/management/optimization/)
- [Job Queue Patterns](https://docs.bullmq.io/patterns/)

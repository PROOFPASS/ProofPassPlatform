# Observability with OpenTelemetry

Complete observability stack for ProofPass Platform using OpenTelemetry.

## Stack Components

### 1. OpenTelemetry SDK
- **Traces**: Distributed tracing with Jaeger
- **Metrics**: Time-series metrics with Prometheus
- **Logs**: Structured logging with Pino (integrated)

### 2. Visualization
- **Jaeger UI**: http://localhost:16686
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3003

## Quick Start

### 1. Start Observability Stack

```bash
# Start Jaeger, Prometheus, and Grafana
docker-compose -f docker-compose.observability.yml up -d

# Verify services
curl http://localhost:16686  # Jaeger UI
curl http://localhost:9090   # Prometheus
curl http://localhost:3003   # Grafana
```

### 2. Configure Environment

```bash
# apps/api/.env
ENABLE_TRACING=true
ENABLE_METRICS=true
JAEGER_ENDPOINT=http://localhost:14268/api/traces
PROMETHEUS_PORT=9464
SERVICE_NAME=proofpass-api
SERVICE_VERSION=0.1.0
```

### 3. Run API with Telemetry

```bash
cd apps/api
npm run dev
```

## Metrics Available

### HTTP Metrics
- `http_requests_total` - Total HTTP requests
- `http_request_duration_ms` - Request latency
- `http_request_size_bytes` - Request payload size
- `http_response_size_bytes` - Response payload size

### Business Metrics
- `vc_issued_total` - Verifiable Credentials issued
- `vc_verified_total` - VCs verified successfully
- `vc_verification_failures_total` - Failed verifications
- `did_operations_total` - DID operations (create/resolve/update)

### Infrastructure Metrics
- `db_query_duration_ms` - Database query latency
- `db_connections_active` - Active DB connections
- `redis_operation_duration_ms` - Redis operation latency
- `stellar_transactions_total` - Blockchain transactions

### API Key Metrics
- `api_key_requests_total` - Requests per API key
- `api_key_quota_exceeded_total` - Quota exceeded events

## Accessing Dashboards

### Jaeger (Traces)

1. Open http://localhost:16686
2. Select service: `proofpass-api`
3. Click "Find Traces"
4. Explore distributed traces with timing breakdown

### Prometheus (Metrics)

1. Open http://localhost:9090
2. Query metrics:
   ```promql
   # Request rate
   rate(http_requests_total[5m])

   # P95 latency
   histogram_quantile(0.95, rate(http_request_duration_ms_bucket[5m]))

   # Error rate
   rate(http_requests_total{status_code=~"5.."}[5m])
   ```

### Grafana (Visualization)

1. Open http://localhost:3003
2. Default dashboards configured automatically
3. Explore pre-built panels for:
   - Request rate and latency
   - Error rates
   - Business metrics (VCs, DIDs)
   - Infrastructure health

## Custom Instrumentation

### Manual Spans

```typescript
import { withSpan } from './telemetry/middleware';

async function complexOperation() {
  return withSpan('complex-operation', async () => {
    // Your code here
    return result;
  }, {
    'operation.type': 'business-logic',
    'user.id': userId,
  });
}
```

### Recording Custom Metrics

```typescript
import {
  recordVCIssued,
  recordDIDOperation,
  recordAPIKeyRequest
} from './telemetry/metrics';

// Record VC issuance
recordVCIssued('VerifiableCredential', issuerDid);

// Record DID operation
recordDIDOperation('create', 'did:key');

// Record API key usage
recordAPIKeyRequest(apiKeyId, 'pro', quotaExceeded);
```

### Adding Span Attributes

```typescript
import { setSpanAttribute, addSpanEvent } from './telemetry/middleware';

// Add attribute to current span
setSpanAttribute('user.email', email);
setSpanAttribute('credential.type', credentialType);

// Add event to current span
addSpanEvent('credential-validated', {
  'validation.result': 'success',
  'validation.duration_ms': duration,
});
```

## Production Setup

### 1. Jaeger (Distributed Tracing)

**Recommended**: Jaeger with Cassandra or Elasticsearch

```yaml
services:
  jaeger:
    image: jaegertracing/all-in-one:1.52
    environment:
      - SPAN_STORAGE_TYPE=cassandra
      - CASSANDRA_SERVERS=cassandra:9042
```

**Alternative**: Managed services
- AWS X-Ray
- Google Cloud Trace
- Datadog APM

### 2. Prometheus (Metrics)

**Storage**: Configure persistent storage

```yaml
prometheus:
  volumes:
    - prometheus-data:/prometheus
  command:
    - '--storage.tsdb.retention.time=30d'
    - '--storage.tsdb.path=/prometheus'
```

**HA Setup**: Prometheus with Thanos or Cortex for long-term storage

### 3. Alerting

Configure Prometheus alerts:

```yaml
# observability/alerts.yml
groups:
  - name: proofpass_alerts
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status_code=~"5.."}[5m]) > 0.05
        annotations:
          summary: "High error rate detected"

      - alert: HighLatency
        expr: histogram_quantile(0.95, rate(http_request_duration_ms_bucket[5m])) > 1000
        annotations:
          summary: "P95 latency > 1000ms"
```

### 4. Security

- **Authentication**: Enable auth for Grafana/Prometheus in production
- **TLS**: Use HTTPS for all observability endpoints
- **Network**: Restrict access to observability stack
- **Sampling**: Configure trace sampling rate for high-traffic endpoints

## Troubleshooting

### No traces in Jaeger

```bash
# Check Jaeger is running
curl http://localhost:14268/api/traces

# Verify telemetry initialization
# Should see: "✅ OpenTelemetry initialized successfully"

# Check JAEGER_ENDPOINT env var
echo $JAEGER_ENDPOINT
```

### No metrics in Prometheus

```bash
# Check metrics endpoint
curl http://localhost:9464/metrics

# Verify Prometheus scraping
# Prometheus UI -> Status -> Targets
# Should show proofpass-api as "UP"
```

### High Memory Usage

```bash
# Reduce trace sampling
export TRACE_SAMPLE_RATE=0.1  # 10% sampling

# Increase metric export interval (default 10s)
# Edit telemetry/config.ts: exportIntervalMillis: 60000
```

## Best Practices

1. **Sampling**: Use sampling in production to reduce overhead
2. **Cardinality**: Limit high-cardinality labels (avoid user IDs in metrics)
3. **Context Propagation**: Ensure trace context is propagated across services
4. **Resource Attributes**: Tag spans with relevant metadata
5. **Error Tracking**: Always record exceptions in spans
6. **Sensitive Data**: Never log/trace PII or secrets

## Monitoring Checklist

- [ ] Jaeger receiving traces
- [ ] Prometheus scraping metrics
- [ ] Grafana dashboards configured
- [ ] Alerting rules defined
- [ ] Retention policies set
- [ ] Backup configured
- [ ] Access control enabled
- [ ] TLS/HTTPS configured

## Resources

- [OpenTelemetry Docs](https://opentelemetry.io/docs/)
- [Jaeger Docs](https://www.jaegertracing.io/docs/)
- [Prometheus Docs](https://prometheus.io/docs/)
- [Grafana Docs](https://grafana.com/docs/)

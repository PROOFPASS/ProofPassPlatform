# Production Readiness Guide

**Version**: 0.1.0
**Last Updated**: November 2024
**Status**: Pre-Production

---

## Table of Contents

1. [Overview](#overview)
2. [Current Platform Status](#current-platform-status)
3. [Pre-Production Checklist](#pre-production-checklist)
4. [Infrastructure Requirements](#infrastructure-requirements)
5. [Deployment Guide](#deployment-guide)
6. [Security Hardening](#security-hardening)
7. [Monitoring & Observability](#monitoring--observability)
8. [Backup & Disaster Recovery](#backup--disaster-recovery)
9. [Performance Optimization](#performance-optimization)
10. [Post-Deployment Validation](#post-deployment-validation)

---

## Overview

This document provides a comprehensive checklist and guide for deploying ProofPass Platform to a production environment. Follow this guide to ensure a secure, reliable, and performant deployment.

---

## Current Platform Status

### Completed Features

- **Core API**: Fastify-based REST API with comprehensive endpoints
- **Authentication**: JWT + API key authentication
- **Database**: PostgreSQL with migrations
- **Caching**: Redis integration
- **Blockchain**: Multi-chain support (Stellar, Optimism, Arbitrum)
- **W3C Credentials**: Verifiable Credentials generation and verification
- **Zero-Knowledge Proofs**: Basic ZK proof generation and verification
- **Digital Product Passports**: Credential aggregation
- **Rate Limiting**: Multi-tier protection
- **Security**: Input validation, SQL injection prevention, security headers
- **Testing**: Unit and integration tests with 85%+ coverage
- **CI/CD**: GitHub Actions pipeline
- **Documentation**: Comprehensive technical and API documentation

### Known Limitations (v0.1.0)

1. **ZK Proofs**: Simplified implementation, not production-grade zk-SNARKs
2. **API Key Management**: Manual rotation, no automatic expiration
3. **JWT Secret Rotation**: No automated mechanism
4. **Observability**: OpenTelemetry configured but needs production setup
5. **Load Testing**: Not yet performed at scale
6. **External Security Audit**: Pending

---

## Pre-Production Checklist

### Phase 1: Infrastructure Setup

- [ ] Provision production servers (minimum requirements: 4 CPU, 8GB RAM, 50GB SSD)
- [ ] Set up PostgreSQL database (v14+)
- [ ] Set up Redis instance (v7+)
- [ ] Configure load balancer (if using multiple instances)
- [ ] Set up CDN for static assets (optional)
- [ ] Register production domains
- [ ] Obtain SSL/TLS certificates (Let's Encrypt or commercial)

### Phase 2: Environment Configuration

- [ ] Create production `.env` file with secure secrets
- [ ] Generate strong JWT_SECRET (256-bit minimum)
- [ ] Generate strong database passwords
- [ ] Configure CORS for production domains only
- [ ] Set up blockchain accounts (Stellar, Optimism, Arbitrum)
- [ ] Fund blockchain accounts with sufficient balance
- [ ] Configure environment-specific variables
- [ ] Test all environment variables

### Phase 3: Security Hardening

- [ ] Enable HTTPS/TLS 1.3 everywhere
- [ ] Configure HSTS headers
- [ ] Set up Web Application Firewall (WAF) if available
- [ ] Configure rate limiting thresholds
- [ ] Enable security headers (Helmet.js)
- [ ] Restrict database access to application servers only
- [ ] Set up secret management (AWS Secrets Manager, HashiCorp Vault, or OpenBao)
- [ ] Configure backup encryption
- [ ] Enable database SSL/TLS connections
- [ ] Review and test CORS configuration
- [ ] Configure CSP headers
- [ ] Set up IP whitelisting for admin endpoints

### Phase 4: Database Setup

- [ ] Run all database migrations
- [ ] Create database indexes
- [ ] Set up database connection pooling
- [ ] Configure database backups (daily minimum)
- [ ] Test database restore procedure
- [ ] Set up replication (if high availability required)
- [ ] Configure database monitoring
- [ ] Run VACUUM ANALYZE

### Phase 5: Monitoring & Logging

- [ ] Set up centralized logging (ELK, Datadog, or similar)
- [ ] Configure log retention policies
- [ ] Set up Prometheus metrics collection
- [ ] Configure Jaeger for distributed tracing
- [ ] Set up alerting for critical errors
- [ ] Configure uptime monitoring (UptimeRobot, Pingdom)
- [ ] Set up performance monitoring (APM)
- [ ] Create monitoring dashboards
- [ ] Configure alert notification channels (email, Slack, PagerDuty)

### Phase 6: Testing

- [ ] Run full test suite (`npm run test`)
- [ ] Run security scan (`npm audit`)
- [ ] Perform load testing (Apache JMeter, k6)
- [ ] Test rate limiting under load
- [ ] Test blockchain integrations on testnets
- [ ] Verify SSL/TLS configuration (SSL Labs)
- [ ] Test disaster recovery procedures
- [ ] Perform penetration testing (if possible)
- [ ] Test API endpoints with production-like data
- [ ] Verify CORS configuration

### Phase 7: Documentation

- [ ] Document production architecture
- [ ] Create runbook for common operations
- [ ] Document incident response procedures
- [ ] Create database backup/restore procedures
- [ ] Document deployment process
- [ ] Create troubleshooting guide
- [ ] Document monitoring and alerting
- [ ] Create API changelog

### Phase 8: Compliance & Legal

- [ ] Review privacy policy
- [ ] Ensure GDPR compliance (if applicable)
- [ ] Review terms of service
- [ ] Document data retention policies
- [ ] Set up audit logging for compliance
- [ ] Review open-source license compliance
- [ ] Prepare security incident response plan

---

## Infrastructure Requirements

### Minimum Requirements (Small Scale)

**Application Server:**
- 2 CPU cores
- 4 GB RAM
- 20 GB SSD storage
- Ubuntu 22.04 LTS

**Database Server (PostgreSQL):**
- 2 CPU cores
- 4 GB RAM
- 50 GB SSD storage

**Cache Server (Redis):**
- 1 CPU core
- 2 GB RAM
- 10 GB storage

### Recommended Requirements (Production Scale)

**Application Servers (2+ instances for HA):**
- 4 CPU cores per instance
- 8 GB RAM per instance
- 50 GB SSD storage per instance
- Load balancer in front

**Database Server (PostgreSQL):**
- 4 CPU cores
- 16 GB RAM
- 200 GB SSD storage
- Replication enabled

**Cache Server (Redis):**
- 2 CPU cores
- 4 GB RAM
- 20 GB storage
- Redis Sentinel or Cluster for HA

**Additional Services:**
- Monitoring server (Prometheus + Grafana)
- Log aggregation server
- Backup storage (S3 or equivalent)

### Cloud Provider Options

#### AWS
- **Compute**: EC2 t3.medium or t3.large
- **Database**: RDS PostgreSQL db.t3.medium
- **Cache**: ElastiCache Redis cache.t3.medium
- **Load Balancer**: Application Load Balancer
- **Storage**: S3 for backups
- **Monitoring**: CloudWatch

#### Google Cloud
- **Compute**: Compute Engine n1-standard-2
- **Database**: Cloud SQL for PostgreSQL
- **Cache**: Memorystore for Redis
- **Load Balancer**: Cloud Load Balancing
- **Storage**: Cloud Storage for backups

#### DigitalOcean
- **Compute**: Droplets (2-4 GB)
- **Database**: Managed PostgreSQL
- **Cache**: Managed Redis
- **Load Balancer**: Load Balancer
- **Storage**: Spaces for backups

#### Self-Hosted (On-Premise)
- Docker Compose setup
- Kubernetes cluster (for larger deployments)
- Bare metal servers

---

## Deployment Guide

### Step 1: Prepare Infrastructure

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose-plugin

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker
```

### Step 2: Clone Repository

```bash
# Clone to /opt/proofpass
sudo mkdir -p /opt/proofpass
sudo chown $USER:$USER /opt/proofpass
cd /opt/proofpass

git clone https://github.com/PROOFPASS/ProofPassPlatform.git .
```

### Step 3: Configure Environment

```bash
# Copy production environment template
cp .env.production.example .env.production

# Edit with production values
nano .env.production
```

**Required Environment Variables:**

```bash
# Application
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

# Database
DATABASE_URL=postgresql://user:password@db-host:5432/proofpass?ssl=true

# Redis
REDIS_URL=redis://:password@redis-host:6379

# Security
JWT_SECRET=<generate-with-openssl-rand-base64-32>
API_KEY_SALT=<generate-with-openssl-rand-base64-32>
CORS_ORIGIN=https://app.proofpass.com

# Blockchain - Stellar
STELLAR_NETWORK=mainnet
STELLAR_HORIZON_URL=https://horizon.stellar.org
STELLAR_ISSUER_SECRET=<stellar-secret-key>

# Blockchain - Optimism (Optional)
OPTIMISM_RPC_URL=https://mainnet.optimism.io
OPTIMISM_PRIVATE_KEY=<private-key>

# Blockchain - Arbitrum (Optional)
ARBITRUM_RPC_URL=https://arb1.arbitrum.io/rpc
ARBITRUM_PRIVATE_KEY=<private-key>

# Monitoring
JAEGER_ENDPOINT=http://jaeger:14268/api/traces
PROMETHEUS_PORT=9464
ENABLE_TRACING=true
ENABLE_METRICS=true
```

### Step 4: SSL Certificates

```bash
# Install Certbot
sudo apt install certbot

# Generate certificates
sudo certbot certonly --standalone -d api.proofpass.com
sudo certbot certonly --standalone -d platform.proofpass.com

# Copy to project
sudo mkdir -p nginx/ssl
sudo cp /etc/letsencrypt/live/api.proofpass.com/fullchain.pem nginx/ssl/api.crt
sudo cp /etc/letsencrypt/live/api.proofpass.com/privkey.pem nginx/ssl/api.key
sudo cp /etc/letsencrypt/live/platform.proofpass.com/fullchain.pem nginx/ssl/platform.crt
sudo cp /etc/letsencrypt/live/platform.proofpass.com/privkey.pem nginx/ssl/platform.key

# Set permissions
sudo chmod 644 nginx/ssl/*.crt
sudo chmod 600 nginx/ssl/*.key
```

### Step 5: Build and Deploy

```bash
# Build Docker images
docker-compose -f docker-compose.production.yml build

# Start services
docker-compose -f docker-compose.production.yml up -d

# Check status
docker-compose -f docker-compose.production.yml ps

# View logs
docker-compose -f docker-compose.production.yml logs -f
```

### Step 6: Run Database Migrations

```bash
# Run migrations
docker-compose -f docker-compose.production.yml exec api npm run db:migrate

# Verify database
docker-compose -f docker-compose.production.yml exec postgres psql -U proofpass -d proofpass -c "\dt"
```

### Step 7: Verify Deployment

```bash
# Test API health
curl https://api.proofpass.com/health

# Expected response:
# {"status":"healthy","timestamp":"2024-11-13T10:00:00Z"}

# Test Platform
curl https://platform.proofpass.com

# Should return 200 OK
```

---

## Security Hardening

### Firewall Configuration

```bash
# UFW Firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP (redirect to HTTPS)
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# Verify
sudo ufw status
```

### Secret Generation

```bash
# Generate JWT Secret
openssl rand -base64 32

# Generate API Key Salt
openssl rand -base64 32

# Generate database password
openssl rand -base64 24 | tr -d "=+/" | cut -c1-32
```

### Database Security

```sql
-- Create database user with limited privileges
CREATE USER proofpass_app WITH PASSWORD 'strong-password';

-- Grant only necessary permissions
GRANT CONNECT ON DATABASE proofpass TO proofpass_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO proofpass_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO proofpass_app;

-- Revoke dangerous permissions
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON SCHEMA public FROM proofpass_app;
GRANT USAGE ON SCHEMA public TO proofpass_app;
```

### Rate Limiting Configuration

Adjust rate limits based on expected traffic:

```typescript
// apps/api/src/middleware/rate-limit.ts
export const rateLimitConfig = {
  global: { max: 100, timeWindow: '1 minute' },  // Adjust for production
  auth: { max: 5, timeWindow: '15 minutes' },    // Strict for brute-force protection
  user: { max: 200, timeWindow: '1 minute' },     // Per authenticated user
  expensive: { max: 20, timeWindow: '1 minute' }, // ZK proofs, blockchain ops
};
```

---

## Monitoring & Observability

### Prometheus Setup

**Metrics to Monitor:**
- Request rate (req/s)
- Error rate (%)
- Response time (p50, p95, p99)
- Database connection pool usage
- Redis cache hit ratio
- Memory usage
- CPU usage

**Sample Prometheus Configuration:**

```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'proofpass-api'
    static_configs:
      - targets: ['api:9464']
```

### Grafana Dashboards

Create dashboards for:
1. API Performance (requests, latency, errors)
2. System Resources (CPU, RAM, disk)
3. Database Metrics (queries, connections, slow queries)
4. Cache Performance (hit rate, memory usage)
5. Business Metrics (attestations created, verifications, users)

### Alerting Rules

**Critical Alerts:**
- API down or unhealthy
- Database connection failures
- Error rate > 5%
- Response time p99 > 2s
- Disk space < 10%
- Memory usage > 90%

**Warning Alerts:**
- Error rate > 1%
- Response time p99 > 1s
- Disk space < 20%
- Memory usage > 80%
- Rate limit violations spike

---

## Backup & Disaster Recovery

### Database Backup Strategy

**Daily Backups:**

```bash
# Create backup script: /opt/proofpass/scripts/backup-db.sh
#!/bin/bash
BACKUP_DIR=/opt/proofpass/backups
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE=$BACKUP_DIR/proofpass_$DATE.sql.gz

# Create backup
docker-compose -f /opt/proofpass/docker-compose.production.yml exec -T postgres \
  pg_dump -U proofpass proofpass | gzip > $BACKUP_FILE

# Upload to S3 (or other cloud storage)
aws s3 cp $BACKUP_FILE s3://proofpass-backups/

# Cleanup old local backups (keep last 7 days)
find $BACKUP_DIR -name "proofpass_*.sql.gz" -mtime +7 -delete

# Log backup
echo "[$DATE] Backup completed: $BACKUP_FILE" >> /var/log/proofpass-backup.log
```

**Schedule with cron:**

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /opt/proofpass/scripts/backup-db.sh
```

### Restore Procedure

```bash
# Download backup
aws s3 cp s3://proofpass-backups/proofpass_20241113_020000.sql.gz ./

# Extract
gunzip proofpass_20241113_020000.sql.gz

# Restore
docker-compose -f docker-compose.production.yml exec -T postgres \
  psql -U proofpass proofpass < proofpass_20241113_020000.sql
```

### Disaster Recovery Plan

**RTO (Recovery Time Objective)**: 4 hours
**RPO (Recovery Point Objective)**: 24 hours (daily backups)

**Recovery Steps:**

1. **Assess Damage**: Determine extent of failure
2. **Provision Infrastructure**: Deploy to backup region/provider
3. **Restore Database**: Use most recent backup
4. **Deploy Application**: Pull latest Docker images
5. **Update DNS**: Point domains to new infrastructure
6. **Verify**: Run health checks and tests
7. **Monitor**: Watch for issues post-recovery
8. **Post-Mortem**: Document incident and improvements

---

## Performance Optimization

### Database Optimization

```sql
-- Create indexes on frequently queried columns
CREATE INDEX idx_attestations_user_id ON attestations(user_id);
CREATE INDEX idx_attestations_created_at ON attestations(created_at DESC);
CREATE INDEX idx_attestations_status ON attestations(status) WHERE status = 'active';

-- Analyze tables
ANALYZE attestations;
ANALYZE users;
ANALYZE api_keys;

-- Enable query performance tracking
ALTER DATABASE proofpass SET track_activity_query_size = 8192;
ALTER DATABASE proofpass SET pg_stat_statements.track = all;
```

### Redis Caching Strategy

```typescript
// Cache frequently accessed data
const CACHE_KEYS = {
  attestation: (id: string) => `attestation:${id}`,
  user: (id: string) => `user:${id}`,
  verification: (id: string) => `verification:${id}`,
};

const CACHE_TTL = {
  attestation: 3600,      // 1 hour
  user: 1800,             // 30 minutes
  verification: 600,      // 10 minutes
};
```

### Application Performance

- **Connection Pooling**: Configure PostgreSQL pool (min: 5, max: 20)
- **Compression**: Enable gzip compression for API responses
- **CDN**: Use CDN for static assets
- **Caching**: Implement HTTP caching headers
- **Pagination**: Limit query results (max 100 per page)

---

## Post-Deployment Validation

### Functional Testing

```bash
# Test authentication
curl -X POST https://api.proofpass.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# Test attestation creation (with auth token)
curl -X POST https://api.proofpass.com/api/v1/attestations \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "templateId": "uuid",
    "subject": {"id": "PROD-123", "type": "Product"},
    "claims": {"certificationId": "CERT-001"}
  }'

# Test verification
curl https://api.proofpass.com/api/v1/attestations/<id>/verify
```

### Security Testing

```bash
# SSL Labs Test
# Visit: https://www.ssllabs.com/ssltest/analyze.html?d=api.proofpass.com

# Security Headers Test
curl -I https://api.proofpass.com | grep -i "x-"

# Rate Limiting Test
for i in {1..150}; do
  curl -s -o /dev/null -w "%{http_code}\n" https://api.proofpass.com/health
done
# Should see 429 responses after threshold
```

### Performance Testing

```bash
# Install k6
sudo apt install k6

# Run load test
k6 run --vus 100 --duration 30s load-test.js
```

**Sample load-test.js:**

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export default function () {
  const res = http.get('https://api.proofpass.com/health');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 200ms': (r) => r.timings.duration < 200,
  });
  sleep(1);
}
```

---

## Production Deployment Checklist (Final)

### Go-Live Checklist

- [ ] All tests passing
- [ ] Security audit completed
- [ ] Load testing completed
- [ ] Backup and restore tested
- [ ] Monitoring and alerting configured
- [ ] Documentation complete
- [ ] SSL certificates valid
- [ ] Environment variables secured
- [ ] Database migrations applied
- [ ] Rate limiting tested
- [ ] CORS configured correctly
- [ ] Error handling verified
- [ ] Logging configured
- [ ] Team trained on runbooks
- [ ] Incident response plan ready
- [ ] Status page set up (optional)
- [ ] Communication plan for users

### Post-Launch (Week 1)

- [ ] Monitor error rates daily
- [ ] Review performance metrics
- [ ] Check security alerts
- [ ] Verify backup completion
- [ ] Review user feedback
- [ ] Monitor blockchain transactions
- [ ] Check database performance
- [ ] Review logs for anomalies

### Ongoing Maintenance

- **Daily**: Monitor health checks, error logs
- **Weekly**: Review performance metrics, security alerts
- **Monthly**: Update dependencies, security patches, review rate limits
- **Quarterly**: Security review, disaster recovery test, capacity planning
- **Annually**: External security audit, architecture review

---

## Support and Resources

### Documentation
- [API Reference](docs/API_REFERENCE.md)
- [Security Best Practices](docs/SECURITY.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Getting Started](docs/GETTING_STARTED.md)

### Community
- GitHub Issues: [Report bugs or request features](https://github.com/PROOFPASS/ProofPassPlatform/issues)
- GitHub Discussions: [Ask questions or discuss](https://github.com/PROOFPASS/ProofPassPlatform/discussions)

### Contact
- Email: fboiero@frvm.utn.edu.ar
- GitHub: [@fboiero](https://github.com/fboiero)

---

**Last Updated**: November 2024
**Version**: 0.1.0
**Next Review**: Before v1.0.0 release

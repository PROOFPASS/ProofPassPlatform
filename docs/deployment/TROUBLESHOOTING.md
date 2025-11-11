# Troubleshooting Guide - ProofPass Platform

## 🔍 Quick Diagnosis

**Problem?** Start here:

```bash
# Check all services status
docker-compose ps

# View all logs
docker-compose logs --tail=100

# Check API health
curl http://localhost:3000/health

# Check readiness (DB + Redis)
curl http://localhost:3000/ready
```

---

## 🚨 Common Issues & Solutions

### 1. Container Won't Start

#### Symptom
```bash
$ docker-compose up -d
Error response from daemon: driver failed programming external connectivity on endpoint proofpass-api
```

#### Cause
Port already in use by another service.

#### Solution
```bash
# Check what's using the port
sudo lsof -i :3000
sudo lsof -i :5432
sudo lsof -i :6379

# Kill the process or change ports in docker-compose.yml
sudo kill -9 <PID>

# Or use different ports
# Edit docker-compose.yml:
ports:
  - "3001:3000"  # Map external 3001 to internal 3000
```

---

### 2. Database Connection Failed

#### Symptom
```
Error: connect ECONNREFUSED 127.0.0.1:5432
PostgreSQL is unavailable
```

#### Diagnosis
```bash
# Check if PostgreSQL container is running
docker-compose ps postgres

# Check PostgreSQL logs
docker-compose logs postgres

# Try connecting manually
docker-compose exec postgres psql -U postgres -d proofpass
```

#### Solutions

**A. Container not started:**
```bash
docker-compose up -d postgres
docker-compose logs -f postgres
```

**B. Wrong credentials:**
```bash
# Check .env.docker file
cat .env.docker

# Verify DATABASE_URL matches docker-compose.yml
echo $DATABASE_URL
```

**C. Database doesn't exist:**
```bash
# Create database manually
docker-compose exec postgres psql -U postgres -c "CREATE DATABASE proofpass;"
```

**D. Migrations failed:**
```bash
# Check migration logs
docker-compose logs api | grep -i migration

# Run migrations manually
docker-compose exec api node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT NOW()').then(() => {
  console.log('✅ Database connected');
  pool.end();
}).catch(err => {
  console.error('❌ Database error:', err.message);
  pool.end();
});
"
```

---

### 3. Redis Connection Failed

#### Symptom
```
Redis Client Error: connect ECONNREFUSED 127.0.0.1:6379
```

#### Diagnosis
```bash
# Check Redis container
docker-compose ps redis

# Check Redis logs
docker-compose logs redis

# Test Redis connection
docker-compose exec redis redis-cli ping
# Expected: PONG
```

#### Solutions

**A. Container not started:**
```bash
docker-compose up -d redis
```

**B. Redis crashed:**
```bash
# Check logs for errors
docker-compose logs redis

# Restart Redis
docker-compose restart redis
```

**C. Wrong Redis URL:**
```bash
# Verify REDIS_URL in environment
docker-compose exec api printenv | grep REDIS_URL
# Expected: redis://redis:6379
```

---

### 4. API Returns 502 Bad Gateway

#### Symptom
```bash
$ curl http://localhost:3000/health
<html>
<head><title>502 Bad Gateway</title></head>
</html>
```

#### Diagnosis
```bash
# Check if API container is running
docker-compose ps api

# Check API logs for errors
docker-compose logs --tail=50 api

# Check if API is listening on port
docker-compose exec api netstat -tulpn | grep 3000
```

#### Solutions

**A. API crashed:**
```bash
# View crash logs
docker-compose logs api

# Restart API
docker-compose restart api
```

**B. Wrong port configuration:**
```bash
# Check PORT environment variable
docker-compose exec api printenv | grep PORT

# Should match internal port in Dockerfile
```

**C. Health check failing:**
```bash
# Test health endpoint from inside container
docker-compose exec api curl http://localhost:3000/health

# If works internally but not externally, check port mapping
docker-compose ps api
# Should show: 0.0.0.0:3000->3000/tcp
```

---

### 5. Migrations Not Running

#### Symptom
```
Table "users" doesn't exist
```

#### Diagnosis
```bash
# Check if migrations table exists
docker-compose exec postgres psql -U postgres -d proofpass -c "SELECT * FROM schema_migrations;"

# Check migration files
docker-compose exec api ls -la apps/api/dist/config/migrations/
```

#### Solutions

**A. Migrations never ran:**
```bash
# Check entrypoint script logs
docker-compose logs api | grep -i migration

# Run migrations manually
docker-compose exec api sh /app/docker-entrypoint.sh
```

**B. Migration failed:**
```bash
# Check for SQL errors in logs
docker-compose logs api | grep -i error

# Rollback and retry
docker-compose exec postgres psql -U postgres -d proofpass -c "DROP TABLE IF EXISTS schema_migrations;"
docker-compose restart api
```

**C. Migration files missing:**
```bash
# Rebuild container with migrations
docker-compose build --no-cache api
docker-compose up -d api
```

---

### 6. JWT Token Invalid

#### Symptom
```json
{
  "error": "Unauthorized",
  "message": "Invalid token"
}
```

#### Diagnosis
```bash
# Check JWT_SECRET is set
docker-compose exec api printenv | grep JWT_SECRET

# Verify token format
# JWT should be: header.payload.signature
echo "YOUR_TOKEN" | cut -d'.' -f1,2,3
```

#### Solutions

**A. Secret changed after token generation:**
```bash
# All users must re-login after secret change
# This is expected behavior for security
```

**B. Secret not set:**
```bash
# Set JWT_SECRET in .env.docker
nano .env.docker

# Add:
JWT_SECRET=your-very-long-secret-key-min-32-characters

# Restart
docker-compose restart api
```

**C. Token expired:**
```bash
# Default expiration: 24 hours
# User must login again
# Or increase JWT_EXPIRES_IN in environment
```

---

### 7. Rate Limit Errors

#### Symptom
```json
{
  "error": "Too Many Requests",
  "statusCode": 429
}
```

#### Diagnosis
```bash
# Check rate limit headers in response
curl -I http://localhost:3000/api/v1/attestations

# Expected headers:
# x-ratelimit-limit: 60
# x-ratelimit-remaining: 45
# x-ratelimit-reset: 1698480000
```

#### Solutions

**A. Testing/Development:**
```bash
# Temporarily disable rate limiting
# Edit docker-compose.yml:
environment:
  RATE_LIMIT_ENABLED: "false"  # NOT FOR PRODUCTION

# Or increase limits (see src/middleware/rate-limit.ts)
```

**B. Production - legitimate traffic:**
```bash
# Scale horizontally (multiple instances)
# Use Redis cluster for distributed rate limiting
# Implement API key tiers with different limits
```

**C. Clear rate limit data:**
```bash
# Clear Redis (development only!)
docker-compose exec redis redis-cli FLUSHALL
```

---

### 8. Swagger UI Not Loading

#### Symptom
Accessing `/docs` returns 404 or blank page.

#### Diagnosis
```bash
# Check if Swagger route is registered
docker-compose logs api | grep -i swagger

# Test OpenAPI JSON endpoint
curl http://localhost:3000/documentation/json
```

#### Solutions

**A. Route not registered:**
```bash
# Rebuild with latest code
git pull
docker-compose build --no-cache api
docker-compose up -d api
```

**B. CSP (Content Security Policy) blocking:**
```bash
# Check browser console for CSP errors
# May need to adjust CSP in src/main.ts
```

---

### 9. Stellar Blockchain Errors

#### Symptom
```
Error: Stellar account not found
Error: Bad authentication
```

#### Diagnosis
```bash
# Check Stellar network configuration
docker-compose exec api printenv | grep STELLAR

# Verify account exists on network
curl "https://horizon-testnet.stellar.org/accounts/YOUR_PUBLIC_KEY"
```

#### Solutions

**A. Account not created:**
```bash
# Create testnet account
npm run setup:stellar

# Or use Stellar Laboratory:
# https://laboratory.stellar.org/#account-creator?network=test
```

**B. Wrong network:**
```bash
# Testnet vs Mainnet mismatch
# Verify STELLAR_NETWORK in environment
# Testnet keys don't work on mainnet and vice versa
```

**C. Account has no balance:**
```bash
# Fund testnet account:
# https://laboratory.stellar.org/#account-creator?network=test

# Check balance:
curl "https://horizon-testnet.stellar.org/accounts/YOUR_PUBLIC_KEY"
```

---

### 10. High Memory Usage

#### Symptom
```bash
$ docker stats
CONTAINER       CPU %    MEM USAGE / LIMIT     MEM %
proofpass-api   15%      1.8GB / 2GB          90%
```

#### Diagnosis
```bash
# Check container resource usage
docker stats

# Check Node.js heap
docker-compose exec api node -e "console.log(process.memoryUsage())"

# Check for memory leaks
docker-compose logs api | grep -i "out of memory"
```

#### Solutions

**A. Increase memory limit:**
```yaml
# docker-compose.yml
services:
  api:
    deploy:
      resources:
        limits:
          memory: 4G
```

**B. Optimize Node.js heap:**
```yaml
environment:
  NODE_OPTIONS: "--max-old-space-size=2048"  # 2GB heap
```

**C. Check for leaks:**
```bash
# Enable Node.js inspector
docker-compose exec api node --inspect=0.0.0.0:9229 apps/api/dist/main.js

# Use Chrome DevTools to profile
```

---

## 🔬 Advanced Debugging

### Enable Debug Logging

```bash
# Edit docker-compose.yml
environment:
  LOG_LEVEL: debug

# Restart
docker-compose restart api

# View detailed logs
docker-compose logs -f api
```

### Access Container Shell

```bash
# API container
docker-compose exec api sh

# PostgreSQL container
docker-compose exec postgres sh

# Redis container
docker-compose exec redis sh
```

### Inspect Database

```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U postgres -d proofpass

# Common queries:
\dt                          # List tables
\d users                     # Describe users table
SELECT COUNT(*) FROM users;  # Count users
SELECT * FROM schema_migrations;  # View migrations
```

### Network Debugging

```bash
# Check container networking
docker network ls
docker network inspect proofpassplatform_default

# Test connectivity between containers
docker-compose exec api ping postgres
docker-compose exec api ping redis

# Check DNS resolution
docker-compose exec api nslookup postgres
```

### Performance Profiling

```bash
# Enable Node.js profiling
docker-compose exec api node --prof apps/api/dist/main.js

# Generate flame graph
docker-compose exec api node --prof-process isolate-*.log > profile.txt

# Use clinic.js for detailed analysis
npm install -g clinic
clinic doctor -- node apps/api/dist/main.js
```

---

## 🛠️ Tools & Commands Reference

### Docker Commands

```bash
# View all containers
docker ps -a

# Remove stopped containers
docker-compose rm

# Force recreate containers
docker-compose up -d --force-recreate

# Rebuild without cache
docker-compose build --no-cache

# View container resource usage
docker stats

# Inspect container
docker inspect proofpass-api

# Copy files from container
docker cp proofpass-api:/app/logs ./logs
```

### Database Commands

```bash
# Backup database
docker-compose exec postgres pg_dump -U postgres proofpass > backup.sql

# Restore database
docker-compose exec -T postgres psql -U postgres proofpass < backup.sql

# Reset database (DANGER!)
docker-compose exec postgres psql -U postgres -c "DROP DATABASE proofpass;"
docker-compose exec postgres psql -U postgres -c "CREATE DATABASE proofpass;"
docker-compose restart api
```

### Log Analysis

```bash
# Tail logs
docker-compose logs -f --tail=100 api

# Search logs
docker-compose logs api | grep -i error

# Export logs
docker-compose logs > proofpass-logs-$(date +%Y%m%d).txt

# Count errors
docker-compose logs api | grep -i error | wc -l
```

---

## 📊 Monitoring Checklist

Regular checks to perform:

- [ ] **Health endpoint:** Returns 200 OK
- [ ] **Readiness endpoint:** DB and Redis connected
- [ ] **Docker stats:** Memory/CPU usage reasonable
- [ ] **Disk space:** At least 20% free
- [ ] **Database size:** Monitor growth
- [ ] **Redis memory:** Check usage
- [ ] **API response times:** < 500ms average
- [ ] **Error rate:** < 1% of requests
- [ ] **SSL certificate:** Valid and not expiring soon
- [ ] **Logs:** No recurring errors

---

## 🆘 Emergency Procedures

### Complete Reset (Development Only!)

```bash
# WARNING: This deletes ALL data!
docker-compose down -v
docker-compose up -d
```

### Rollback to Previous Version

```bash
# Stop current version
docker-compose down

# Checkout previous version
git log --oneline
git checkout <previous-commit-hash>

# Rebuild and start
docker-compose build --no-cache
docker-compose up -d
```

### Emergency Database Backup

```bash
# Quick backup before risky operation
docker-compose exec postgres pg_dump -U postgres proofpass | gzip > emergency-backup-$(date +%Y%m%d-%H%M%S).sql.gz
```

---

## 📞 Getting Help

If you're stuck:

1. **Check logs first:** `docker-compose logs --tail=100`
2. **Search documentation:** [docs/README.md](../README.md)
3. **GitHub Issues:** Search existing issues
4. **Create new issue:** Include logs and steps to reproduce
5. **Email support:** fboiero@frvm.utn.edu.ar

**When reporting issues, include:**
- Docker version: `docker --version`
- Docker Compose version: `docker compose version`
- OS: `uname -a`
- Logs: `docker-compose logs > logs.txt`
- Configuration (without secrets!)

---

**Last Updated:** October 28, 2024
**Version:** 1.0.0

# Docker Deployment Quick Start

Complete guide for deploying ProofPass Platform using Docker in production.

**Last Updated:** 2025-11-03
**Platform Version:** 2.0.0
**Deployment Time:** 10-15 minutes

---

## 📋 Prerequisites

- Docker Engine 20.10+ installed
- Docker Compose V2 installed
- Minimum 2GB RAM available
- Minimum 10GB disk space
- Domain name (optional, for HTTPS)
- SSL certificate (optional, for HTTPS)

**Verify Installation:**
```bash
docker --version
# Expected: Docker version 20.10.0 or higher

docker compose version
# Expected: Docker Compose version v2.0.0 or higher
```

---

## 🚀 Production Deployment (Docker Compose)

### Step 1: Clone Repository

```bash
# Clone the repository
git clone https://github.com/PROOFPASS/ProofPassPlatform.git
cd ProofPassPlatform
```

### Step 2: Configure Environment

The platform uses `docker-compose.prod.yml` which references environment variables. Create your production environment file:

```bash
# Copy the example file
cp .env.production.example .env.production

# Edit with your values
nano .env.production
```

**Required Environment Variables:**

```bash
# === CRITICAL: Change these for production! ===

# Database Configuration
POSTGRES_USER=proofpass
POSTGRES_PASSWORD=$(openssl rand -base64 32)  # Generate strong password
POSTGRES_DB=proofpass

# Redis Configuration
REDIS_PASSWORD=$(openssl rand -base64 32)  # Generate strong password

# JWT & API Keys (MUST be at least 32 characters)
JWT_SECRET=$(openssl rand -base64 48)
JWT_EXPIRES_IN=7d
API_KEY_SALT=$(openssl rand -base64 48)

# Stellar Blockchain (for VCs)
STELLAR_NETWORK=testnet  # or 'mainnet' for production
STELLAR_SECRET_KEY=your-stellar-secret-key
STELLAR_PUBLIC_KEY=your-stellar-public-key

# API Configuration
API_PORT=3000
LOG_LEVEL=warn  # Options: error, warn, info, debug
NODE_ENV=production

# Public URLs
PUBLIC_URL=https://yourdomain.com
CORS_ORIGIN=https://yourdomain.com  # or '*' for all origins
```

**Generate Secure Secrets:**
```bash
# Generate JWT secret
openssl rand -base64 48

# Generate API key salt
openssl rand -base64 48

# Generate database password
openssl rand -base64 32

# Generate Redis password
openssl rand -base64 32
```

**Stellar Keys Setup:**

Option 1 - Generate new keys:
```bash
# Install dependencies
npm install

# Run Stellar key generation
npm run setup:stellar
```

Option 2 - Use Stellar Laboratory:
- Visit: https://laboratory.stellar.org/#account-creator?network=test
- For testnet: Select "Test" network
- For production: Select "Public" network
- Click "Generate keypair"
- **IMPORTANT:** Save both keys securely

### Step 3: Review Docker Compose Configuration

The `docker-compose.prod.yml` file configures all services:

```yaml
# Services included:
# - postgres: PostgreSQL 14 database
# - redis: Redis 7 cache
# - api: ProofPass API (Fastify backend)
# - nginx: Reverse proxy with SSL support
```

**View the configuration:**
```bash
cat docker-compose.prod.yml
```

### Step 4: Start Services

```bash
# Load environment variables
export $(cat .env.production | xargs)

# Start all services in detached mode
docker compose -f docker-compose.prod.yml up -d

# Wait for services to become healthy (about 30-60 seconds)
sleep 60

# Check service status
docker compose -f docker-compose.prod.yml ps
```

**Expected Output:**
```
NAME                IMAGE                   STATUS
proofpass-api       proofpass-api:latest    Up (healthy)
proofpass-db        postgres:14-alpine      Up (healthy)
proofpass-redis     redis:7-alpine          Up (healthy)
proofpass-nginx     nginx:alpine            Up
```

### Step 5: Verify Deployment

```bash
# Check API health
curl http://localhost:3000/health

# Expected response:
# {
#   "status": "ok",
#   "timestamp": "2025-11-03T10:00:00Z",
#   "version": "2.0.0"
# }

# Check readiness (includes DB and Redis)
curl http://localhost:3000/ready

# View API logs
docker compose -f docker-compose.prod.yml logs -f api

# View all service logs
docker compose -f docker-compose.prod.yml logs -f
```

### Step 6: Access Swagger Documentation

```bash
# Open in browser
open http://localhost:3000/docs

# Or access via curl
curl http://localhost:3000/docs
```

---

## 🔐 HTTPS/SSL Setup (Production)

### Option 1: Nginx Reverse Proxy (Recommended)

The `docker-compose.prod.yml` includes an Nginx service for SSL termination.

**1. Create Nginx configuration:**

```bash
# Create Nginx config directory (if not exists)
mkdir -p nginx

# Create main Nginx configuration
cat > nginx/nginx.conf << 'EOF'
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # Include site configurations
    include /etc/nginx/conf.d/*.conf;
}
EOF

# Create site configuration
cat > nginx/conf.d/proofpass.conf << 'EOF'
# HTTP - Redirect to HTTPS
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Let's Encrypt challenge
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # Redirect all other traffic to HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS
server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Certificates
    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy to ProofPass API
    location / {
        proxy_pass http://api:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check (no auth)
    location /health {
        proxy_pass http://api:3000/health;
        access_log off;
    }

    # Swagger documentation
    location /docs {
        proxy_pass http://api:3000/docs;
    }
}
EOF
```

**2. Install SSL certificate:**

Using Let's Encrypt (Free):
```bash
# Install certbot
sudo apt install certbot

# Get certificate
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Copy certificates to nginx/ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/
sudo chmod 644 nginx/ssl/*.pem
```

Using existing certificate:
```bash
# Create SSL directory
mkdir -p nginx/ssl

# Copy your certificate files
cp /path/to/fullchain.pem nginx/ssl/
cp /path/to/privkey.pem nginx/ssl/
chmod 644 nginx/ssl/*.pem
```

**3. Restart Nginx:**
```bash
docker compose -f docker-compose.prod.yml restart nginx

# Verify HTTPS works
curl https://yourdomain.com/health
```

### Option 2: Cloudflare Proxy (Easiest)

1. Add your domain to Cloudflare
2. Point DNS to your server IP
3. Enable "Full (strict)" SSL/TLS mode
4. Cloudflare handles SSL automatically

---

## 🔧 Common Operations

### View Logs

```bash
# View all logs
docker compose -f docker-compose.prod.yml logs -f

# View specific service logs
docker compose -f docker-compose.prod.yml logs -f api
docker compose -f docker-compose.prod.yml logs -f postgres
docker compose -f docker-compose.prod.yml logs -f redis

# View last 100 lines
docker compose -f docker-compose.prod.yml logs --tail=100 api
```

### Restart Services

```bash
# Restart all services
docker compose -f docker-compose.prod.yml restart

# Restart specific service
docker compose -f docker-compose.prod.yml restart api
docker compose -f docker-compose.prod.yml restart postgres
```

### Stop Services

```bash
# Stop all services (containers remain)
docker compose -f docker-compose.prod.yml stop

# Stop and remove containers
docker compose -f docker-compose.prod.yml down

# Stop and remove containers + volumes (WARNING: deletes data)
docker compose -f docker-compose.prod.yml down -v
```

### Update Platform

```bash
# Pull latest code
git pull origin main

# Rebuild images
docker compose -f docker-compose.prod.yml build --no-cache

# Recreate containers with new images
docker compose -f docker-compose.prod.yml up -d --force-recreate

# View logs to verify
docker compose -f docker-compose.prod.yml logs -f api
```

### Database Operations

**Backup database:**
```bash
# Create backup
docker compose -f docker-compose.prod.yml exec postgres pg_dump -U proofpass proofpass > backup_$(date +%Y%m%d_%H%M%S).sql

# Verify backup
ls -lh backup_*.sql
```

**Restore database:**
```bash
# Stop API to prevent connections
docker compose -f docker-compose.prod.yml stop api

# Restore backup
docker compose -f docker-compose.prod.yml exec -T postgres psql -U proofpass proofpass < backup_20251103_120000.sql

# Start API
docker compose -f docker-compose.prod.yml start api
```

**Access database shell:**
```bash
# Connect to PostgreSQL
docker compose -f docker-compose.prod.yml exec postgres psql -U proofpass proofpass

# Run queries
# proofpass=# SELECT * FROM users LIMIT 10;
# proofpass=# \dt  -- List tables
# proofpass=# \q   -- Exit
```

### Redis Operations

**Access Redis shell:**
```bash
# Connect to Redis (without password)
docker compose -f docker-compose.prod.yml exec redis redis-cli

# With password
docker compose -f docker-compose.prod.yml exec redis redis-cli -a YOUR_REDIS_PASSWORD

# Common commands:
# > PING  -- Test connection
# > KEYS *  -- List all keys
# > INFO  -- Server info
# > QUIT  -- Exit
```

**Clear Redis cache:**
```bash
# Flush all cache
docker compose -f docker-compose.prod.yml exec redis redis-cli -a YOUR_REDIS_PASSWORD FLUSHALL

# Or restart Redis (clears cache if no persistence)
docker compose -f docker-compose.prod.yml restart redis
```

---

## 📊 Monitoring & Health Checks

### Built-in Health Endpoints

```bash
# Basic health check
curl http://localhost:3000/health

# Readiness check (includes dependencies)
curl http://localhost:3000/ready

# Swagger API documentation
curl http://localhost:3000/docs
```

### Container Health Status

```bash
# Check health status of all containers
docker compose -f docker-compose.prod.yml ps

# Inspect specific container health
docker inspect proofpass-api --format='{{.State.Health.Status}}'

# View health check logs
docker inspect proofpass-api --format='{{range .State.Health.Log}}{{.Output}}{{end}}'
```

### Resource Usage

```bash
# View container resource usage
docker stats

# View specific container
docker stats proofpass-api

# One-time snapshot
docker stats --no-stream
```

---

## 🆘 Troubleshooting

### Service Won't Start

**Check logs:**
```bash
docker compose -f docker-compose.prod.yml logs -f api
```

**Common issues:**
- Missing environment variables → Check `.env.production`
- Port conflicts → Change `API_PORT` in `.env.production`
- Database connection failed → Verify `DATABASE_PASSWORD` matches in both services

### Database Connection Failed

**Verify database is running:**
```bash
docker compose -f docker-compose.prod.yml ps postgres
docker compose -f docker-compose.prod.yml logs postgres
```

**Test connection from API container:**
```bash
docker compose -f docker-compose.prod.yml exec api sh -c 'apk add postgresql-client && psql $DATABASE_URL -c "SELECT 1"'
```

### Redis Connection Failed

**Verify Redis is running:**
```bash
docker compose -f docker-compose.prod.yml ps redis
docker compose -f docker-compose.prod.yml logs redis
```

**Test connection:**
```bash
docker compose -f docker-compose.prod.yml exec api sh -c 'apk add redis && redis-cli -h redis -p 6379 -a "$REDIS_PASSWORD" PING'
```

### API Returns 502 Bad Gateway

**Check API container status:**
```bash
docker compose -f docker-compose.prod.yml ps api
docker compose -f docker-compose.prod.yml logs -f api
```

**Restart API:**
```bash
docker compose -f docker-compose.prod.yml restart api
```

### Out of Disk Space

**Check disk usage:**
```bash
df -h

# Check Docker disk usage
docker system df
```

**Clean up Docker resources:**
```bash
# Remove unused containers
docker container prune -f

# Remove unused images
docker image prune -a -f

# Remove unused volumes (WARNING: may delete data)
docker volume prune -f

# Remove everything unused
docker system prune -a -f
```

---

## 🔒 Security Best Practices

### 1. Secrets Management

- **NEVER** commit `.env.production` to git
- Use strong, random secrets (minimum 32 characters)
- Rotate secrets every 90 days
- Store secrets in a secure vault (e.g., AWS Secrets Manager, HashiCorp Vault)

### 2. Firewall Configuration

```bash
# Allow SSH (if needed)
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Block direct API access (use Nginx proxy instead)
sudo ufw deny 3000/tcp

# Block database and Redis
sudo ufw deny 5432/tcp
sudo ufw deny 6379/tcp

# Enable firewall
sudo ufw enable
```

### 3. Regular Updates

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Docker images
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

### 4. Backup Strategy

- **Database:** Daily automated backups
- **Redis:** No backup needed (cache only)
- **Environment files:** Secure backup of `.env.production`
- **SSL certificates:** Backup before renewal

---

## 📚 Additional Resources

- **Full Deployment Guide:** [DEPLOYMENT.md](./DEPLOYMENT.md)
- **DevOps Guide:** [DEVOPS_GUIDE.md](./DEVOPS_GUIDE.md)
- **CI/CD Setup:** [CI_CD_GUIDE.md](./CI_CD_GUIDE.md)
- **Troubleshooting:** [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- **Security:** [../security/SECURITY_STATUS.md](../security/SECURITY_STATUS.md)

---

## 🤝 Support

- **Documentation:** [docs/](../)
- **Issues:** https://github.com/PROOFPASS/ProofPassPlatform/issues
- **Email:** fboiero@frvm.utn.edu.ar

---

**Last Updated:** 2025-11-03
**Platform Version:** 2.0.0
**Tested On:** Ubuntu 22.04 LTS, Docker 24.0.7, Docker Compose 2.21.0

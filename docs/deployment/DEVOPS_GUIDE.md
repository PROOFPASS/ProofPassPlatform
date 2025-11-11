# DevOps Deployment Guide - ProofPass Platform

## 🎯 Overview

This guide provides complete step-by-step instructions for deploying ProofPass Platform in production. Designed for DevOps engineers who need to get the platform running quickly and reliably.

**Deployment Time:** 15-30 minutes
**Difficulty:** Intermediate
**Prerequisites:** Docker, basic Linux knowledge

---

## 📋 Pre-Deployment Checklist

Before starting deployment, ensure you have:

- [ ] Docker Engine 20.10+ installed
- [ ] Docker Compose 2.0+ installed
- [ ] Minimum 2GB RAM available
- [ ] Minimum 10GB disk space
- [ ] Ports 3000, 5432, 6379 available
- [ ] Domain name (for production with HTTPS)
- [ ] SSL certificate (for production)

---

## 🚀 Quick Start (Development/Testing)

### Step 1: Clone Repository

```bash
git clone https://github.com/PROOFPASS/ProofPassPlatform.git
cd ProofPassPlatform
```

### Step 2: Configure Environment

```bash
# Copy environment file
cp .env.docker .env.docker.local

# Edit with your values (optional for dev)
nano .env.docker.local
```

**Minimum required changes:**
```env
# Change these for ANY deployment (even testing)
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long
API_KEY_SALT=your-super-secret-salt-min-32-characters-long
```

### Step 3: Start Services

```bash
# Build and start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### Step 4: Verify Deployment

```bash
# Health check
curl http://localhost:3000/health

# Readiness check (includes DB and Redis)
curl http://localhost:3000/ready

# Swagger API docs
open http://localhost:3000/docs
```

**Expected output:**
```json
{
  "status": "ok",
  "timestamp": "2024-10-28T10:00:00Z",
  "version": "0.1.0"
}
```

### Step 5: Test API

```bash
# Register a test user
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123456!",
    "name": "Test User"
  }'
```

✅ **Success!** Your ProofPass instance is running at `http://localhost:3000`

---

## 🏭 Production Deployment

### Architecture Overview

```
┌─────────────────────────────────────────────┐
│  Load Balancer / Nginx (HTTPS)             │
│  SSL Termination                            │
└────────────────┬────────────────────────────┘
                 │
┌────────────────┴────────────────────────────┐
│  ProofPass API (Port 3000)                  │
│  - Fastify + TypeScript                     │
│  - Auto-migrations on startup               │
│  - Health checks enabled                    │
└────────┬───────────────────┬─────────────────┘
         │                   │
    ┌────┴─────┐       ┌────┴─────┐
    │PostgreSQL│       │  Redis   │
    │  Port    │       │  Port    │
    │  5432    │       │  6379    │
    └──────────┘       └──────────┘
```

### Prerequisites for Production

1. **Server Requirements:**
   - **Minimum:** 2 vCPU, 4GB RAM, 20GB SSD
   - **Recommended:** 4 vCPU, 8GB RAM, 50GB SSD
   - OS: Ubuntu 22.04 LTS (recommended) or any Linux with Docker

2. **Domain & DNS:**
   - Point your domain to server IP
   - Wait for DNS propagation (up to 48h)

3. **SSL Certificate:**
   - Option A: Let's Encrypt (free, auto-renewal)
   - Option B: Commercial certificate
   - Option C: Cloudflare proxy (free)

### Production Deployment Steps

#### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose-plugin -y

# Verify installation
docker --version
docker compose version

# Add user to docker group (optional)
sudo usermod -aG docker $USER
newgrp docker
```

#### 2. Clone and Configure

```bash
# Clone repository
cd /opt
sudo git clone https://github.com/PROOFPASS/ProofPassPlatform.git
cd ProofPassPlatform

# Set ownership
sudo chown -R $USER:$USER /opt/ProofPassPlatform
```

#### 3. Environment Configuration

```bash
# Create production environment file
cp .env.production.example .env.production

# Edit with secure values
nano .env.production
```

**Required production configuration:**

```env
# CRITICAL: Change all secrets!
JWT_SECRET=$(openssl rand -base64 48)
API_KEY_SALT=$(openssl rand -base64 48)

# Database
DATABASE_PASSWORD=$(openssl rand -base64 32)

# Stellar (Testnet for testing, Mainnet for production)
STELLAR_NETWORK=testnet  # or 'mainnet' for production
# Generate Stellar keys: npm run setup:stellar
STELLAR_SECRET_KEY=your-stellar-secret-key
STELLAR_PUBLIC_KEY=your-stellar-public-key

# Domain configuration
PUBLIC_URL=https://yourdomain.com
CORS_ORIGIN=https://yourdomain.com

# Production settings
NODE_ENV=production
LOG_LEVEL=warn
```

#### 4. Generate Stellar Keys (if needed)

```bash
# Option 1: Use setup script
npm install
npm run setup:stellar

# Option 2: Use Stellar Laboratory
# Visit: https://laboratory.stellar.org/#account-creator?network=test
```

#### 5. Deploy with Docker Compose

```bash
# Use production compose file
docker-compose -f docker-compose.prod.yml up -d

# Check logs
docker-compose -f docker-compose.prod.yml logs -f api

# Verify all services are healthy
docker-compose -f docker-compose.prod.yml ps
```

**Expected output:**
```
NAME                IMAGE                   STATUS
proofpass-api       proofpass-api:latest    Up (healthy)
proofpass-db        postgres:14-alpine      Up (healthy)
proofpass-redis     redis:7-alpine          Up (healthy)
```

#### 6. Setup Nginx Reverse Proxy (Recommended)

```bash
# Install Nginx
sudo apt install nginx -y

# Create Nginx config
sudo nano /etc/nginx/sites-available/proofpass
```

**Nginx configuration:**

```nginx
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

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy to ProofPass API
    location / {
        proxy_pass http://localhost:3000;
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

    # Health check endpoint (no auth required)
    location /health {
        proxy_pass http://localhost:3000/health;
        access_log off;
    }

    # Swagger UI
    location /docs {
        proxy_pass http://localhost:3000/docs;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/proofpass /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

#### 7. Setup Let's Encrypt SSL (Recommended)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

#### 8. Setup Systemd Service (Optional - for auto-restart)

```bash
sudo nano /etc/systemd/system/proofpass.service
```

```ini
[Unit]
Description=ProofPass Platform
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/ProofPassPlatform
ExecStart=/usr/bin/docker-compose -f docker-compose.prod.yml up -d
ExecStop=/usr/bin/docker-compose -f docker-compose.prod.yml down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start service
sudo systemctl enable proofpass
sudo systemctl start proofpass

# Check status
sudo systemctl status proofpass
```

---

## 🔧 Configuration Reference

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | Yes | `production` | Environment mode |
| `PORT` | Yes | `3000` | API port |
| `DATABASE_URL` | Yes | - | PostgreSQL connection string |
| `REDIS_URL` | Yes | - | Redis connection URL |
| `JWT_SECRET` | Yes | - | JWT signing secret (min 32 chars) |
| `API_KEY_SALT` | Yes | - | API key salt (min 32 chars) |
| `STELLAR_NETWORK` | Yes | `testnet` | `testnet` or `mainnet` |
| `STELLAR_SECRET_KEY` | Yes | - | Stellar account secret |
| `STELLAR_PUBLIC_KEY` | Yes | - | Stellar account public key |
| `PUBLIC_URL` | Yes | - | Public URL of your instance |
| `CORS_ORIGIN` | Yes | `*` | Allowed CORS origins |
| `LOG_LEVEL` | No | `info` | `error`, `warn`, `info`, `debug` |

### Docker Compose Profiles

**Development (`docker-compose.yml`):**
- No SSL
- Debug logging
- Hot reload
- Development secrets
- Exposed ports

**Production (`docker-compose.prod.yml`):**
- SSL required (via Nginx)
- Minimal logging
- Optimized build
- Secrets from environment
- Internal networking

---

## 📊 Post-Deployment Verification

### 1. Health Checks

```bash
# Basic health
curl https://yourdomain.com/health

# Readiness (DB + Redis)
curl https://yourdomain.com/ready
```

### 2. API Testing

```bash
# Register user
curl -X POST https://yourdomain.com/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@yourdomain.com",
    "password": "SuperSecure123!",
    "name": "Admin User"
  }'

# Login
curl -X POST https://yourdomain.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@yourdomain.com",
    "password": "SuperSecure123!"
  }'
```

### 3. Database Verification

```bash
# Check migrations
docker-compose exec postgres psql -U postgres -d proofpass -c "SELECT * FROM schema_migrations;"

# Check tables
docker-compose exec postgres psql -U postgres -d proofpass -c "\dt"
```

### 4. Swagger UI

Visit: `https://yourdomain.com/docs`

---

## 🔄 Updates and Maintenance

### Updating ProofPass

```bash
# Navigate to installation directory
cd /opt/ProofPassPlatform

# Pull latest code
git pull

# Rebuild containers
docker-compose -f docker-compose.prod.yml build --no-cache

# Restart services
docker-compose -f docker-compose.prod.yml up -d

# Check logs
docker-compose -f docker-compose.prod.yml logs -f api
```

### Database Backup

```bash
# Create backup
docker-compose exec postgres pg_dump -U postgres proofpass > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
docker-compose exec -T postgres psql -U postgres proofpass < backup_20241028_120000.sql
```

### Log Management

```bash
# View logs
docker-compose logs -f api

# Clear logs
docker-compose logs --tail=0 -f api

# Rotate logs (configure logrotate)
sudo nano /etc/logrotate.d/proofpass
```

---

## 🔐 Security Best Practices

### 1. Secrets Management

- **NEVER** commit `.env.production` to git
- Use strong, random secrets (min 32 characters)
- Rotate secrets every 90 days
- Use environment variable injection in CI/CD

### 2. Firewall Configuration

```bash
# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Block direct API access (use Nginx proxy)
sudo ufw deny 3000/tcp

# Block database (only Docker network)
sudo ufw deny 5432/tcp

# Enable firewall
sudo ufw enable
```

### 3. Regular Updates

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Docker images
docker-compose pull
docker-compose up -d
```

### 4. Monitoring

- Enable logs collection
- Setup alerts for errors
- Monitor disk space
- Monitor API response times
- Track rate limit hits

---

## 📈 Scaling Considerations

### Horizontal Scaling

1. **Load Balancer:** Add multiple API instances behind LB
2. **Database:** Use PostgreSQL replication (primary + replicas)
3. **Redis:** Use Redis Cluster for high availability
4. **Sessions:** Store in Redis (already configured)

### Vertical Scaling

- Increase container CPU/memory limits
- Use dedicated database server
- Add Redis cluster nodes
- Optimize database queries

### Performance Tuning

```yaml
# docker-compose.prod.yml
services:
  api:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

---

## 🆘 Support

- **Documentation:** [docs/README.md](../README.md)
- **Issues:** https://github.com/PROOFPASS/ProofPassPlatform/issues
- **Email:** fboiero@frvm.utn.edu.ar

---

**Last Updated:** October 28, 2024
**Version:** 1.0.0
**Tested On:** Ubuntu 22.04 LTS, Docker 24.0.7, Docker Compose 2.21.0

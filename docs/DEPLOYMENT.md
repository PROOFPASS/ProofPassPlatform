# ProofPass Platform - Deployment Guide

Complete guide for deploying ProofPass Platform to production.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [SSL Certificates](#ssl-certificates)
4. [Local Docker Testing](#local-docker-testing)
5. [Production Deployment](#production-deployment)
6. [CI/CD Pipeline](#cicd-pipeline)
7. [Monitoring & Maintenance](#monitoring--maintenance)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software

- **Docker** 24.0+ and **Docker Compose** 2.20+
- **Git** 2.40+
- **Node.js** 18+ (for local development)
- **SSL Certificates** for your domains

### Required Domains

- `api.proofpass.co` - API Backend
- `platform.proofpass.co` - Platform Dashboard

### Server Requirements

**Minimum:**
- 2 CPU cores
- 4 GB RAM
- 20 GB storage
- Ubuntu 22.04 LTS or similar

**Recommended:**
- 4 CPU cores
- 8 GB RAM
- 50 GB storage (SSD)
- Ubuntu 22.04 LTS

## Environment Setup

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/ProofPassPlatform.git
cd ProofPassPlatform
```

### 2. Create Production Environment File

```bash
cp .env.production.example .env.production
```

### 3. Configure Environment Variables

Edit `.env.production` with your production values:

```bash
# Database
POSTGRES_USER=proofpass
POSTGRES_PASSWORD=<CHANGE_ME_STRONG_PASSWORD>
POSTGRES_DB=proofpass

# Redis
REDIS_PASSWORD=<CHANGE_ME_STRONG_PASSWORD>

# API Backend
JWT_SECRET=<CHANGE_ME_USE_openssl_rand_-base64_32>
ADMIN_EMAIL=admin@proofpass.co
ADMIN_PASSWORD=<CHANGE_ME_STRONG_PASSWORD>
CORS_ORIGIN=https://platform.proofpass.co

# Stellar Network
STELLAR_NETWORK=testnet
STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org

# Platform Dashboard
NEXTAUTH_URL=https://platform.proofpass.co
NEXTAUTH_SECRET=<CHANGE_ME_USE_openssl_rand_-base64_32>
NEXT_PUBLIC_API_URL=https://api.proofpass.co
```

### Generating Secrets

Use the following commands to generate secure secrets:

```bash
# JWT Secret
openssl rand -base64 32

# NextAuth Secret
openssl rand -base64 32

# Database Password (32 characters alphanumeric)
openssl rand -base64 24 | tr -d "=+/" | cut -c1-32
```

## SSL Certificates

### Option 1: Let's Encrypt (Recommended)

#### Install Certbot

```bash
sudo apt update
sudo apt install certbot
```

#### Generate Certificates

```bash
# For API domain
sudo certbot certonly --standalone -d api.proofpass.co

# For Platform domain
sudo certbot certonly --standalone -d platform.proofpass.co
```

#### Copy Certificates to Project

```bash
# Create SSL directory
mkdir -p nginx/ssl

# Copy API certificates
sudo cp /etc/letsencrypt/live/api.proofpass.co/fullchain.pem nginx/ssl/api.proofpass.co.crt
sudo cp /etc/letsencrypt/live/api.proofpass.co/privkey.pem nginx/ssl/api.proofpass.co.key

# Copy Platform certificates
sudo cp /etc/letsencrypt/live/platform.proofpass.co/fullchain.pem nginx/ssl/platform.proofpass.co.crt
sudo cp /etc/letsencrypt/live/platform.proofpass.co/privkey.pem nginx/ssl/platform.proofpass.co.key

# Set permissions
sudo chmod 644 nginx/ssl/*.crt
sudo chmod 600 nginx/ssl/*.key
```

#### Auto-Renewal Setup

```bash
# Test renewal
sudo certbot renew --dry-run

# Set up cron job for auto-renewal
echo "0 0,12 * * * root certbot renew --quiet && docker-compose -f /path/to/docker-compose.production.yml restart nginx" | sudo tee -a /etc/crontab
```

### Option 2: Self-Signed Certificates (Development Only)

```bash
# Create SSL directory
mkdir -p nginx/ssl

# Generate self-signed certificates for API
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/api.proofpass.co.key \
  -out nginx/ssl/api.proofpass.co.crt \
  -subj "/CN=api.proofpass.co"

# Generate self-signed certificates for Platform
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/platform.proofpass.co.key \
  -out nginx/ssl/platform.proofpass.co.crt \
  -subj "/CN=platform.proofpass.co"
```

## Local Docker Testing

Before deploying to production, test locally:

### 1. Build Docker Images

```bash
# Build API image
docker build -t proofpass-api:test ./apps/api

# Build Platform image
docker build -t proofpass-platform:test ./apps/platform
```

### 2. Test with Docker Compose

```bash
# Start all services
docker-compose -f docker-compose.production.yml --env-file .env.production up -d

# Watch logs
docker-compose -f docker-compose.production.yml logs -f

# Check service health
docker-compose -f docker-compose.production.yml ps
```

### 3. Verify Services

```bash
# Check API health
curl -k https://localhost/health

# Check Platform
curl -k https://localhost:3001

# Test database connection
docker-compose -f docker-compose.production.yml exec postgres psql -U proofpass -d proofpass -c "SELECT version();"
```

### 4. Stop Services

```bash
docker-compose -f docker-compose.production.yml down
```

## Production Deployment

### Manual Deployment

#### 1. Prepare Server

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

#### 2. Configure Firewall

```bash
# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable
```

#### 3. Deploy Application

```bash
# Navigate to project
cd /opt/ProofPassPlatform

# Pull latest changes
git pull origin main

# Load environment variables
source .env.production

# Start services
docker-compose -f docker-compose.production.yml up -d

# Watch logs
docker-compose -f docker-compose.production.yml logs -f
```

#### 4. Verify Deployment

```bash
# Check all services are running
docker-compose -f docker-compose.production.yml ps

# Check API
curl https://api.proofpass.co/health

# Check Platform
curl https://platform.proofpass.co
```

### Deployment Script

Create `deploy.sh` for easier deployments:

```bash
#!/bin/bash

set -e

echo "Starting deployment..."

# Pull latest changes
git pull origin main

# Rebuild images
docker-compose -f docker-compose.production.yml build --no-cache

# Stop old containers
docker-compose -f docker-compose.production.yml down

# Start new containers
docker-compose -f docker-compose.production.yml up -d

# Wait for services to be healthy
echo "Waiting for services to be healthy..."
sleep 10

# Check health
if curl -f https://api.proofpass.co/health > /dev/null 2>&1; then
  echo "[OK] API is healthy"
else
  echo "[ERROR] API health check failed"
  exit 1
fi

if curl -f https://platform.proofpass.co > /dev/null 2>&1; then
  echo "[OK] Platform is healthy"
else
  echo "[ERROR] Platform health check failed"
  exit 1
fi

echo "[SUCCESS] Deployment successful!"
```

Make it executable:

```bash
chmod +x deploy.sh
```

## CI/CD Pipeline

The project includes GitHub Actions CI/CD workflow at `.github/workflows/ci.yml`.

### Pipeline Stages

1. **Test API Backend** - Runs API tests with PostgreSQL and Redis
2. **Test Platform Dashboard** - Runs Platform tests and builds Next.js
3. **Security Scan** - Runs npm audit and Trivy vulnerability scanner
4. **Build Docker Images** - Builds and pushes Docker images to GitHub Container Registry
5. **Deploy** - Placeholder for deployment steps

### GitHub Container Registry

Images are automatically built and pushed to:
- `ghcr.io/<username>/proofpassplatform/api:latest`
- `ghcr.io/<username>/proofpassplatform/platform:latest`

### Pulling from Registry

```bash
# Login to GitHub Container Registry
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# Pull images
docker pull ghcr.io/<username>/proofpassplatform/api:latest
docker pull ghcr.io/<username>/proofpassplatform/platform:latest
```

### Setting Up GitHub Secrets

Add these secrets to your repository (Settings → Secrets and variables → Actions):

- `SNYK_TOKEN` - Snyk security token (optional)
- Add production environment variables if deploying via GitHub Actions

## Monitoring & Maintenance

### Viewing Logs

```bash
# All services
docker-compose -f docker-compose.production.yml logs -f

# Specific service
docker-compose -f docker-compose.production.yml logs -f api
docker-compose -f docker-compose.production.yml logs -f platform

# Last 100 lines
docker-compose -f docker-compose.production.yml logs --tail=100 api
```

### Database Backup

```bash
# Create backup
docker-compose -f docker-compose.production.yml exec postgres pg_dump -U proofpass proofpass > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
docker-compose -f docker-compose.production.yml exec -T postgres psql -U proofpass proofpass < backup.sql
```

### Database Maintenance

```bash
# Connect to database
docker-compose -f docker-compose.production.yml exec postgres psql -U proofpass -d proofpass

# Vacuum database
docker-compose -f docker-compose.production.yml exec postgres psql -U proofpass -d proofpass -c "VACUUM ANALYZE;"
```

### Updating Services

```bash
# Pull latest images
docker-compose -f docker-compose.production.yml pull

# Restart services
docker-compose -f docker-compose.production.yml up -d

# Remove old images
docker image prune -a -f
```

### Resource Monitoring

```bash
# Container stats
docker stats

# Disk usage
docker system df

# Clean up
docker system prune -a --volumes
```

## Troubleshooting

### Services Won't Start

**Check logs:**
```bash
docker-compose -f docker-compose.production.yml logs
```

**Common issues:**
- SSL certificates missing → Check `nginx/ssl/` directory
- Environment variables incorrect → Verify `.env.production`
- Port conflicts → Check ports 80 and 443 are available

### Database Connection Issues

**Check database is running:**
```bash
docker-compose -f docker-compose.production.yml ps postgres
```

**Test connection:**
```bash
docker-compose -f docker-compose.production.yml exec postgres psql -U proofpass -c "\conninfo"
```

**Check environment variables:**
```bash
docker-compose -f docker-compose.production.yml exec api env | grep DATABASE
```

### NGINX Configuration Issues

**Test NGINX configuration:**
```bash
docker-compose -f docker-compose.production.yml exec nginx nginx -t
```

**Reload NGINX:**
```bash
docker-compose -f docker-compose.production.yml exec nginx nginx -s reload
```

### SSL Certificate Issues

**Check certificate expiration:**
```bash
openssl x509 -in nginx/ssl/api.proofpass.co.crt -noout -enddate
openssl x509 -in nginx/ssl/platform.proofpass.co.crt -noout -enddate
```

**Renew Let's Encrypt certificates:**
```bash
sudo certbot renew
# Then copy certificates again (see SSL Certificates section)
```

### Out of Memory

**Check memory usage:**
```bash
docker stats --no-stream
```

**Increase container memory limits in `docker-compose.production.yml`:**
```yaml
services:
  api:
    deploy:
      resources:
        limits:
          memory: 1G
```

### Rollback Deployment

```bash
# Stop current deployment
docker-compose -f docker-compose.production.yml down

# Checkout previous version
git checkout <previous-commit-hash>

# Rebuild and restart
docker-compose -f docker-compose.production.yml up -d --build
```

## Health Checks

Built-in health check endpoints:

- API: `https://api.proofpass.co/health`
- Platform: `https://platform.proofpass.co` (returns 200 if healthy)

Set up external monitoring:
- UptimeRobot
- Pingdom
- DataDog
- New Relic

## Security Checklist

- [ ] SSL certificates configured and valid
- [ ] Strong passwords for all services
- [ ] Firewall configured (only ports 80, 443, 22 open)
- [ ] Database not exposed to public
- [ ] Environment variables properly secured
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Regular security updates applied
- [ ] Backup strategy in place
- [ ] Monitoring and alerting configured

## Support

For issues or questions:
- GitHub Issues: https://github.com/yourusername/ProofPassPlatform/issues
- Documentation: https://docs.proofpass.co
- Email: support@proofpass.co

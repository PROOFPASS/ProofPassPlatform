# Portable Deployment Guide - ProofPass Platform

This guide shows how to deploy ProofPass on **any server** with Docker, without vendor lock-in.

## 🎯 Deployment Options

1. **Self-hosted VPS** (DigitalOcean, Linode, Hetzner, Vultr, etc.)
2. **Cloud VM** (AWS EC2, Google Compute Engine, Azure VM)
3. **On-premise server**
4. **Local Docker** (for development/testing)

## 🚀 Quick Start (5 Minutes)

### Prerequisites

- Server with Ubuntu 20.04+ / Debian / CentOS
- 2GB RAM minimum (4GB recommended)
- Docker and Docker Compose installed
- Domain name (optional, for SSL)

### 1. Install Docker (if not installed)

```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

### 2. Clone Repository

```bash
git clone https://github.com/your-username/ProofPassPlatform.git
cd ProofPassPlatform
```

### 3. Configure Environment

```bash
# Copy production environment template
cp .env.production.example .env.production

# Generate secure secrets
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
API_KEY_SALT=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
POSTGRES_PASSWORD=$(openssl rand -base64 32)
REDIS_PASSWORD=$(openssl rand -base64 32)

# Update .env.production
nano .env.production
```

**Minimal configuration:**
```env
API_PORT=3000
PUBLIC_URL=http://your-server-ip:3000

POSTGRES_USER=proofpass
POSTGRES_PASSWORD=<generated-above>
POSTGRES_DB=proofpass

REDIS_PASSWORD=<generated-above>

JWT_SECRET=<generated-above>
API_KEY_SALT=<generated-above>

STELLAR_NETWORK=testnet
LOG_LEVEL=info
CORS_ORIGIN=*
```

### 4. Deploy

```bash
# Run deployment script
chmod +x scripts/deployment/deploy.sh
./scripts/deployment/deploy.sh
```

That's it! Your API is now running at `http://your-server-ip:3000`

## 📋 Detailed Deployment Options

### Option 1: DigitalOcean Droplet ($6/month)

1. **Create Droplet**
   - Choose Ubuntu 22.04 LTS
   - Basic plan: 2GB RAM / 1 vCPU ($12/month) or 1GB ($6/month)
   - Add SSH key
   - Choose region closest to you

2. **SSH into droplet**
   ```bash
   ssh root@your-droplet-ip
   ```

3. **Follow Quick Start steps above**

4. **Configure Firewall**
   ```bash
   ufw allow 22
   ufw allow 80
   ufw allow 443
   ufw allow 3000
   ufw enable
   ```

### Option 2: Linode ($5/month)

1. **Create Linode**
   - Choose Ubuntu 22.04 LTS
   - Nanode 1GB plan ($5/month)
   - Add SSH key

2. **SSH and deploy** (same as DigitalOcean)

### Option 3: Hetzner (€4.5/month - Best value)

1. **Create Cloud Server**
   - CX11: 2GB RAM / 1 vCPU (€4.5/month)
   - Ubuntu 22.04
   - Add SSH key

2. **Deploy** (same steps as above)

### Option 4: AWS EC2 (Free tier eligible)

1. **Launch EC2 Instance**
   - t2.micro (1GB RAM) - Free tier eligible
   - Ubuntu 22.04 AMI
   - Configure security group (ports 22, 80, 443, 3000)

2. **SSH and deploy**
   ```bash
   ssh -i your-key.pem ubuntu@ec2-instance-ip
   # Follow Quick Start
   ```

### Option 5: Google Cloud VM (Free $300 credit)

1. **Create VM Instance**
   - e2-micro (1GB RAM)
   - Ubuntu 22.04
   - Allow HTTP/HTTPS traffic

2. **Deploy** (same as above)

## 🔒 Setup SSL (HTTPS)

### With Domain Name

1. **Point DNS to your server**
   ```
   Type: A
   Name: api (or @)
   Value: your-server-ip
   TTL: 300
   ```

2. **Run SSL setup**
   ```bash
   ./scripts/deployment/ssl-setup.sh api.yourdomain.com your@email.com
   ```

3. **Update .env.production**
   ```env
   PUBLIC_URL=https://api.yourdomain.com
   ```

4. **Restart services**
   ```bash
   docker-compose -f docker-compose.prod.yml restart
   ```

Your API is now accessible at `https://api.yourdomain.com` 🎉

## 🛠️ Management Commands

### View Logs
```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f api
docker-compose -f docker-compose.prod.yml logs -f postgres
```

### Restart Services
```bash
# All services
docker-compose -f docker-compose.prod.yml restart

# Specific service
docker-compose -f docker-compose.prod.yml restart api
```

### Stop/Start Services
```bash
# Stop
docker-compose -f docker-compose.prod.yml stop

# Start
docker-compose -f docker-compose.prod.yml start

# Stop and remove containers
docker-compose -f docker-compose.prod.yml down
```

### Shell Access
```bash
# API container
docker-compose -f docker-compose.prod.yml exec api sh

# PostgreSQL
docker-compose -f docker-compose.prod.yml exec postgres psql -U proofpass
```

### Update/Redeploy
```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose -f docker-compose.prod.yml up -d --build
```

## 💾 Backup & Restore

### Automatic Backups

Setup daily backups with cron:
```bash
# Make backup script executable
chmod +x scripts/deployment/backup.sh

# Add to crontab (runs daily at 2 AM)
crontab -e
# Add this line:
0 2 * * * cd /path/to/ProofPassPlatform && ./scripts/deployment/backup.sh
```

### Manual Backup
```bash
./scripts/deployment/backup.sh
```

Backups are stored in `./backups/` directory.

### Restore from Backup
```bash
# List backups
ls -lh backups/

# Restore specific backup
gunzip -c backups/proofpass_db_20241027_120000.sql.gz | \
  docker exec -i proofpass-db psql -U proofpass proofpass
```

## 🔄 Monitoring

### Basic Health Check
```bash
# API health
curl http://localhost:3000/health

# Docker stats
docker stats
```

### Resource Usage
```bash
# Disk usage
df -h

# Container resource usage
docker-compose -f docker-compose.prod.yml ps
docker stats --no-stream
```

### Setup Monitoring (Optional)

**Option 1: Simple uptime monitoring**
- Use [UptimeRobot](https://uptimerobot.com/) (free)
- Monitor: `http://your-domain/health`

**Option 2: Self-hosted monitoring**
```bash
# Add to docker-compose.prod.yml
# Prometheus + Grafana setup
```

## 🔐 Security Checklist

- [ ] Strong passwords in `.env.production`
- [ ] Firewall configured (UFW or cloud provider firewall)
- [ ] SSH key authentication (disable password auth)
- [ ] SSL certificate installed
- [ ] Regular backups configured
- [ ] CORS_ORIGIN restricted in production
- [ ] Keep Docker images updated
- [ ] Monitor logs for suspicious activity

## 💰 Cost Comparison

| Provider | Plan | RAM | Storage | Price/month |
|----------|------|-----|---------|-------------|
| **Hetzner** | CX11 | 2GB | 20GB | €4.5 (~$5) |
| **Linode** | Nanode | 1GB | 25GB | $5 |
| **DigitalOcean** | Basic | 1GB | 25GB | $6 |
| **Vultr** | Regular | 1GB | 25GB | $6 |
| **AWS EC2** | t2.micro | 1GB | 8GB | Free/~$8 |
| **Oracle Cloud** | Free Tier | 1GB | 50GB | **FREE** |

**Recommended:** Hetzner CX11 (best value) or Oracle Cloud (free)

## 🚨 Troubleshooting

### Services won't start
```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs

# Check disk space
df -h

# Check Docker is running
sudo systemctl status docker
```

### Database connection errors
```bash
# Check database is running
docker-compose -f docker-compose.prod.yml ps postgres

# Check database logs
docker-compose -f docker-compose.prod.yml logs postgres

# Verify password in .env.production
```

### Out of memory
```bash
# Check memory usage
free -h

# Restart services
docker-compose -f docker-compose.prod.yml restart

# Upgrade server RAM if needed
```

### Port already in use
```bash
# Find what's using the port
sudo lsof -i :3000
sudo lsof -i :5432

# Kill the process or change API_PORT in .env.production
```

## 📊 Performance Optimization

### For production load:

1. **Upgrade server resources**
   - 4GB RAM minimum
   - 2 vCPUs recommended

2. **Enable connection pooling** (already configured)

3. **Add CDN** for static assets (future)

4. **Database optimization**
   ```sql
   -- Run in PostgreSQL
   VACUUM ANALYZE;
   REINDEX DATABASE proofpass;
   ```

5. **Redis optimization** (configured in docker-compose)

## 🎯 Next Steps

1. ✅ Deploy to your preferred provider
2. ✅ Setup SSL certificate
3. ✅ Configure backups
4. ✅ Test API endpoints
5. ⬜ Setup monitoring
6. ⬜ Configure custom domain
7. ⬜ Integrate with your frontend

## 📚 Resources

- [Docker Documentation](https://docs.docker.com/)
- [PostgreSQL Best Practices](https://www.postgresql.org/docs/14/index.html)
- [Let's Encrypt](https://letsencrypt.org/)
- [ProofPass API Documentation](http://your-domain/docs)

## 🆘 Support

- **GitHub Issues**: [Report bugs or ask questions](https://github.com/your-username/ProofPassPlatform/issues)
- **Documentation**: See README.md and SETUP.md
- **Logs**: Always check logs first with `docker-compose logs`

---

**No vendor lock-in. Deploy anywhere. Your data, your infrastructure.**

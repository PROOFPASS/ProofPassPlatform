# DevOps Deployment Checklist

## 📋 Pre-Deployment

### Server Requirements
- [ ] Ubuntu 22.04 LTS (or compatible Linux)
- [ ] 2+ vCPU, 4+ GB RAM, 20+ GB SSD
- [ ] Docker Engine 20.10+ installed
- [ ] Docker Compose 2.0+ installed
- [ ] Ports available: 80, 443, 3000, 5432, 6379
- [ ] Root or sudo access

### Domain & DNS
- [ ] Domain name registered
- [ ] DNS A record points to server IP
- [ ] DNS propagation complete (check: `nslookup yourdomain.com`)
- [ ] Firewall allows HTTP/HTTPS traffic

### Secrets Prepared
- [ ] JWT_SECRET generated (32+ chars)
- [ ] API_KEY_SALT generated (32+ chars)
- [ ] DATABASE_PASSWORD generated (32+ chars)
- [ ] Stellar account created (testnet or mainnet)
- [ ] SSL certificate obtained (Let's Encrypt or commercial)

**Generate secrets:**
```bash
openssl rand -base64 48
```

---

## 🚀 Deployment Steps

### 1. Server Setup
- [ ] System updated: `sudo apt update && sudo apt upgrade -y`
- [ ] Docker installed: `docker --version`
- [ ] Docker Compose installed: `docker compose version`
- [ ] User added to docker group: `sudo usermod -aG docker $USER`
- [ ] Firewall configured (UFW): `sudo ufw status`

### 2. Code Deployment
- [ ] Repository cloned: `git clone https://github.com/PROOFPASS/ProofPassPlatform.git`
- [ ] Working directory: `cd ProofPassPlatform`
- [ ] Latest version checked out: `git pull`
- [ ] Environment file created: `.env.production`
- [ ] All secrets configured in `.env.production`

### 3. Configuration
- [ ] `JWT_SECRET` set (32+ characters)
- [ ] `API_KEY_SALT` set (32+ characters)
- [ ] `DATABASE_PASSWORD` set
- [ ] `STELLAR_SECRET_KEY` set
- [ ] `STELLAR_PUBLIC_KEY` set
- [ ] `PUBLIC_URL` set (`https://yourdomain.com`)
- [ ] `CORS_ORIGIN` set (domain or `*` for development)
- [ ] `NODE_ENV` set to `production`
- [ ] `LOG_LEVEL` set to `warn` or `info`

### 4. Docker Deployment
- [ ] Build images: `docker-compose -f docker-compose.prod.yml build`
- [ ] Start services: `docker-compose -f docker-compose.prod.yml up -d`
- [ ] Check status: `docker-compose -f docker-compose.prod.yml ps`
- [ ] All services healthy (wait 60 seconds for health checks)
- [ ] Logs checked: `docker-compose -f docker-compose.prod.yml logs`
- [ ] No error messages in logs

### 5. Database Setup
- [ ] PostgreSQL container running
- [ ] Database created automatically
- [ ] Migrations run automatically (check logs)
- [ ] Tables created: `docker-compose exec postgres psql -U postgres -d proofpass -c "\dt"`
- [ ] Migrations recorded: `SELECT * FROM schema_migrations;`

### 6. Reverse Proxy (Nginx)
- [ ] Nginx installed: `sudo apt install nginx -y`
- [ ] Configuration file created: `/etc/nginx/sites-available/proofpass`
- [ ] Proxy configuration correct (see DEVOPS_GUIDE.md)
- [ ] Site enabled: `sudo ln -s /etc/nginx/sites-available/proofpass /etc/nginx/sites-enabled/`
- [ ] Configuration tested: `sudo nginx -t`
- [ ] Nginx reloaded: `sudo systemctl reload nginx`

### 7. SSL Certificate
- [ ] Certbot installed: `sudo apt install certbot python3-certbot-nginx -y`
- [ ] Certificate obtained: `sudo certbot --nginx -d yourdomain.com`
- [ ] HTTPS working: `curl https://yourdomain.com/health`
- [ ] Auto-renewal configured: `sudo certbot renew --dry-run`
- [ ] Certificate expiry: `sudo certbot certificates`

### 8. Firewall Configuration
- [ ] UFW enabled: `sudo ufw enable`
- [ ] SSH allowed: `sudo ufw allow 22/tcp`
- [ ] HTTP allowed: `sudo ufw allow 80/tcp`
- [ ] HTTPS allowed: `sudo ufw allow 443/tcp`
- [ ] Direct API access blocked: `sudo ufw deny 3000/tcp`
- [ ] Database access blocked: `sudo ufw deny 5432/tcp`
- [ ] Redis access blocked: `sudo ufw deny 6379/tcp`
- [ ] Firewall status checked: `sudo ufw status`

---

## ✅ Verification

### Health Checks
- [ ] Health endpoint: `curl https://yourdomain.com/health`
  - Expected: `{"status":"ok","timestamp":"...","version":"0.1.0"}`
- [ ] Readiness endpoint: `curl https://yourdomain.com/ready`
  - Expected: `{"status":"ready","database":"connected","redis":"connected","timestamp":"..."}`
- [ ] Swagger UI: `https://yourdomain.com/docs`
  - Expected: Interactive API documentation loads

### API Testing
- [ ] Register user: `POST /api/v1/auth/register`
  - Status: 201 Created
  - Response includes: `user` object and `token`
- [ ] Login: `POST /api/v1/auth/login`
  - Status: 200 OK
  - Response includes: `user` object and `token`
- [ ] Get user: `GET /api/v1/auth/me` (with Bearer token)
  - Status: 200 OK
  - Response includes user data
- [ ] Create attestation: `POST /api/v1/attestations` (with Bearer token)
  - Status: 201 Created
  - Response includes: attestation with blockchain hash

### Security Verification
- [ ] HTTPS enforced (HTTP redirects to HTTPS)
- [ ] Security headers present:
  ```bash
  curl -I https://yourdomain.com | grep -E "(Strict-Transport-Security|X-Frame-Options|X-Content-Type-Options)"
  ```
- [ ] Rate limiting active (test with multiple requests)
- [ ] CORS configured correctly
- [ ] Direct port access blocked (3000, 5432, 6379)

### Database Verification
- [ ] Connect to database: `docker-compose exec postgres psql -U postgres -d proofpass`
- [ ] Tables exist: `\dt`
- [ ] Migrations applied: `SELECT * FROM schema_migrations;`
- [ ] Sample data query works: `SELECT COUNT(*) FROM users;`

### Logs Verification
- [ ] API logs clean: `docker-compose logs api | grep -i error`
- [ ] PostgreSQL logs clean: `docker-compose logs postgres | grep -i error`
- [ ] Redis logs clean: `docker-compose logs redis | grep -i error`
- [ ] Nginx logs clean: `sudo tail /var/log/nginx/error.log`

### Performance Check
- [ ] API response time < 500ms (use `/health` endpoint)
- [ ] Memory usage reasonable: `docker stats`
  - API: < 1GB
  - PostgreSQL: < 512MB
  - Redis: < 256MB
- [ ] Disk usage < 50%: `df -h`
- [ ] CPU usage < 50%: `top` or `htop`

---

## 🔄 Post-Deployment

### Documentation
- [ ] `.env.production` backed up securely (NOT in git)
- [ ] Passwords stored in password manager
- [ ] Deployment date documented
- [ ] Contact information updated
- [ ] Runbook created for team

### Monitoring Setup
- [ ] Health check monitoring configured
- [ ] Uptime monitoring enabled (e.g., UptimeRobot)
- [ ] Log aggregation configured (optional)
- [ ] Alert thresholds set
- [ ] On-call schedule defined

### Backup Configuration
- [ ] Database backup script: `scripts/backup.sh`
- [ ] Backup schedule: Daily at 2 AM
- [ ] Backup retention: 7 days
- [ ] Backup tested (restore to test environment)
- [ ] Backup storage location documented

### Systemd Service (Optional)
- [ ] Service file created: `/etc/systemd/system/proofpass.service`
- [ ] Service enabled: `sudo systemctl enable proofpass`
- [ ] Service tested: `sudo systemctl restart proofpass`
- [ ] Auto-restart on boot: `sudo systemctl is-enabled proofpass`

### Access Control
- [ ] SSH key-based authentication configured
- [ ] Root login disabled
- [ ] Sudo users documented
- [ ] API admin account created
- [ ] Passwords rotated from defaults

---

## 📊 Weekly Maintenance

- [ ] Monday: Review error logs
- [ ] Tuesday: Check disk usage
- [ ] Wednesday: Update system packages
- [ ] Thursday: Review API performance metrics
- [ ] Friday: Verify backups are running
- [ ] Weekly: Test backup restoration
- [ ] Monthly: Rotate secrets (if policy requires)
- [ ] Quarterly: Review and update firewall rules

---

## 🚨 Troubleshooting

If something goes wrong, see [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for:
- Common issues and solutions
- Debug commands
- Emergency procedures
- Log analysis

**Quick debug commands:**
```bash
# Check all services
docker-compose ps

# View logs
docker-compose logs --tail=100

# Test health
curl https://yourdomain.com/health

# Test readiness
curl https://yourdomain.com/ready
```

---

## 📞 Support Contacts

- **Technical Issues:** https://github.com/PROOFPASS/ProofPassPlatform/issues
- **Security Issues:** fboiero@frvm.utn.edu.ar
- **Documentation:** [docs/README.md](../README.md)

---

## 🎉 Success Criteria

Your deployment is successful when:

✅ All services running: `docker-compose ps` shows all healthy
✅ API accessible via HTTPS
✅ Swagger UI loads at `/docs`
✅ Users can register and login
✅ Attestations can be created
✅ Database backups running
✅ Monitoring active
✅ Team has access
✅ Documentation updated

**Congratulations! ProofPass is now live! 🚀**

---

**Estimated Time:**
- Fresh server: 30-45 minutes
- Existing server: 15-30 minutes

**Last Updated:** October 28, 2024
**Version:** 1.0.0

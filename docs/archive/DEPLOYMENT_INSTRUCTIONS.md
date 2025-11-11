# 🚀 Quick Deployment Instructions

## Prerequisites

- Docker Desktop installed and running
- Git repository cloned
- 5 minutes of your time

## Step-by-Step Deployment

### 1. Start Docker

Make sure Docker Desktop is running on your machine.

### 2. Configure Environment

```bash
cd ProofPassPlatform
cp .env.production.example .env.production
```

Edit `.env.production` and set:

```bash
# Generate secure secrets (run these commands):
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"  # For JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"  # For API_KEY_SALT
openssl rand -base64 32  # For POSTGRES_PASSWORD
openssl rand -base64 32  # For REDIS_PASSWORD
```

### 3. Deploy!

```bash
chmod +x scripts/deployment/deploy.sh
./scripts/deployment/deploy.sh
```

That's it! Your API is now running.

## Verify Deployment

```bash
# Check health
curl http://localhost:3000/health

# View API docs
open http://localhost:3000/docs
```

## Test the API

### Register a User

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "securePassword123!",
    "name": "Test User"
  }'
```

Save the `token` from the response.

### Create an Attestation

```bash
TOKEN="your-token-here"

curl -X POST http://localhost:3000/api/v1/attestations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "subject": "PRODUCT-001",
    "type": "QualityTest",
    "claims": {
      "test_name": "Pressure Test",
      "result": "pass",
      "score": 95
    }
  }'
```

## Management Commands

```bash
# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop services
docker-compose -f docker-compose.prod.yml down

# Restart services
docker-compose -f docker-compose.prod.yml restart

# Backup database
./scripts/deployment/backup.sh
```

## Troubleshooting

### Docker not starting?

```bash
# Check Docker is running
docker ps

# If not, start Docker Desktop
```

### Port already in use?

Edit `.env.production` and change `API_PORT`:

```bash
API_PORT=3001  # Use different port
```

### Need help?

- Check logs: `docker-compose -f docker-compose.prod.yml logs`
- Read full guide: `DEPLOY_PORTABLE.md`
- Review documentation: `README.md`

## Next Steps

1. ✅ API is running
2. Configure your domain (optional)
3. Setup SSL: `./scripts/deployment/ssl-setup.sh yourdomain.com`
4. Configure backups: Add to crontab
5. Monitor logs and metrics

---

**Deployment Time**: ~5 minutes
**Cost**: $0 (local) or $5-12/month (VPS)
**Difficulty**: Easy 🟢

Enjoy your ProofPass Platform! 🎉

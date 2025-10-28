# Deployment Guide - ProofPass Platform

This guide covers deploying ProofPass Platform to production using AWS RDS, Upstash Redis, and Railway/Render.

## Architecture Overview

```
┌─────────────────┐
│   Railway/      │
│   Render App    │ ← API Application
└────────┬────────┘
         │
    ┌────┴─────────────────┐
    │                      │
┌───▼─────┐          ┌────▼──────┐
│ AWS RDS │          │  Upstash  │
│ (PostgreSQL)       │  (Redis)  │
└─────────┘          └───────────┘
```

## Prerequisites

- AWS Account (for RDS)
- GitHub Account (for Railway/Render)
- Upstash Account (free tier) or AWS ElastiCache

## Step 1: Setup AWS RDS PostgreSQL

### 1.1 Create RDS Instance

1. Go to AWS Console → RDS → Create Database
2. Choose **PostgreSQL 14**
3. Template: **Free tier** (for testing) or **Production**
4. Settings:
   - **DB instance identifier:** `proofpass-db`
   - **Master username:** `proofpass_admin`
   - **Master password:** (generate and save securely)
5. Instance configuration:
   - **Instance class:** db.t3.micro (free tier) or db.t3.small
6. Storage:
   - **Storage type:** gp3
   - **Allocated storage:** 20 GB
   - Enable storage autoscaling
7. Connectivity:
   - **Public access:** Yes (for Railway/Render access)
   - **VPC security group:** Create new
   - **Database port:** 5432
8. Additional configuration:
   - **Initial database name:** `proofpass`
   - **Backup retention:** 7 days
   - **Enable encryption:** Yes

**IMPORTANT:** Save the endpoint URL, it will look like:
```
proofpass-db.xxxxxxxxxx.us-east-1.rds.amazonaws.com
```

### 1.2 Configure Security Group

1. Go to EC2 → Security Groups
2. Find the RDS security group (e.g., `rds-launch-wizard-X`)
3. Edit inbound rules:
   - **Type:** PostgreSQL
   - **Port:** 5432
   - **Source:** Anywhere (0.0.0.0/0) for testing
   - **Description:** ProofPass API access

⚠️ **Production:** Restrict to your application's IP ranges

### 1.3 Test Connection

```bash
psql -h proofpass-db.xxxxxxxxxx.us-east-1.rds.amazonaws.com \
     -U proofpass_admin \
     -d proofpass
```

## Step 2: Setup Upstash Redis (Free)

### 2.1 Create Upstash Account

1. Go to https://upstash.com/
2. Sign up (free tier includes 10,000 commands/day)
3. Create new Redis database:
   - **Name:** proofpass-cache
   - **Region:** Choose closest to your RDS
   - **Type:** Regional (free)

### 2.2 Get Connection URL

Copy the Redis URL from dashboard:
```
rediss://default:xxxxxxxxxxxxx@us1-relaxed-narwhal-12345.upstash.io:6379
```

## Step 3: Run Database Migrations

### 3.1 Local Migration to RDS

Create a temporary `.env` file:

```bash
cat > .env.production << EOF
DATABASE_HOST=proofpass-db.xxxxxxxxxx.us-east-1.rds.amazonaws.com
DATABASE_PORT=5432
DATABASE_NAME=proofpass
DATABASE_USER=proofpass_admin
DATABASE_PASSWORD=your-password-here
EOF
```

Run migrations:

```bash
# Install dependencies if not done
cd apps/api
npm install

# Run migrations
NODE_ENV=production DATABASE_HOST=proofpass-db.xxxxxxxxxx.us-east-1.rds.amazonaws.com \
DATABASE_USER=proofpass_admin \
DATABASE_PASSWORD=your-password \
DATABASE_NAME=proofpass \
npx tsx src/config/migrate.ts
```

✅ You should see:
```
▶️  Running 001_initial_schema.sql...
✅ Completed 001_initial_schema.sql
▶️  Running 002_seed_templates.sql...
✅ Completed 002_seed_templates.sql
✨ All migrations completed successfully!
```

## Step 4: Deploy to Railway (Recommended)

### 4.1 Setup Railway Project

1. Go to https://railway.app/
2. Sign in with GitHub
3. Click **"New Project"** → **"Deploy from GitHub repo"**
4. Select your ProofPass repository
5. Railway will detect the Dockerfile automatically

### 4.2 Configure Environment Variables

In Railway dashboard, go to Variables and add:

```bash
NODE_ENV=production
PORT=3000

# Database (from AWS RDS)
DATABASE_HOST=proofpass-db.xxxxxxxxxx.us-east-1.rds.amazonaws.com
DATABASE_PORT=5432
DATABASE_NAME=proofpass
DATABASE_USER=proofpass_admin
DATABASE_PASSWORD=your-rds-password

# Redis (from Upstash)
REDIS_URL=rediss://default:xxxxx@us1-relaxed-narwhal-12345.upstash.io:6379

# Generate these (Railway can auto-generate)
JWT_SECRET=<click generate>
API_KEY_SALT=<click generate>

# Stellar (optional for testing)
STELLAR_NETWORK=testnet
STELLAR_SECRET_KEY=
STELLAR_PUBLIC_KEY=

# Other
LOG_LEVEL=info
CORS_ORIGIN=*
```

### 4.3 Deploy

Railway will automatically:
1. Build the Docker image
2. Deploy the application
3. Provide a public URL: `https://proofpass-api-production.up.railway.app`

### 4.4 Custom Domain (Optional)

1. In Railway → Settings → Domains
2. Add custom domain: `api.proofpass.com`
3. Update DNS records as instructed

## Step 5: Alternative - Deploy to Render

### 5.1 Setup Render

1. Go to https://render.com/
2. Sign in with GitHub
3. Click **"New"** → **"Web Service"**
4. Connect your GitHub repository
5. Configure:
   - **Name:** proofpass-api
   - **Environment:** Node
   - **Build Command:** `npm install && npm run build:packages && cd apps/api && npm run build`
   - **Start Command:** `node apps/api/dist/main.js`
   - **Plan:** Free (or Starter for production)

### 5.2 Configure Environment Variables

Same as Railway (see Step 4.2)

### 5.3 Deploy

Render will automatically deploy. URL will be:
```
https://proofpass-api.onrender.com
```

## Step 6: Local Testing with Docker

### 6.1 Build and Run Locally

```bash
# Build image
docker build -t proofpass-api .

# Run with docker-compose (includes PostgreSQL + Redis)
docker-compose up -d

# Check logs
docker-compose logs -f api
```

Access at: `http://localhost:3000`

### 6.2 Stop Services

```bash
docker-compose down
```

## Step 7: Setup Stellar Testnet Account

### 7.1 Generate Test Account

```bash
npx tsx scripts/setup-stellar.ts
```

This will output:
```
Public Key (STELLAR_PUBLIC_KEY): GXXXXXXXXXXXXXXXXXXXXXX
Secret Key (STELLAR_SECRET_KEY): SXXXXXXXXXXXXXXXXXXXXXX
```

### 7.2 Add to Environment Variables

Update your Railway/Render environment with these keys.

## Step 8: Verify Deployment

### 8.1 Health Check

```bash
curl https://your-app-url.railway.app/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-10-28T00:00:00.000Z"
}
```

### 8.2 API Documentation

Visit: `https://your-app-url.railway.app/docs`

### 8.3 Test Registration

```bash
curl -X POST https://your-app-url.railway.app/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "name": "Test User"
  }'
```

Expected response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "email": "test@example.com",
    "name": "Test User",
    "api_key": "..."
  }
}
```

### 8.4 Create Test Attestation

```bash
TOKEN="your-token-from-registration"

curl -X POST https://your-app-url.railway.app/api/v1/attestations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "subject": "BATTERY-TEST-001",
    "type": "BatteryPassport",
    "claims": {
      "manufacturer": "Tesla Energy",
      "model": "Powerwall 2",
      "chemistry": "NMC811",
      "capacity_wh": 13500
    }
  }'
```

## Monitoring and Logs

### Railway

- Dashboard → Logs → View real-time logs
- Metrics → CPU, Memory, Network usage

### Render

- Dashboard → Logs
- Metrics available in paid tiers

### AWS RDS

- RDS Console → Monitoring
- CloudWatch for detailed metrics

## Cost Estimates

| Service | Free Tier | Estimated Monthly |
|---------|-----------|-------------------|
| AWS RDS (db.t3.micro) | 750 hours/month free | $0 (first year) / $15 after |
| Upstash Redis | 10k commands/day | $0 |
| Railway | 500 hours/month | $0 - $5 |
| Render | 750 hours/month | $0 |
| **Total** | | **$0 - $5/month** |

## Security Checklist

- [ ] RDS password is strong and secure
- [ ] Environment variables are not committed to git
- [ ] JWT_SECRET is randomly generated (64+ chars)
- [ ] API_KEY_SALT is randomly generated (64+ chars)
- [ ] CORS_ORIGIN is restricted in production
- [ ] RDS security group restricts access
- [ ] SSL/TLS enabled for database connections
- [ ] Backups enabled for RDS
- [ ] Monitoring and alerts configured

## Troubleshooting

### Connection timeout to RDS

- Check security group inbound rules
- Verify public accessibility is enabled
- Check VPC and subnet configuration

### Redis connection fails

- Verify Upstash URL is correct
- Check TLS/SSL requirement (use `rediss://`)
- Test connection from Railway/Render logs

### Migration fails

- Check database credentials
- Verify database exists
- Check network connectivity
- Review migration logs for SQL errors

### API won't start

- Check all required env vars are set
- Review Railway/Render logs
- Verify Docker build succeeded
- Test health check endpoint

## Next Steps

1. Configure monitoring (DataDog, Sentry)
2. Setup CI/CD pipeline
3. Configure staging environment
4. Add rate limiting per user
5. Setup backup strategy
6. Configure custom domain
7. Add SSL certificate

## Support

For issues:
1. Check logs in Railway/Render dashboard
2. Review CloudWatch logs (RDS)
3. Test database connectivity
4. Verify environment variables
5. Open GitHub issue with logs

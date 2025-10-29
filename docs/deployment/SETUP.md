# Setup Guide

## Quick Start (Development)

### 1. Install pnpm
```bash
npm install -g pnpm
```

### 2. Install dependencies
```bash
pnpm install
```

### 3. Setup PostgreSQL

**macOS (using Homebrew):**
```bash
brew install postgresql@14
brew services start postgresql@14
createdb proofpass
```

**Linux:**
```bash
sudo apt-get install postgresql-14
sudo systemctl start postgresql
sudo -u postgres createdb proofpass
```

**Windows:**
Download PostgreSQL from https://www.postgresql.org/download/windows/

### 4. Setup Redis

**macOS:**
```bash
brew install redis
brew services start redis
```

**Linux:**
```bash
sudo apt-get install redis-server
sudo systemctl start redis
```

**Windows:**
Download Redis from https://github.com/microsoftarchive/redis/releases

### 5. Configure environment
```bash
cp .env.example .env
```

Generate secure secrets:
```bash
# For JWT_SECRET and API_KEY_SALT
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Update `.env`:
```env
DATABASE_PASSWORD=your_postgres_password
JWT_SECRET=generated_secret_from_above
API_KEY_SALT=another_generated_secret
```

### 6. Run migrations
```bash
cd apps/api
pnpm install
pnpm run migrate
```

### 7. Setup Stellar testnet (optional)
```bash
pnpm tsx scripts/setup-stellar.ts
```

Add the generated keys to `.env`:
```env
STELLAR_PUBLIC_KEY=G...
STELLAR_SECRET_KEY=S...
STELLAR_NETWORK=testnet
```

### 8. Build packages
```bash
pnpm build
```

### 9. Start the server
```bash
cd apps/api
pnpm dev
```

Visit http://localhost:3000/docs to see the API documentation.

## Testing the API

### Register a user
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
  }'
```

Save the `token` from the response.

### Create an attestation
```bash
curl -X POST http://localhost:3000/api/v1/attestations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "subject": "BATTERY-001",
    "type": "BatteryPassport",
    "claims": {
      "manufacturer": "Tesla Energy",
      "model": "Powerwall 2",
      "chemistry": "NMC811",
      "capacity_wh": 13500
    }
  }'
```

## Troubleshooting

### Database connection error
- Check PostgreSQL is running: `brew services list` (macOS) or `sudo systemctl status postgresql` (Linux)
- Verify database exists: `psql -l`
- Check credentials in `.env`

### Redis connection error
- Check Redis is running: `redis-cli ping` (should return "PONG")
- Check Redis URL in `.env`

### Stellar integration issues
- Ensure you're using testnet for development
- Run `pnpm tsx scripts/setup-stellar.ts` to create a new test account
- Check Stellar Horizon status: https://status.stellar.org/

### Build errors
- Clear all build artifacts: `pnpm clean`
- Remove node_modules: `rm -rf node_modules && pnpm install`
- Ensure TypeScript version: `pnpm list typescript`

## Production Deployment

### Environment Setup
1. Use strong, unique values for `JWT_SECRET` and `API_KEY_SALT`
2. Use production PostgreSQL instance
3. Use production Redis instance
4. Set `NODE_ENV=production`
5. For Stellar mainnet, create a real account and fund it

### Database Migrations
```bash
NODE_ENV=production pnpm run migrate
```

### Build for Production
```bash
pnpm build
```

### Start Production Server
```bash
cd apps/api
NODE_ENV=production node dist/main.js
```

### Recommended: Use Process Manager
```bash
npm install -g pm2
pm2 start apps/api/dist/main.js --name proofpass-api
pm2 save
pm2 startup
```

## Docker Setup (Coming Soon)

Docker Compose configuration will be added in the next phase.

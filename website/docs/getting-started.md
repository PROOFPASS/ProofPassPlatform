# Getting Started with ProofPass Platform

Complete guide to set up and run ProofPass locally for development.

## Prerequisites

- **Node.js** 18+ (recommended 20+)
- **PostgreSQL** 14+
- **Redis** 7+ (optional but recommended)
- **npm** 9+
- **Git**

### Verify Installation

```bash
node --version    # v18+
npm --version     # v9+
psql --version    # v14+
git --version     # v2+
```

## Quick Setup (3 Options)

### Option 1: Development Mode (Recommended)

Best for active development with hot reload.

**Time**: 15-20 minutes

```bash
# 1. Clone and install
git clone https://github.com/PROOFPASS/ProofPassPlatform.git
cd ProofPassPlatform
npm install

# 2. Set up PostgreSQL
createdb proofpass_dev

# 3. Configure API
cd apps/api
cp .env.example .env

# Edit .env with your settings:
# DATABASE_URL="postgresql://user:password@localhost:5432/proofpass_dev"
# JWT_SECRET="your-secret-min-32-chars"
# NODE_ENV="development"

# 4. Run migrations
npx prisma generate
npx prisma migrate dev

# 5. Start API
npm run dev  # API runs on http://localhost:3000

# 6. In another terminal - Start Platform (optional)
cd apps/platform
npm run dev  # Platform runs on http://localhost:3001
```

### Option 2: Docker Development

Best for testing in production-like environment.

**Time**: 10-15 minutes

```bash
# 1. Ensure Docker is running
docker --version

# 2. Run automated setup script
./scripts/test-docker-local.sh

# 3. Open https://localhost:3001
# Login: admin@proofpass.local / Admin_Local_2025
```

### Option 3: Quick Demo

Just want to see it work? Run the demo:

```bash
# 1. Clone and install
git clone https://github.com/PROOFPASS/ProofPassPlatform.git
cd ProofPassPlatform
npm install

# 2. Run demo
cd examples/demo-client
npm install
npm run demo

# This will:
# - Create a Verifiable Credential
# - Generate a zero-knowledge proof
# - Create a Product Passport
# - Verify all components
```

## Which Option Should I Choose?

| Option | When to Use | Pros | Cons |
|--------|-------------|------|------|
| **Development Mode** | Building features | ✅ Hot reload<br>✅ Easy debugging<br>✅ Fast iteration | ❌ Requires local DB |
| **Docker** | Testing deployment | ✅ Production-like<br>✅ Isolated | ❌ No hot reload<br>❌ Slower |
| **Quick Demo** | Just exploring | ✅ Fastest<br>✅ No setup | ❌ Limited functionality |

## Detailed Setup Guide

### 1. Database Setup

#### PostgreSQL with Docker (Recommended)

```bash
docker run --name proofpass-postgres \
  -e POSTGRES_USER=proofpass \
  -e POSTGRES_PASSWORD=dev_password_123 \
  -e POSTGRES_DB=proofpass_dev \
  -p 5432:5432 \
  -d postgres:14-alpine

# Verify it's running
docker ps | grep proofpass-postgres
```

#### PostgreSQL Locally (macOS)

```bash
# Install
brew install postgresql@14
brew services start postgresql@14

# Create database
createdb proofpass_dev

# Create user (optional)
psql postgres
CREATE USER proofpass WITH PASSWORD 'dev_password_123';
GRANT ALL PRIVILEGES ON DATABASE proofpass_dev TO proofpass;
\q
```

### 2. Redis Setup (Optional)

```bash
# With Docker
docker run --name proofpass-redis \
  -p 6379:6379 \
  -d redis:7-alpine

# Or locally (macOS)
brew install redis
brew services start redis
```

### 3. Environment Variables

#### API Configuration (`apps/api/.env`)

```bash
# Database
DATABASE_URL="postgresql://proofpass:dev_password_123@localhost:5432/proofpass_dev"

# JWT & Authentication
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"
JWT_EXPIRES_IN="7d"

# Server
PORT=3000
NODE_ENV="development"

# Redis (optional)
REDIS_URL="redis://localhost:6379"

# CORS
CORS_ORIGIN="http://localhost:3001,http://localhost:3000"

# Blockchain - Stellar Testnet (optional)
STELLAR_NETWORK="testnet"
STELLAR_HORIZON_URL="https://horizon-testnet.stellar.org"
STELLAR_SECRET_KEY="S..."  # Get from stellar.org

# Blockchain - Optimism Sepolia (optional)
OPTIMISM_RPC_URL="https://sepolia.optimism.io"
OPTIMISM_PRIVATE_KEY="0x..."

# Blockchain - Arbitrum Sepolia (optional)
ARBITRUM_RPC_URL="https://sepolia-rollup.arbitrum.io/rpc"
ARBITRUM_PRIVATE_KEY="0x..."
```

#### Platform Configuration (`apps/platform/.env.local`)

```bash
# API URL
NEXT_PUBLIC_API_URL="http://localhost:3000"

# NextAuth
NEXTAUTH_URL="http://localhost:3001"
NEXTAUTH_SECRET="your-nextauth-secret-min-32-chars"

# Admin credentials (for development)
ADMIN_EMAIL="admin@proofpass.local"
ADMIN_PASSWORD="admin123"
```

### 4. Build Packages

```bash
# From project root
cd ProofPassPlatform

# Build all packages in correct order
npm run build:packages

# Or build individually
cd packages/types && npm run build
cd ../vc-toolkit && npm run build
cd ../blockchain && npm run build
```

### 5. Database Migrations

```bash
cd apps/api

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# (Optional) View database in Prisma Studio
npx prisma studio  # Opens at http://localhost:5555
```

### 6. Run Development Servers

#### Option A: Manual (3 terminals)

**Terminal 1 - API:**
```bash
cd apps/api
npm run dev
# ✓ Server running on http://localhost:3000
```

**Terminal 2 - Platform:**
```bash
cd apps/platform
npm run dev
# ▲ Next.js ready on http://localhost:3001
```

**Terminal 3 - Database UI (optional):**
```bash
cd apps/api
npx prisma studio
# 🚀 Studio ready on http://localhost:5555
```

#### Option B: One Command

```bash
# From project root
npm run dev:all

# This starts:
# - API on port 3000
# - Platform on port 3001
# - Prisma Studio on port 5555
```

### 7. Verify Setup

#### Test API

```bash
# Health check
curl http://localhost:3000/health

# Register user
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "name": "Test User"
  }'

# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!"
  }'
```

#### Test Platform

Open in browser: `http://localhost:3001`

Default login:
- Email: `admin@proofpass.local`
- Password: `admin123`

## Project Structure

```
ProofPassPlatform/
├── apps/
│   ├── api/                  # Backend API (Fastify)
│   │   ├── src/
│   │   │   ├── config/       # Database, Redis, environment
│   │   │   ├── middleware/   # Security, rate limiting
│   │   │   └── modules/      # Feature modules
│   │   ├── prisma/           # Database schema & migrations
│   │   └── __tests__/        # API tests
│   │
│   └── platform/             # Frontend Dashboard (Next.js)
│       ├── src/
│       │   ├── app/          # App Router pages
│       │   ├── components/   # React components
│       │   └── lib/          # Utilities
│       └── __tests__/        # Frontend tests
│
├── packages/
│   ├── types/                # Shared TypeScript types
│   ├── vc-toolkit/           # W3C Verifiable Credentials
│   ├── zk-toolkit/           # Zero-knowledge proofs
│   ├── blockchain/           # Multi-blockchain integration
│   ├── client/               # SDK for client apps
│   └── qr-toolkit/           # QR code generation
│
├── examples/
│   └── demo-client/          # Demo scripts
│
└── docs/                     # Documentation
```

## Ports Used

| Service | Port | URL |
|---------|------|-----|
| API | 3000 | http://localhost:3000 |
| Platform | 3001 | http://localhost:3001 |
| PostgreSQL | 5432 | localhost:5432 |
| Redis | 6379 | localhost:6379 |
| Prisma Studio | 5555 | http://localhost:5555 |

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode (development)
npm run test:watch

# Test specific package
cd packages/vc-toolkit && npm test

# Test API
cd apps/api && npm test
```

## Common Issues

### Port Already in Use

```bash
# Find process using port
lsof -i :3000
lsof -i :3001

# Kill process
kill -9 <PID>
```

### Database Connection Failed

```bash
# Verify PostgreSQL is running
docker ps | grep postgres
# OR
brew services list | grep postgresql

# Restart PostgreSQL
docker restart proofpass-postgres
# OR
brew services restart postgresql@14
```

### Module Not Found (@proofpass/types)

```bash
# Rebuild packages
npm run build:packages
```

### Prisma Client Not Generated

```bash
cd apps/api
npx prisma generate
```

### Redis Connection Refused

```bash
# Check Redis is running
docker ps | grep redis
# OR
brew services list | grep redis

# Redis is optional - comment out REDIS_URL in .env if not needed
```

## Useful Scripts

```bash
# Clean and reinstall everything
npm run clean
npm install
npm run build:packages

# Format code
npm run format

# Lint code
npm run lint

# Reset database (WARNING: deletes all data)
cd apps/api
npx prisma migrate reset

# Generate Prisma client
npx prisma generate

# View database
npx prisma studio
```

## Next Steps

Once you have ProofPass running:

1. **Explore the API** - Visit http://localhost:3000/documentation for Swagger docs
2. **Run the demo** - See [Demo Client README](../examples/demo-client/README.md)
3. **Read architecture docs** - Understand how it works: [Technical Architecture](architecture/TECHNICAL_ARCHITECTURE.md)
4. **Deploy to production** - When ready: [Deployment Guide](DEPLOYMENT.md)

## Additional Resources

- [API Reference](API_REFERENCE.md) - Complete API documentation
- [Testing Guide](testing/MAINTAINABLE_TESTS.md) - Testing best practices
- [Security Documentation](SECURITY.md) - Security guidelines
- [Contributing Guidelines](../CONTRIBUTING.md) - How to contribute

## Need Help?

- **Documentation**: [docs/README.md](README.md)
- **Issues**: [GitHub Issues](https://github.com/PROOFPASS/ProofPassPlatform/issues)
- **Discussions**: [GitHub Discussions](https://github.com/PROOFPASS/ProofPassPlatform/discussions)

---

**Ready to start developing!** 🚀

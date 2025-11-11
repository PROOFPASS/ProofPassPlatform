# ProofPass API

Backend RESTful API for ProofPass Platform - W3C Verifiable Credentials, Zero-Knowledge Proofs, and blockchain anchoring.

## Quick Start

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Run migrations
npm run db:migrate

# Start development server
npm run dev  # http://localhost:3000
```

## Features

- **Authentication** - JWT-based authentication system
- **Multi-Blockchain** - Support for 6 networks (Stellar, Optimism, Arbitrum)
- **Verifiable Credentials** - W3C-compliant VC generation and verification
- **Zero-Knowledge Proofs** - Privacy-preserving proofs
- **Product Passports** - Digital product identity and lifecycle tracking
- **Rate Limiting** - Distributed rate limiting via Redis
- **API Documentation** - Swagger/OpenAPI at `/docs`

## API Endpoints

### Authentication
```bash
POST /api/v1/auth/register  # Register new user
POST /api/v1/auth/login     # Login
GET  /api/v1/auth/me        # Get current user
```

### Blockchain (Multi-Chain)
```bash
GET  /api/v1/blockchain/info         # Get blockchain info
GET  /api/v1/blockchain/networks     # List supported networks
POST /api/v1/blockchain/anchor       # Anchor data (supports network param)
GET  /api/v1/blockchain/transactions/:hash  # Query transaction
```

**Supported networks**: `stellar-testnet`, `stellar-mainnet`, `optimism`, `optimism-sepolia`, `arbitrum`, `arbitrum-sepolia`

### Verifiable Credentials
```bash
POST /api/v1/attestations           # Create attestation
GET  /api/v1/attestations/:id       # Get attestation
POST /api/v1/attestations/verify    # Verify attestation
```

### Product Passports
```bash
POST  /api/v1/passports      # Create passport
GET   /api/v1/passports/:id  # Get passport
PATCH /api/v1/passports/:id  # Update passport
```

### Zero-Knowledge Proofs
```bash
POST /api/v1/zkp/proofs   # Generate ZK proof
POST /api/v1/zkp/verify   # Verify ZK proof
```

## Example Usage

```bash
# Register user
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","name":"Test User"}'

# Login
TOKEN=$(curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}' \
  | jq -r '.token')

# Anchor data on blockchain
curl -X POST http://localhost:3000/api/v1/blockchain/anchor \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"data":"Certification #12345","network":"stellar-testnet"}'
```

## Configuration

Key environment variables:

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/proofpass
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-min-32-chars
CORS_ORIGIN=http://localhost:3001

# Stellar
STELLAR_NETWORK=testnet
STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
STELLAR_SECRET_KEY=S...

# Optimism
OPTIMISM_RPC_URL=https://sepolia.optimism.io
OPTIMISM_PRIVATE_KEY=0x...

# Arbitrum
ARBITRUM_RPC_URL=https://sepolia-rollup.arbitrum.io/rpc
ARBITRUM_PRIVATE_KEY=0x...
```

## Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

## Production

```bash
# Build
npm run build

# Start production server
npm start
```

## Documentation

- **API Reference**: http://localhost:3000/docs (Swagger)
- **Full Documentation**: See [/docs](../../docs/) directory
- **Getting Started**: [Getting Started Guide](../../docs/GETTING_STARTED.md)
- **Deployment**: [Deployment Guide](../../docs/DEPLOYMENT.md)

## Project Structure

```
apps/api/
├── src/
│   ├── config/         # Configuration (DB, Redis, env)
│   ├── middleware/     # Security, rate limiting, auth
│   ├── modules/        # Feature modules
│   │   ├── auth/       # Authentication
│   │   ├── attestations/  # Verifiable Credentials
│   │   ├── passports/  # Product Passports
│   │   ├── zkp/        # Zero-Knowledge Proofs
│   │   └── usage/      # Usage tracking
│   └── main.ts         # Entry point
├── prisma/             # Database schema & migrations
└── __tests__/          # Tests
```

## Tech Stack

- **Framework**: Fastify
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis
- **Auth**: JWT
- **Blockchain**: Stellar SDK, Ethers.js (Optimism/Arbitrum)
- **Standards**: W3C DID Core 1.0, VC Data Model v1.1

## Support

- **Issues**: [GitHub Issues](https://github.com/PROOFPASS/ProofPassPlatform/issues)
- **Documentation**: [docs/](../../docs/)
- **Main README**: [Project README](../../README.md)

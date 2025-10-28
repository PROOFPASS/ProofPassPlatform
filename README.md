# ProofPass Platform

A blockchain-based platform for creating verifiable attestations, product passports, and zero-knowledge proofs.

## Features

- ✅ **Simple Attestations** - Create W3C Verifiable Credentials for any business event
- 📦 **Product Passports** - Aggregate multiple attestations into a complete product history
- 🔐 **Zero-Knowledge Proofs** - Prove claims without revealing sensitive data
- ⛓️ **Blockchain Anchoring** - Anchor attestations to Stellar and Optimism blockchains
- 🔍 **Verification** - Public verification via QR codes and API

## Tech Stack

### Backend
- **Node.js** with **TypeScript**
- **Fastify** - Fast and low overhead web framework
- **PostgreSQL** - Primary database
- **Redis** - Caching layer
- **Stellar SDK** - Blockchain integration
- **W3C Verifiable Credentials** - Standard-compliant credentials

### Packages
- `@proofpass/types` - Shared TypeScript types
- `@proofpass/stellar-sdk` - Stellar blockchain wrapper
- `@proofpass/vc-toolkit` - Verifiable Credentials utilities
- `@proofpass/zk-circuits` - Zero-knowledge proof circuits (coming soon)

## Project Structure

```
proofpass/
├── apps/
│   ├── api/              # Backend API
│   └── dashboard/        # Frontend (coming soon)
├── packages/
│   ├── types/            # Shared types
│   ├── stellar-sdk/      # Stellar integration
│   ├── vc-toolkit/       # VC generation & verification
│   └── zk-circuits/      # ZK circuits (coming soon)
└── scripts/              # Setup & utility scripts
```

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+
- PostgreSQL 14+
- Redis 6+

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd ProofPassPlatform
```

2. **Install dependencies**
```bash
pnpm install
```

3. **Setup environment variables**
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
- Database credentials
- Redis URL
- JWT secret (generate a secure random string)
- API key salt (generate a secure random string)

4. **Setup PostgreSQL database**
```bash
# Create database
createdb proofpass

# Run migrations
cd apps/api
pnpm run migrate
```

5. **Setup Stellar testnet account** (optional, for blockchain features)
```bash
pnpm tsx scripts/setup-stellar.ts
```

This will create a Stellar testnet account and fund it with test XLM. Copy the keys to your `.env` file.

6. **Start Redis**
```bash
redis-server
```

7. **Build packages**
```bash
pnpm build
```

8. **Start the API server**
```bash
cd apps/api
pnpm dev
```

The API will be running at `http://localhost:3000`

API Documentation available at `http://localhost:3000/docs`

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register a new user
- `POST /api/v1/auth/login` - Login
- `GET /api/v1/auth/me` - Get current user

### Attestations
- `POST /api/v1/attestations` - Create an attestation
- `GET /api/v1/attestations` - List all attestations
- `GET /api/v1/attestations/:id` - Get specific attestation
- `POST /api/v1/attestations/:id/verify` - Verify attestation (public)

## Usage Example

### 1. Register a user
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword123",
    "name": "John Doe",
    "organization": "Acme Corp"
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword123"
  }'
```

### 3. Create an attestation
```bash
curl -X POST http://localhost:3000/api/v1/attestations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "subject": "PRODUCT-12345",
    "type": "QualityTest",
    "claims": {
      "test_name": "Pressure Test",
      "test_date": "2024-01-20T10:30:00Z",
      "result": "pass",
      "score": 95,
      "inspector": "Jane Smith"
    },
    "blockchain_network": "stellar"
  }'
```

### 4. Verify an attestation
```bash
curl -X POST http://localhost:3000/api/v1/attestations/ATTESTATION_ID/verify
```

## Database Schema

- `users` - User accounts and API keys
- `attestations` - Verifiable attestations
- `product_passports` - Aggregated product passports
- `passport_attestations` - Many-to-many relationship
- `zk_proofs` - Zero-knowledge proofs
- `blockchain_transactions` - Blockchain transaction records
- `attestation_templates` - Pre-defined attestation templates

## Development Roadmap

### ✅ Phase 1 - Core Infrastructure (Completed)
- [x] Monorepo setup
- [x] Database schema
- [x] Stellar integration
- [x] Basic REST API
- [x] Authentication
- [x] Attestation CRUD

### 🚧 Phase 2 - W3C Verifiable Credentials (In Progress)
- [x] VC generation
- [x] VC verification
- [x] QR code generation
- [ ] Proper DID implementation
- [ ] Advanced cryptographic signing

### 📋 Phase 3 - Product Passports
- [ ] Passport creation API
- [ ] Timeline visualization
- [ ] Public verification page
- [ ] Batch operations

### 📋 Phase 4 - Zero-Knowledge Proofs
- [ ] Circom circuit definitions
- [ ] Proof generation API
- [ ] Proof verification
- [ ] UI for creating proofs

### 📋 Phase 5 - Dashboard UI
- [ ] Next.js setup
- [ ] Authentication flow
- [ ] Attestation management
- [ ] Passport builder
- [ ] Analytics

## Environment Variables

See `.env.example` for all available configuration options.

Required for production:
- `DATABASE_PASSWORD` - PostgreSQL password
- `JWT_SECRET` - Secure random string for JWT signing
- `API_KEY_SALT` - Secure random string for API key hashing
- `STELLAR_SECRET_KEY` - Stellar account secret (for mainnet)
- `STELLAR_PUBLIC_KEY` - Stellar account public key

## Scripts

- `pnpm dev` - Start all services in development mode
- `pnpm build` - Build all packages
- `pnpm test` - Run tests (coming soon)
- `pnpm lint` - Lint code (coming soon)

## Security Considerations

- API keys are hashed before storage
- Passwords are hashed with bcrypt
- JWT tokens expire after 7 days (configurable)
- Rate limiting enabled on all endpoints
- CORS configured for production

## License

See LICENSE file for details.

## Contributing

Contributions are welcome! Please read the contributing guidelines first.

## Support

For issues and questions, please open an issue on GitHub.

# ProofPass Platform

**Version 1.0.0 - Production Ready** 🎉

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![DPG](https://img.shields.io/badge/Digital%20Public%20Good-Candidate-orange)](DPG_SUBMISSION.md)
[![Tests](https://img.shields.io/badge/Tests-111%20passing-success)](https://github.com/PROOFPASS/ProofPassPlatform)

A blockchain-based platform for creating verifiable attestations, product passports, and zero-knowledge proofs with enterprise-grade security.

## 🌍 Digital Public Good

ProofPass is designed as a **Digital Public Good** to promote transparency, trust, and accountability globally. By providing free, open-source infrastructure for verifiable credentials, we're contributing to:

- **SDG 9** - Industry, Innovation and Infrastructure
- **SDG 12** - Responsible Consumption and Production
- **SDG 16** - Peace, Justice and Strong Institutions

### Why This Matters

- **🌐 Accessible:** Free and open-source, no vendor lock-in
- **🔐 Privacy-Preserving:** Zero-knowledge proofs protect sensitive data
- **📊 Transparent:** Blockchain-anchored for public verifiability
- **🤝 Interoperable:** W3C standards ensure compatibility
- **♻️ Sustainable:** Low-cost deployment ($5-10/month)

**Learn More:** [DPG Submission Document](docs/DPG_SUBMISSION.md)

---

## ✨ Features

- ✅ **Simple Attestations** - Create W3C Verifiable Credentials for any business event
- ✅ **Product Passports** - Aggregate multiple attestations into a complete product history
- ✅ **Zero-Knowledge Proofs** - Prove claims without revealing sensitive data (threshold, range, set membership)
- ✅ **Blockchain Anchoring** - Immutably anchor attestations to Stellar blockchain
- ✅ **Public Verification** - Verify credentials via QR codes and API
- ✅ **Enterprise Security** - Multi-tier rate limiting, input sanitization, centralized error handling
- ✅ **Comprehensive Testing** - 111 tests with 85-90% coverage
- ✅ **Production-Ready Documentation** - Security guide, architecture docs, API reference
- ✅ **Swagger/OpenAPI 3.0** - Interactive API documentation with complete schemas and examples

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
- `@proofpass/vc-toolkit` - Verifiable Credentials generation & verification
- `@proofpass/zk-toolkit` - Zero-knowledge proof circuits (threshold, range, set membership)

## 📁 Project Structure

```
ProofPassPlatform/
├── apps/
│   └── api/                      # Backend API (Fastify + TypeScript)
│       ├── src/
│       │   ├── config/           # Database, Redis, environment
│       │   ├── middleware/       # Security, rate limiting, error handling
│       │   └── modules/          # Feature modules
│       │       ├── auth/         # Authentication & authorization
│       │       ├── attestations/ # Attestation management
│       │       ├── passports/    # Product passport aggregation
│       │       └── zkp/          # Zero-knowledge proofs
│       └── __tests__/            # Comprehensive test suite (111 tests)
│
├── packages/                     # Shared libraries
│   ├── types/                    # TypeScript type definitions
│   ├── stellar-sdk/              # Stellar blockchain client
│   ├── vc-toolkit/               # W3C Verifiable Credentials
│   └── zk-toolkit/               # Zero-knowledge proof circuits
│
├── scripts/                      # Deployment & setup scripts
│   ├── deployment/               # Docker deployment automation
│   └── setup-stellar.ts          # Stellar testnet setup
│
├── SECURITY.md                   # Security best practices guide
├── API_ARCHITECTURE.md           # System design documentation
├── PHASE4_COMPLETE.md           # Latest phase completion report
└── docker-compose.yml            # Docker orchestration
```

## 🚀 Quick Start (2 Options)

### Option 1: Docker (Recommended - 5 minutes)

```bash
# 1. Clone repository
git clone <repository-url>
cd ProofPassPlatform

# 2. Configure environment
cp .env.production.example .env.production
# Edit .env.production with your settings

# 3. Deploy!
./scripts/deployment/deploy.sh
```

Your API will be running at `http://localhost:3000` with PostgreSQL and Redis included!

**See [DEPLOY_PORTABLE.md](docs/deployment/DEPLOY_PORTABLE.md) for production deployment to any server.**

### Option 2: Local Development

Prerequisites:
- Node.js 18+
- npm 8+
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

## 📡 API Endpoints

**Interactive API Documentation:** `http://localhost:3000/docs` (Swagger UI)

### Authentication
- `POST /api/v1/auth/register` - Register a new user
- `POST /api/v1/auth/login` - Login
- `GET /api/v1/auth/me` - Get current user info

### Attestations
- `POST /api/v1/attestations` - Create an attestation
- `GET /api/v1/attestations` - List user's attestations
- `GET /api/v1/attestations/:id` - Get specific attestation
- `GET /api/v1/attestations/:id/verify` - Verify attestation (public)
- `POST /api/v1/attestations/:id/anchor` - Anchor to blockchain

### Product Passports
- `POST /api/v1/passports` - Create product passport (aggregate attestations)
- `GET /api/v1/passports/:id` - Get passport details
- `GET /api/v1/passports/product/:productId` - Get passport by product ID
- `GET /api/v1/passports` - List user's passports
- `GET /api/v1/passports/:id/verify` - Verify passport and all attestations
- `POST /api/v1/passports/:id/attestations` - Add attestation to passport

### Zero-Knowledge Proofs
- `POST /api/v1/zkp/proofs` - Generate ZK proof (threshold/range/set_membership)
- `GET /api/v1/zkp/proofs/:id` - Get proof details
- `GET /api/v1/zkp/proofs` - List user's proofs
- `GET /api/v1/zkp/proofs/:id/verify` - Verify ZK proof
- `GET /api/v1/attestations/:id/proofs` - Get proofs for an attestation

### Health Checks
- `GET /health` - Basic health check
- `GET /ready` - Readiness check (includes DB and Redis)

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

## 🌐 Deployment Options

ProofPass is designed to be **portable** and run anywhere:

- 🐳 **Docker** - One command deployment
- ☁️ **Any VPS** - DigitalOcean, Linode, Hetzner (from $5/month)
- 🏢 **Cloud Platforms** - AWS, Google Cloud, Azure
- 🏠 **On-premise** - Your own servers
- 🧪 **Local** - Docker Compose for development

**No vendor lock-in. Deploy anywhere.**

See [DEPLOY_PORTABLE.md](docs/deployment/DEPLOY_PORTABLE.md) for complete guide.

## 🗺️ Development Roadmap

### ✅ Phase 1 - Core Infrastructure (COMPLETE)
- [x] Monorepo setup with npm workspaces
- [x] Database schema with PostgreSQL
- [x] Stellar blockchain integration
- [x] REST API with Fastify + Swagger
- [x] JWT Authentication + API Keys
- [x] Attestation CRUD endpoints
- [x] W3C Verifiable Credentials generation & verification
- [x] QR Code generation
- [x] Docker deployment setup
- [x] Production-ready scripts
- [x] 56 comprehensive tests (TDD foundation)

**📄 Documentation:** See [PHASE1_COMPLETE.md](docs/phase-reports/PHASE1_COMPLETE.md) for details

### ✅ Phase 2 - Product Passports & Zero-Knowledge Proofs (COMPLETE)
- [x] Product Passport service & routes
- [x] Passport aggregation (multiple attestations → single credential)
- [x] ZK Toolkit package creation
- [x] Three ZK proof circuits (threshold, range, set_membership)
- [x] ZK Proof service & routes
- [x] Simplified ZKP implementation (MVP - hash-based commitments)
- [x] Proof generation and verification endpoints
- [x] QR code generation for passports

**📄 Documentation:** See [PHASE2_COMPLETE.md](docs/phase-reports/PHASE2_COMPLETE.md) for details

### ✅ Phase 3 - Comprehensive Testing (COMPLETE)
- [x] Test factories for all entities (DRY test data)
- [x] ZK Circuit tests (36 tests, 89% coverage)
- [x] Passport integration tests (15 tests, 84% coverage)
- [x] ZKP integration tests (16 tests, 90% coverage)
- [x] Increased total tests from 56 to 111 (+98%)
- [x] All tests passing with fast execution (~3-4s)
- [x] Maintainable test architecture

**📄 Documentation:** See [PHASE3_COMPLETE.md](docs/phase-reports/PHASE3_COMPLETE.md) for details

### ✅ Phase 4 - Security, Architecture & Documentation (COMPLETE)
- [x] Centralized error handling middleware
- [x] Multi-tier Redis-based rate limiting (4 tiers)
- [x] Security middleware (XSS, SQL injection prevention)
- [x] Input sanitization and validation
- [x] Enhanced logging with Pino (structured JSON logs)
- [x] Security headers (9 headers configured)
- [x] Request size limiting & Content-Type validation
- [x] Health checks (/health, /ready)
- [x] Comprehensive security documentation (SECURITY.md)
- [x] API architecture documentation (API_ARCHITECTURE.md)

**📄 Documentation:** See [PHASE4_COMPLETE.md](docs/phase-reports/PHASE4_COMPLETE.md) for details

### 📋 Phase 5 - Advanced Features (Future)
- [ ] WebSocket support for real-time updates
- [ ] GraphQL API alternative
- [ ] Production-grade zk-SNARKs (Circom/snarkjs)
- [ ] API key auto-rotation mechanism
- [ ] Advanced monitoring (Prometheus + Grafana)
- [ ] Two-factor authentication (2FA)
- [ ] OAuth2 integration (Google, GitHub)
- [ ] Dashboard UI (Next.js)
- [ ] Batch operations for attestations
- [ ] Advanced search and filtering

## Environment Variables

See `.env.example` for all available configuration options.

Required for production:
- `DATABASE_PASSWORD` - PostgreSQL password
- `JWT_SECRET` - Secure random string for JWT signing
- `API_KEY_SALT` - Secure random string for API key hashing
- `STELLAR_SECRET_KEY` - Stellar account secret (for mainnet)
- `STELLAR_PUBLIC_KEY` - Stellar account public key

## Scripts

### Development
- `npm run build:packages` - Build all TypeScript packages
- `npm run build:api` - Build API server
- `npm run migrate` - Run database migrations
- `npm run setup:stellar` - Create Stellar testnet account

### Deployment (Docker)
- `./scripts/deployment/deploy.sh` - Deploy to production
- `./scripts/deployment/backup.sh` - Backup database
- `./scripts/deployment/ssl-setup.sh` - Setup SSL certificate
- `docker-compose up -d` - Start local Docker environment
- `docker-compose -f docker-compose.prod.yml up -d` - Start production

## 🔒 Security

ProofPass implements enterprise-grade security with defense-in-depth strategy.

### Security Features

- ✅ **Multi-Tier Rate Limiting** - 4 tiers (global, auth, user, expensive) with Redis
- ✅ **Input Sanitization** - XSS prevention and SQL injection detection
- ✅ **Centralized Error Handling** - Security-conscious error messages
- ✅ **API Keys** - Hashed with SHA-256 + salt before storage
- ✅ **Passwords** - Hashed with bcrypt (10 rounds)
- ✅ **JWT Tokens** - HS256 signed, 24-hour expiration
- ✅ **Security Headers** - 9 HTTP security headers (Helmet.js + custom)
- ✅ **Request Size Limiting** - 10MB maximum payload
- ✅ **Content-Type Validation** - Ensures application/json
- ✅ **Parameterized Queries** - SQL injection prevention
- ✅ **CORS** - Configured for production domain
- ✅ **Structured Logging** - Pino with request correlation
- ✅ **Request IDs** - Unique ID for every request

### Security Headers

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'
... (9 headers total)
```

### Rate Limiting

| Tier | Limit | Applied To |
|------|-------|------------|
| **Global** | 100 req/min | Unauthenticated requests |
| **Auth** | 5 req/15min | Login, Register (brute force protection) |
| **User** | 60 req/min | Standard authenticated operations |
| **Expensive** | 10 req/min | ZK proofs, blockchain operations |

**📄 Complete Security Guide:** See [SECURITY.md](docs/SECURITY.md)

## 📚 Documentation

### Core Documentation
- **[README.md](README.md)** - This file (Quick start, features, API reference)
- **[SECURITY.md](docs/SECURITY.md)** - Comprehensive security best practices guide
- **[API_ARCHITECTURE.md](docs/architecture/API_ARCHITECTURE.md)** - System design and architecture
- **[DPG_SUBMISSION.md](docs/DPG_SUBMISSION.md)** - Digital Public Good submission

### Getting Started
- **[SETUP.md](docs/deployment/SETUP.md)** - Local development setup
- **[DEPLOY_PORTABLE.md](docs/deployment/DEPLOY_PORTABLE.md)** - Production deployment guide
- **[DEPLOYMENT.md](docs/deployment/DEPLOYMENT.md)** - Docker deployment details

### Development Guides
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - How to contribute to the project
- **[CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)** - Community guidelines
- **[CODE_QUALITY.md](docs/architecture/CODE_QUALITY.md)** - Code quality standards
- **[BEST_PRACTICES_IMPLEMENTED.md](docs/architecture/BEST_PRACTICES_IMPLEMENTED.md)** - Best practices guide

### Testing Documentation
- **[TESTING.md](docs/testing/TESTING.md)** - Quick start testing guide
- **[MAINTAINABLE_TESTS.md](docs/testing/MAINTAINABLE_TESTS.md)** - Complete testing guide
- **[TEST_RESULTS.md](docs/testing/TEST_RESULTS.md)** - Latest test results

### Phase Completion Reports
- **[PHASE1_COMPLETE.md](docs/phase-reports/PHASE1_COMPLETE.md)** - Core infrastructure
- **[PHASE2_COMPLETE.md](docs/phase-reports/PHASE2_COMPLETE.md)** - Product Passports & ZK Proofs
- **[PHASE3_COMPLETE.md](docs/phase-reports/PHASE3_COMPLETE.md)** - Comprehensive testing
- **[PHASE4_COMPLETE.md](docs/phase-reports/PHASE4_COMPLETE.md)** - Security & documentation
- **[FINAL_SUMMARY.md](docs/phase-reports/FINAL_SUMMARY.md)** - Complete project summary

### API Documentation
- **[API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md)** - Complete API guide with Swagger/OpenAPI
- **Interactive Swagger UI:** `http://localhost:3000/docs` (when running)
- **OpenAPI Specification:** Available via Swagger UI at `/documentation/json`

## 🧪 Testing

```bash
# Run all tests (111 tests)
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test apps/api/__tests__/integration/passports.integration.test.ts

# Watch mode (development)
npm run test:watch
```

**Test Coverage:**
- ZK Circuits: 89%
- Passport Routes: 84%
- ZKP Routes: 90%
- Auth Routes: 85%
- **Total: 111 tests passing**

## 📜 License

ProofPass Platform is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**.

This copyleft license ensures that:
- ✅ The code remains free and open-source
- ✅ Modifications must be shared (even for network services)
- ✅ Commercial use is allowed
- ✅ The platform remains a Digital Public Good

See [LICENSE](LICENSE) for full details.

**Why AGPL-3.0?** We chose this license to ensure ProofPass always remains accessible to everyone, protecting it from becoming proprietary while allowing commercial applications.

## 🤝 Contributing

We welcome contributions from developers, organizations, and individuals worldwide!

**Ways to Contribute:**
- 🐛 Report bugs or suggest features via [GitHub Issues](https://github.com/PROOFPASS/ProofPassPlatform/issues)
- 💻 Submit pull requests for code improvements
- 📚 Improve documentation or add translations
- 🌍 Share use cases and success stories
- 💬 Join discussions about features and roadmap

**Get Started:**
1. Read [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines
2. Check [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) for community standards
3. Fork the repository and start coding!

**Recognition:** All contributors are acknowledged in our repository and release notes.

## 💬 Support & Community

### Get Help

- **📖 Documentation:** Check [comprehensive docs](README.md)
- **💬 GitHub Discussions:** Ask questions and share ideas
- **🐛 GitHub Issues:** Report bugs or request features
- **📧 Email:** fboiero@frvm.utn.edu.ar (for sensitive issues)

### Stay Updated

- **⭐ Star** the repository to follow updates
- **👀 Watch** for new releases and announcements
- **🔔 Subscribe** to issue notifications

### Digital Public Good Alliance

This project is a candidate for recognition as a Digital Public Good by the [Digital Public Goods Alliance](https://digitalpublicgoods.net/).

**Learn More:**
- [DPG Submission Document](docs/DPG_SUBMISSION.md) - Complete submission details
- [UN Sustainable Development Goals](https://sdgs.un.org/) - How ProofPass contributes

---

## 🌟 Mission

**ProofPass Platform exists to democratize access to verifiable credential infrastructure.**

We believe that transparent, trustworthy systems should be accessible to everyone—from small businesses to large organizations, from developing nations to advanced economies.

By keeping ProofPass free, open-source, and standards-based, we're building infrastructure for a more transparent and accountable world.

**Join us in making trust accessible to all.** 🌍

---

**Built with ❤️ by the ProofPass community | Licensed under AGPL-3.0 | A Digital Public Good**

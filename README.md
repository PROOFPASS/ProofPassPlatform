# ProofPass Platform

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![Node Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![DPG](https://img.shields.io/badge/Digital%20Public%20Good-Candidate-orange)](docs/DPG_SUBMISSION.md)
[![W3C](https://img.shields.io/badge/W3C-DID%20Core%201.0-success)](https://www.w3.org/TR/did-core/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Code Style](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://prettier.io/)

Platform for creating **W3C Verifiable Credentials**, **ZK Proofs**, and **Digital Product Passports** anchored on blockchain.

## What is this?

ProofPass lets you create, manage, and verify tamper-proof digital credentials. Built on W3C standards (DID Core 1.0, VC Data Model v1.1) with zero-knowledge proofs for privacy and blockchain anchoring for immutability.

Current blockchain support: Stellar (testnet/mainnet), with Optimism and Arbitrum coming soon.

Use it for supply chain tracking, product authentication, credential verification, or anything that needs cryptographic proof.

## Quick Start

```bash
git clone https://github.com/PROOFPASS/ProofPassPlatform.git
cd ProofPassPlatform
npm install

# Interactive setup wizard
node setup.js
```

**Or jump directly to what you need:**

```bash
# See a quick demo (2 min, no dependencies)
node scripts/demo-standalone.js

# Run a use case example
node examples/use-cases/1-product-certification.js
node examples/use-cases/2-age-verification.js
node examples/use-cases/3-supply-chain.js
```

New here? Run `node setup.js` and choose your path.

## Documentation

### Getting Started
- [Quick Start Guide](docs/GETTING_STARTED.md) - Get up and running in 15 minutes
- [Demo Walkthrough](examples/demo-client/README.md) - End-to-end examples
- [Development Guide](DEVELOPMENT.md) - Complete developer setup and workflows

### Technical Documentation
- [API Reference](docs/API_REFERENCE.md) - Comprehensive API documentation
- [Technical Architecture](docs/architecture/TECHNICAL_ARCHITECTURE.md) - System design and patterns
- [Security Policy](SECURITY.md) - Security practices and vulnerability reporting

### Deployment & Operations
- [Production Readiness Guide](PRODUCTION_READINESS.md) - Complete deployment checklist
- [Deployment Guide](docs/DEPLOYMENT.md) - Step-by-step production setup

### Project Information
- [Contributing Guidelines](CONTRIBUTING.md) - How to contribute to the project
- [Roadmap](ROADMAP.md) - Future plans and feature timeline
- [Changelog](CHANGELOG.md) - Version history and changes
- [Contributors](CONTRIBUTORS.md) - Project contributors

## Key Features

- **Verifiable Credentials** - W3C-compliant credentials with Ed25519 signatures
- **Decentralized Identifiers** - did:key and did:web support
- **Zero-Knowledge Proofs** - Groth16 zk-SNARKs for privacy
- **Digital Product Passports** - Aggregate credentials into portable passports
- **Multi-Blockchain** - 6 networks (Stellar testnet/mainnet, Optimism, Arbitrum)
- **Enterprise SaaS** - Multi-tenant with tiered rate limiting

## Tech Stack

**Backend**: Node.js, TypeScript, Fastify, PostgreSQL, Redis
**Frontend**: Next.js 15, React 19, Tailwind CSS
**Blockchain**: Stellar, Optimism, Arbitrum SDKs
**Standards**: W3C DID Core 1.0, VC Data Model v1.1, JWT/JWS

## Use Cases

Real-world examples that work out of the box:

| Use Case | Command | Description |
|----------|---------|-------------|
| **Product Certification** | `node examples/use-cases/1-product-certification.js` | Certify products with W3C credentials + ZK proofs |
| **Age Verification** | `node examples/use-cases/2-age-verification.js` | Prove age ≥18 without revealing exact age |
| **Supply Chain** | `node examples/use-cases/3-supply-chain.js` | Full traceability with Digital Product Passport |

See [examples/use-cases/](examples/use-cases/) for detailed documentation.

## Project Structure

```
ProofPassPlatform/
├── apps/
│   ├── api/              # Backend API (Fastify)
│   └── platform/         # Admin Dashboard (Next.js)
├── packages/
│   ├── vc-toolkit/       # W3C Verifiable Credentials
│   ├── zk-toolkit/       # Zero-knowledge proofs (Groth16)
│   ├── blockchain/       # Multi-blockchain integration
│   └── types/            # Shared TypeScript types
├── examples/
│   ├── use-cases/        # Real-world use case examples
│   └── demo-client/      # API integration demo
├── scripts/
│   └── demo-standalone.js  # Quick demo (no dependencies)
├── setup.js              # Interactive setup wizard
└── docs/                 # Documentation
```

## API Endpoints

```bash
# Health check
GET  /health

# Authentication
POST /api/v1/auth/register
POST /api/v1/auth/login

# Verifiable Credentials
POST /api/v1/attestations
POST /api/v1/attestations/verify

# Zero-Knowledge Proofs
POST /api/v1/zkp/proofs
POST /api/v1/zkp/verify

# Product Passports
POST /api/v1/passports
GET  /api/v1/passports/:id
```

Full API documentation: [API_REFERENCE.md](docs/API_REFERENCE.md)

## CLI Tool

ProofPass includes an interactive CLI for development and testing:

```bash
# Run the CLI
npm run cli

# Or use specific commands directly
npm run cli help        # Show all available commands
npm run cli validate    # Validate system requirements
npm run cli health      # Run health checks
npm run cli install     # Run installation wizard
```

Available commands:
- **Getting Started**: `install`, `validate`, `health`
- **Development**: `dev`, `build`, `test`
- **Stellar**: `stellar:setup`, `stellar:demo`, `stellar:balance`
- **Database**: `db:setup`, `db:migrate`, `db:reset`
- **Utilities**: `docs`, `status`, `help`, `exit`

See [CLI Documentation](cli/README.md) for full details.

## Testing

ProofPass includes comprehensive test coverage:

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:cli        # CLI tool tests
npm run test:scripts    # Bash script tests
npm run test:all        # All tests combined

# Test with coverage
npm run test:coverage
```

Current test coverage:
- **CLI Tests**: 10+ test suites covering all commands
- **Bash Scripts**: 34/34 tests passing (100%)
- **Integration Tests**: End-to-end workflow validation

See [TESTING.md](TESTING.md) for testing guidelines.

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for:
- Development setup
- Coding standards
- Pull request process
- Testing requirements

## Digital Public Good

ProofPass is designed as a Digital Public Good aligned with UN Sustainable Development Goals:
- **SDG 9** - Industry, Innovation and Infrastructure
- **SDG 12** - Responsible Consumption and Production
- **SDG 16** - Peace, Justice and Strong Institutions

Learn more: [DPG Submission](docs/DPG_SUBMISSION.md)

## License

This project is licensed under the GNU AGPL-3.0 License - see [LICENSE](LICENSE) for details.

## Production Deployment

Ready to deploy to production? See:
- [Production Readiness Guide](PRODUCTION_READINESS.md) - Complete deployment checklist
- [Deployment Documentation](docs/DEPLOYMENT.md) - Step-by-step deployment guide
- [Security Policy](SECURITY.md) - Security best practices and vulnerability reporting

## Support

- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/PROOFPASS/ProofPassPlatform/issues)
- **Discussions**: [GitHub Discussions](https://github.com/PROOFPASS/ProofPassPlatform/discussions)
- **Security**: [SECURITY.md](SECURITY.md)

---

**Developed and maintained by the ProofPass team**

For questions or contributions, see [CONTRIBUTING.md](CONTRIBUTING.md)

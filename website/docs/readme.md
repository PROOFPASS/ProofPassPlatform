# ProofPass Platform

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![DPG](https://img.shields.io/badge/Digital%20Public%20Good-Candidate-orange)](docs/DPG_SUBMISSION.md)
[![W3C](https://img.shields.io/badge/W3C-DID%20Core%201.0-success)](docs/architecture/DID_INTEGRATION.md)

Production-ready platform for **W3C Verifiable Credentials**, **Zero-Knowledge Proofs**, and **Digital Product Passports** using blockchain technology and decentralized identifiers.

## What is ProofPass?

ProofPass provides a complete solution for creating, managing, and verifying digital credentials that are:

- **Standards-compliant** - W3C DID Core 1.0 and Verifiable Credentials Data Model v1.1
- **Privacy-preserving** - Zero-knowledge proofs for selective disclosure
- **Blockchain-anchored** - Immutable audit trail on Stellar, Optimism, and Arbitrum (6 networks)
- **Enterprise-ready** - Multi-tenant SaaS with rate limiting and usage tracking

**Use cases**: Supply chain transparency, product authentication, ESG reporting, regulatory compliance.

## Quick Start

Get started in 3 minutes:

```bash
# Clone and install
git clone https://github.com/PROOFPASS/ProofPassPlatform.git
cd ProofPassPlatform
npm install

# Run the demo
cd examples/demo-client
npm install
npm run demo
```

**New to ProofPass?** Start here: [Getting Started Guide](docs/GETTING_STARTED.md)

## Documentation

### Getting Started
- **[Getting Started Guide](docs/GETTING_STARTED.md)** - Complete setup and quickstart
- **[Demo Walkthrough](examples/demo-client/README.md)** - End-to-end workflow demo

### Development & Deployment
- **[Deployment Guide](docs/DEPLOYMENT.md)** - Production deployment
- **[API Reference](docs/API_REFERENCE.md)** - Complete API documentation
- **[Testing Guide](docs/testing/MAINTAINABLE_TESTS.md)** - Testing best practices

### Architecture & Security
- **[Technical Architecture](docs/architecture/TECHNICAL_ARCHITECTURE.md)** - System design
- **[Security Documentation](docs/SECURITY.md)** - Security best practices
- **[DID Integration](docs/architecture/DID_INTEGRATION.md)** - W3C DID implementation

### Additional Resources
- **[Contributing Guidelines](CONTRIBUTING.md)** - How to contribute
- **[Code of Conduct](docs/guides/CODE_OF_CONDUCT.md)** - Community guidelines
- **[Documentation Index](docs/README.md)** - Full documentation map

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

## Project Structure

```
ProofPassPlatform/
├── apps/
│   ├── api/              # Backend API (Fastify)
│   └── platform/         # Admin Dashboard (Next.js)
├── packages/
│   ├── vc-toolkit/       # W3C Verifiable Credentials
│   ├── zk-toolkit/       # Zero-knowledge proofs
│   ├── blockchain/       # Multi-blockchain integration
│   └── types/            # Shared TypeScript types
├── examples/
│   └── demo-client/      # Complete demo walkthrough
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

## Support

- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/PROOFPASS/ProofPassPlatform/issues)
- **Discussions**: [GitHub Discussions](https://github.com/PROOFPASS/ProofPassPlatform/discussions)

---

**Built by the ProofPass team**

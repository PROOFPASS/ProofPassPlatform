# Development Guide

Complete guide for developers contributing to ProofPass Platform.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Development Environment Setup](#development-environment-setup)
3. [Project Structure](#project-structure)
4. [Development Workflow](#development-workflow)
5. [Coding Standards](#coding-standards)
6. [Testing](#testing)
7. [Debugging](#debugging)
8. [Common Tasks](#common-tasks)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

- **Node.js**: 20.x or higher (LTS recommended)
- **npm**: 9.x or higher (comes with Node.js)
- **Git**: 2.40+
- **PostgreSQL**: 14+ (for local development)
- **Redis**: 7+ (optional but recommended)
- **Docker**: 24+ (optional, for containerized development)

### Recommended Tools

- **VS Code**: With extensions:
  - ESLint
  - Prettier
  - TypeScript and JavaScript Language Features
  - Jest
  - Docker
  - PostgreSQL
- **Postman** or **Insomnia**: For API testing
- **pgAdmin** or **DBeaver**: For database management

### Verify Installation

```bash
node --version    # Should be 20.x or higher
npm --version     # Should be 9.x or higher
git --version     # Should be 2.40+
psql --version    # Should be 14+
docker --version  # Optional
```

---

## Development Environment Setup

### 1. Clone Repository

```bash
git clone https://github.com/PROOFPASS/ProofPassPlatform.git
cd ProofPassPlatform
```

### 2. Install Dependencies

```bash
# Install all workspace dependencies
npm install

# This will install dependencies for:
# - Root workspace
# - apps/api
# - apps/platform
# - All packages in packages/*
```

### 3. Set Up Environment Variables

```bash
# Copy example environment files
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/platform/.env.local.example apps/platform/.env.local
```

**Edit `apps/api/.env`:**

```bash
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/proofpass_dev

# Redis (optional)
REDIS_URL=redis://localhost:6379

# Security
JWT_SECRET=dev-jwt-secret-min-32-characters-long
API_KEY_SALT=dev-api-key-salt-min-32-characters

# Server
PORT=3000
NODE_ENV=development
LOG_LEVEL=debug

# CORS
CORS_ORIGIN=http://localhost:3001,http://localhost:3000

# Blockchain (optional for basic development)
STELLAR_NETWORK=testnet
STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
```

**Edit `apps/platform/.env.local`:**

```bash
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=dev-nextauth-secret-min-32-chars
```

### 4. Set Up Database

#### Option A: Local PostgreSQL

```bash
# Create database
createdb proofpass_dev

# Run migrations
cd apps/api
npm run db:migrate

# Optional: Seed with example data
npm run db:seed
```

#### Option B: Docker PostgreSQL

```bash
docker run --name proofpass-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=proofpass_dev \
  -p 5432:5432 \
  -d postgres:14-alpine

# Wait a few seconds, then run migrations
cd apps/api
npm run db:migrate
```

### 5. Set Up Redis (Optional)

```bash
# With Docker
docker run --name proofpass-redis \
  -p 6379:6379 \
  -d redis:7-alpine

# Or install locally (macOS)
brew install redis
brew services start redis
```

### 6. Build Packages

```bash
# From project root
npm run build:packages

# This builds in order:
# 1. @proofpass/types
# 2. @proofpass/vc-toolkit
# 3. @proofpass/blockchain
# 4. @proofpass/client
# 5. @proofpass/templates
# 6. @proofpass/qr-toolkit
```

### 7. Start Development Servers

#### Terminal 1: API Server

```bash
cd apps/api
npm run dev

# API will be available at http://localhost:3000
# Swagger docs at http://localhost:3000/documentation
```

#### Terminal 2: Platform (Optional)

```bash
cd apps/platform
npm run dev

# Platform will be available at http://localhost:3001
```

#### Terminal 3: Database UI (Optional)

```bash
cd apps/api
npm run db:studio

# Prisma Studio at http://localhost:5555
```

---

## Project Structure

### Monorepo Organization

```
ProofPassPlatform/
├── apps/
│   ├── api/              # Backend API
│   │   ├── src/
│   │   │   ├── config/   # Configuration, database, migrations
│   │   │   ├── middleware/ # Express/Fastify middleware
│   │   │   ├── modules/  # Feature modules (routes + services)
│   │   │   ├── queue/    # Background job processing
│   │   │   ├── telemetry/ # OpenTelemetry setup
│   │   │   ├── utils/    # Utility functions
│   │   │   └── main.ts   # Entry point
│   │   └── __tests__/    # Tests
│   │
│   └── platform/         # Frontend Dashboard
│       ├── app/          # Next.js App Router
│       ├── components/   # React components
│       ├── lib/          # Client libraries
│       └── __tests__/    # Frontend tests
│
├── packages/             # Shared packages
│   ├── types/            # TypeScript types
│   ├── vc-toolkit/       # W3C VC implementation
│   ├── zk-toolkit/       # Zero-knowledge proofs
│   ├── blockchain/       # Multi-chain integration
│   ├── client/           # JavaScript SDK
│   ├── templates/        # Credential templates
│   └── qr-toolkit/       # QR code generation
│
├── scripts/              # Utility scripts
├── docs/                 # Documentation
└── examples/             # Example implementations
```

### Key Directories Explained

**`apps/api/src/modules/`**
Each module follows this structure:
```
module-name/
├── routes.ts       # HTTP routes
├── service.ts      # Business logic
├── types.ts        # Module-specific types
└── __tests__/      # Module tests
```

**`packages/`**
Each package is independently buildable and testable:
```
package-name/
├── src/            # Source code
├── dist/           # Built output
├── __tests__/      # Tests
├── package.json    # Dependencies
└── tsconfig.json   # TypeScript config
```

---

## Development Workflow

### 1. Create a Feature Branch

```bash
git checkout -b feat/your-feature-name
```

Branch naming conventions:
- `feat/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Test additions/changes
- `chore/` - Maintenance tasks

### 2. Make Changes

Follow the [Coding Standards](#coding-standards) section.

### 3. Run Tests

```bash
# Run all tests
npm test

# Run specific package tests
cd packages/vc-toolkit
npm test

# Run with coverage
npm run test:coverage
```

### 4. Lint and Format

```bash
# Check linting
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

### 5. Commit Changes

We use [Conventional Commits](https://www.conventionalcommits.org/):

```bash
git add .
git commit -m "feat(module): add new feature"

# Types: feat, fix, docs, style, refactor, test, chore
# Scope: module name or area affected
```

### 6. Push and Create PR

```bash
git push origin feat/your-feature-name

# Then create a Pull Request on GitHub
# Use the PR template to provide all necessary information
```

---

## Coding Standards

### TypeScript

**Type Safety:**
```typescript
// ✅ Good - Explicit types
function processAttestation(data: CreateAttestationDTO): Promise<Attestation> {
  // ...
}

// ❌ Bad - Implicit any
function processAttestation(data): Promise<any> {
  // ...
}
```

**Interfaces vs Types:**
```typescript
// ✅ Use interfaces for object shapes
interface User {
  id: string;
  email: string;
}

// ✅ Use types for unions, intersections, primitives
type Status = 'active' | 'inactive' | 'pending';
type UserWithStatus = User & { status: Status };
```

**Null Safety:**
```typescript
// ✅ Good - Handle null/undefined
const user = await getUser(id);
if (!user) {
  throw new NotFoundError('User not found');
}
return user.email;

// ❌ Bad - No null check
const user = await getUser(id);
return user.email; // Potential null reference error
```

### Code Organization

**File Naming:**
- Use kebab-case for files: `user-service.ts`
- Use PascalCase for classes: `UserService`
- Use camelCase for functions: `getUserById`

**Exports:**
```typescript
// ✅ Named exports (preferred)
export function createUser() { }
export class UserService { }

// ⚠️ Default exports (use sparingly)
export default UserService;
```

### Error Handling

```typescript
// ✅ Custom error classes
import { NotFoundError, ValidationError } from './errors';

async function getUser(id: string): Promise<User> {
  const user = await db.users.findById(id);
  if (!user) {
    throw new NotFoundError(`User ${id} not found`);
  }
  return user;
}

// ✅ Proper error propagation
try {
  const user = await getUser(id);
  return user;
} catch (error) {
  if (error instanceof NotFoundError) {
    return reply.code(404).send({ error: error.message });
  }
  throw error; // Re-throw unexpected errors
}
```

### Async/Await

```typescript
// ✅ Good - Async/await
async function createAttestation(data: CreateAttestationDTO) {
  const validated = await validateInput(data);
  const vc = await generateVC(validated);
  const result = await db.attestations.create(vc);
  return result;
}

// ❌ Bad - Callback hell
function createAttestation(data, callback) {
  validateInput(data, (err, validated) => {
    if (err) return callback(err);
    generateVC(validated, (err, vc) => {
      if (err) return callback(err);
      db.attestations.create(vc, callback);
    });
  });
}
```

---

## Testing

### Test Structure

```typescript
describe('AttestationService', () => {
  // Setup
  let service: AttestationService;

  beforeEach(() => {
    service = new AttestationService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createAttestation', () => {
    it('should create attestation with valid data', async () => {
      // Arrange
      const input = { /* ... */ };

      // Act
      const result = await service.createAttestation(input);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toMatch(/^[a-f0-9-]+$/);
    });

    it('should throw ValidationError for invalid data', async () => {
      // Arrange
      const invalid = { /* ... */ };

      // Act & Assert
      await expect(
        service.createAttestation(invalid)
      ).rejects.toThrow(ValidationError);
    });
  });
});
```

### Running Tests

```bash
# All tests
npm test

# Watch mode (during development)
npm run test:watch

# With coverage
npm run test:coverage

# Specific file
npm test -- path/to/test.test.ts

# Update snapshots
npm test -- -u
```

### Coverage Requirements

- Minimum 85% coverage on all metrics
- New code must maintain or improve coverage
- Check coverage report: `open coverage/lcov-report/index.html`

---

## Debugging

### VS Code Debug Configuration

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug API",
      "program": "${workspaceFolder}/apps/api/src/main.ts",
      "runtimeArgs": ["-r", "ts-node/register"],
      "env": {
        "NODE_ENV": "development"
      },
      "console": "integratedTerminal"
    },
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Tests",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": ["--runInBand", "--no-cache"],
      "console": "integratedTerminal"
    }
  ]
}
```

### Logging

```typescript
// Use the built-in logger
import { logger } from './utils/logger';

logger.info('Processing attestation', { attestationId: id });
logger.error('Failed to create attestation', { error, userId });
logger.debug('Database query', { query, params });
```

### Database Debugging

```bash
# View all queries
DATABASE_LOGGING=true npm run dev

# Use Prisma Studio
npm run db:studio

# Raw SQL
psql proofpass_dev -c "SELECT * FROM attestations LIMIT 10;"
```

---

## Common Tasks

### Adding a New API Endpoint

1. Create route in `apps/api/src/modules/[module]/routes.ts`
2. Add business logic in `service.ts`
3. Define types in `types.ts`
4. Add validation schema (Zod)
5. Write tests
6. Update API documentation

### Adding a New Package

```bash
# Create package directory
mkdir -p packages/new-package/src

# Create package.json
cd packages/new-package
npm init -y

# Update package.json with proper config
# Add to root package.json workspaces if needed
# Build: npm run build
```

### Running Database Migrations

```bash
# Create migration
cd apps/api
npx prisma migrate dev --name migration_name

# Apply migrations
npm run db:migrate

# Reset database (WARNING: deletes all data)
npm run db:reset
```

### Updating Dependencies

```bash
# Check outdated packages
npm outdated

# Update specific package
npm update package-name

# Update all packages (use with caution)
npm update

# Security audit
npm audit
npm audit fix
```

---

## Troubleshooting

### Port Already in Use

```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>
```

### Module Not Found

```bash
# Rebuild packages
npm run build:packages

# Clear node_modules and reinstall
rm -rf node_modules
npm install
```

### Database Connection Issues

```bash
# Check PostgreSQL is running
pg_isready

# Test connection
psql -U postgres -d proofpass_dev -c "SELECT 1;"

# Check connection string in .env
echo $DATABASE_URL
```

### Redis Connection Issues

```bash
# Check Redis is running
redis-cli ping
# Should return: PONG

# If not running (macOS)
brew services start redis

# Docker
docker ps | grep redis
```

### TypeScript Errors

```bash
# Regenerate types
cd apps/api
npx prisma generate

# Clean build
npm run clean
npm run build:packages
```

### Test Failures

```bash
# Clear Jest cache
npm test -- --clearCache

# Run tests in band (no parallel)
npm test -- --runInBand

# Verbose output
npm test -- --verbose
```

---

## Additional Resources

- [Contributing Guidelines](CONTRIBUTING.md)
- [API Architecture](API_ARCHITECTURE.md)
- [Production Readiness Guide](PRODUCTION_READINESS.md)
- [Security Documentation](docs/SECURITY.md)
- [API Reference](docs/API_REFERENCE.md)

---

## Getting Help

- **GitHub Discussions**: Ask questions and discuss ideas
- **GitHub Issues**: Report bugs or request features
- **Email**: fboiero@frvm.utn.edu.ar

---

**Happy coding!**

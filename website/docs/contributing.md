# Contributing to ProofPass Platform

Thank you for your interest in contributing to ProofPass! This Digital Public Good aims to provide transparent, verifiable attestation and proof systems for global benefit.

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [How Can I Contribute?](#how-can-i-contribute)
3. [Development Setup](#development-setup)
4. [Coding Standards](#coding-standards)
5. [Commit Guidelines](#commit-guidelines)
6. [Pull Request Process](#pull-request-process)
7. [Testing Requirements](#testing-requirements)
8. [Documentation](#documentation)
9. [Community](#community)

---

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to fboiero@frvm.utn.edu.ar.

---

## How Can I Contribute?

### 🐛 Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates.

**When creating a bug report, include:**
- Clear and descriptive title
- Steps to reproduce the problem
- Expected behavior
- Actual behavior
- Screenshots (if applicable)
- Environment details (OS, Node version, etc.)
- Any relevant logs or error messages

**Example:**
```markdown
### Bug: Rate limiting not working for unauthenticated requests

**Steps to reproduce:**
1. Make 150 requests to /api/v1/health without authentication
2. All requests succeed (should be limited to 100/min)

**Expected:** Requests 101+ should return 429 Too Many Requests
**Actual:** All 150 requests return 200 OK

**Environment:**
- OS: Ubuntu 22.04
- Node: 18.18.0
- Redis: 7.2.0
```

### 💡 Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

- Use a clear and descriptive title
- Provide a step-by-step description of the suggested enhancement
- Explain why this enhancement would be useful to most ProofPass users
- List any similar features in other projects (if applicable)

### 📝 Improving Documentation

Documentation improvements are always welcome! This includes:
- Fixing typos or clarifying existing docs
- Adding missing documentation
- Translating documentation to other languages
- Creating tutorials or guides
- Improving code comments

### 🔧 Code Contributions

We welcome code contributions! See the sections below for technical details.

---

## Development Setup

### Prerequisites

- Node.js 18.18.0 or higher
- npm 8.0 or higher
- PostgreSQL 15+
- Redis 7+
- Git

### Initial Setup

1. **Fork and clone the repository**

```bash
git clone https://github.com/YOUR_USERNAME/ProofPassPlatform.git
cd ProofPassPlatform
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

```bash
cp .env.example .env
```

Edit `.env` with your local configuration:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/proofpass_dev
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-development-secret-min-32-chars
API_KEY_SALT=your-development-salt-min-32-chars
NODE_ENV=development
LOG_LEVEL=debug
```

4. **Set up the database**

```bash
# Create database
createdb proofpass_dev

# Run migrations
cd apps/api
npm run migrate
```

5. **Build packages**

```bash
npm run build
```

6. **Run tests to verify setup**

```bash
npm test
```

7. **Start development server**

```bash
cd apps/api
npm run dev
```

The API should now be running at `http://localhost:3000`

---

## Coding Standards

### TypeScript

- **Strict mode enabled** - No `any` types unless absolutely necessary
- **Explicit return types** - Always define function return types
- **Interface over type** - Use `interface` for object shapes, `type` for unions
- **Meaningful names** - Use descriptive variable and function names

**Good Example:**
```typescript
export async function createAttestation(
  data: CreateAttestationDTO,
  userId: string
): Promise<Attestation> {
  // Implementation
}
```

**Bad Example:**
```typescript
export async function create(d: any, u: string) {
  // Implementation
}
```

### Code Style

We use ESLint and Prettier for code formatting:

```bash
# Check linting
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Format code
npm run format
```

**Key Rules:**
- Indentation: 2 spaces
- Quotes: Single quotes for strings
- Semicolons: Required
- Line length: 100 characters max
- Trailing commas: Required for multi-line

### Architecture Patterns

Follow the established patterns:

1. **Layered Architecture**
   - Routes → Services → Data Access
   - No business logic in routes
   - No database queries in routes

2. **Dependency Injection**
   - Pass dependencies as parameters
   - Avoid global state

3. **Error Handling**
   - Use custom error classes
   - Never expose internal errors to clients

4. **Security First**
   - Validate all inputs
   - Sanitize outputs
   - Use parameterized queries
   - Follow principle of least privilege

See [API_ARCHITECTURE.md](API_ARCHITECTURE.md) for detailed architectural guidelines.

---

## Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/):

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring (no functional changes)
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `build`: Build system changes
- `ci`: CI/CD changes
- `chore`: Other changes (dependencies, etc.)

### Examples

**Feature:**
```
feat(zkp): add range proof circuit

Implement range proof generation and verification for ZK proofs.
The circuit validates that a value falls within a specified range
without revealing the actual value.

Closes #123
```

**Bug Fix:**
```
fix(rate-limit): correct Redis key expiration

Redis keys were not expiring correctly, causing rate limits to
persist indefinitely. Fixed by using pExpire with milliseconds.

Fixes #456
```

**Documentation:**
```
docs(security): add SQL injection prevention guide

Add detailed documentation on how ProofPass prevents SQL injection
attacks through parameterized queries and input validation.
```

---

## Pull Request Process

### Before Submitting

1. **Create a feature branch**
   ```bash
   git checkout -b feat/my-feature
   ```

2. **Make your changes**
   - Write clean, well-documented code
   - Follow coding standards
   - Add tests for new functionality

3. **Run the full test suite**
   ```bash
   npm test
   ```

4. **Build the project**
   ```bash
   npm run build
   ```

5. **Update documentation**
   - Update README if needed
   - Add JSDoc comments
   - Update API docs if endpoints changed

6. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat(scope): descriptive message"
   ```

### Submitting the Pull Request

1. **Push to your fork**
   ```bash
   git push origin feat/my-feature
   ```

2. **Create Pull Request on GitHub**

3. **Fill out the PR template**

   ```markdown
   ## Description
   Brief description of what this PR does.

   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   - [ ] Documentation update

   ## Testing
   - [ ] All tests pass
   - [ ] Added new tests for this feature
   - [ ] Manual testing completed

   ## Checklist
   - [ ] Code follows style guidelines
   - [ ] Self-review completed
   - [ ] Documentation updated
   - [ ] No new warnings generated
   - [ ] Tests added/updated
   ```

### Review Process

1. **Automated Checks**
   - CI/CD pipeline runs tests
   - Linting checks
   - Build verification

2. **Code Review**
   - At least one maintainer will review
   - Address review comments
   - Update PR as needed

3. **Approval and Merge**
   - Once approved, maintainers will merge
   - Squash commits if necessary
   - Delete feature branch

---

## Testing Requirements

### Test Coverage

- **Minimum 85% coverage** for new code
- All new features must have tests
- Bug fixes must include regression tests

### Test Types

1. **Unit Tests**
   - Test individual functions
   - Mock external dependencies
   - Fast execution

2. **Integration Tests**
   - Test complete flows
   - Use real database (test instance)
   - Test API endpoints

3. **Test Naming**

   ```typescript
   describe('Component/Feature', () => {
     describe('methodName', () => {
       it('should do something specific', () => {
         // Test implementation
       });

       it('should handle error case', () => {
         // Test implementation
       });
     });
   });
   ```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test path/to/test.test.ts

# Run with coverage
npm run test:coverage

# Watch mode (development)
npm run test:watch
```

---

## Documentation

### Code Documentation

Use JSDoc comments for all public APIs:

```typescript
/**
 * Creates a new attestation and anchors it to the blockchain
 *
 * @param data - Attestation data including type and claims
 * @param userId - ID of the user creating the attestation
 * @returns Promise resolving to the created attestation
 * @throws {ValidationError} If attestation data is invalid
 * @throws {InternalError} If blockchain anchoring fails
 *
 * @example
 * ```typescript
 * const attestation = await createAttestation({
 *   type: 'certification',
 *   claims: { certId: 'CERT-123' }
 * }, userId);
 * ```
 */
export async function createAttestation(
  data: CreateAttestationDTO,
  userId: string
): Promise<Attestation> {
  // Implementation
}
```

### Documentation Files

- **README.md** - Project overview and quick start
- **SECURITY.md** - Security best practices
- **API_ARCHITECTURE.md** - System architecture
- **PHASE*_COMPLETE.md** - Development phase reports

---

## Community

### Getting Help

- **GitHub Issues** - Bug reports and feature requests
- **GitHub Discussions** - Questions and general discussion
- **Email** - fboiero@frvm.utn.edu.ar for sensitive issues

### Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Acknowledged in the repository

### Digital Public Good Mission

ProofPass is committed to being a Digital Public Good. By contributing, you're helping create technology that:

- Promotes transparency and trust
- Supports sustainable development goals
- Remains freely available to all
- Protects user privacy and data
- Follows open standards

---

## Questions?

Don't hesitate to ask! We're here to help:

- Open a GitHub Discussion
- Comment on relevant issues
- Email the maintainers

**Thank you for contributing to ProofPass! 🎉**

---

**License:** This project is licensed under the GNU AGPL-3.0 License - see [LICENSE](LICENSE) for details.

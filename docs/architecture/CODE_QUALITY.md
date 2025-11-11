# Code Quality Standards - ProofPass Platform

This document outlines code quality standards, best practices, and guidelines for maintaining the ProofPass Platform codebase.

## Overview

- ✅ **Test Coverage**: Minimum 85%
- ✅ **TypeScript**: Strict mode enabled
- ✅ **Linting**: ESLint with security plugins
- ✅ **Formatting**: Prettier
- ✅ **Pre-commit**: Automated checks
- ✅ **CI/CD**: GitHub Actions
- ✅ **Security**: Helmet, rate limiting, input validation

## Code Standards

### TypeScript

**Always use strict mode:**

```typescript
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

**Prefer explicit types:**

```typescript
// Good
function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// Avoid
function calculateTotal(items: any): any {
  return items.reduce((sum, item) => sum + item.price, 0);
}
```

**Use interfaces for object shapes:**

```typescript
interface User {
  id: string;
  email: string;
  name: string;
}

function createUser(data: Omit<User, 'id'>): User {
  return {
    id: generateId(),
    ...data,
  };
}
```

### Code Organization

**Module structure:**

```
module/
├── routes.ts        # API routes
├── service.ts       # Business logic
├── types.ts         # Module-specific types
└── __tests__/       # Tests
    ├── service.test.ts
    └── routes.integration.test.ts
```

**Single Responsibility Principle:**

```typescript
// Good - Each function does one thing
async function findUser(id: string): Promise<User | null> {
  return query('SELECT * FROM users WHERE id = $1', [id]);
}

async function validateUser(user: User): Promise<boolean> {
  return user.email && user.name.length > 0;
}

// Avoid - Function does too much
async function findAndValidateUser(id: string) {
  const user = await query('SELECT * FROM users WHERE id = $1', [id]);
  if (!user.email || user.name.length === 0) {
    throw new Error('Invalid user');
  }
  return user;
}
```

### Error Handling

**Always handle errors explicitly:**

```typescript
// Good
async function fetchData(): Promise<Data> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    logger.error('Failed to fetch data', error);
    throw new Error('Data fetch failed');
  }
}

// Avoid
async function fetchData() {
  const response = await fetch(url);
  return response.json();
}
```

**Custom error classes:**

```typescript
class ValidationError extends Error {
  constructor(message: string, public field: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Usage
if (!email.includes('@')) {
  throw new ValidationError('Invalid email format', 'email');
}
```

### Async/Await

**Prefer async/await over promises:**

```typescript
// Good
async function processUser(id: string): Promise<void> {
  const user = await findUser(id);
  await updateUser(user);
  await sendNotification(user);
}

// Avoid
function processUser(id: string): Promise<void> {
  return findUser(id)
    .then((user) => updateUser(user))
    .then((user) => sendNotification(user));
}
```

## Testing Standards

### Test Coverage

**Minimum 85% coverage for:**
- Statements
- Branches
- Functions
- Lines

Run: `npm run test:coverage`

### Test Structure

```typescript
describe('Module Name', () => {
  // Setup
  beforeAll(() => {});
  beforeEach(() => {});
  afterEach(() => {});
  afterAll(() => {});

  describe('functionName', () => {
    it('should handle normal case', () => {});
    it('should handle edge case', () => {});
    it('should handle error case', () => {});
  });
});
```

### TDD Workflow

1. **Write failing test**
2. **Write minimum code to pass**
3. **Refactor**
4. **Repeat**

```typescript
// 1. Write test first
it('should calculate total price', () => {
  const items = [{ price: 10 }, { price: 20 }];
  expect(calculateTotal(items)).toBe(30);
});

// 2. Implement function
function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// 3. Refactor if needed
```

## Linting & Formatting

### ESLint Rules

**Security-focused linting:**

```javascript
// .eslintrc.js
rules: {
  '@typescript-eslint/no-explicit-any': 'warn',
  '@typescript-eslint/no-floating-promises': 'error',
  'security/detect-non-literal-fs-filename': 'warn',
  'no-console': ['warn', { allow: ['warn', 'error'] }],
}
```

### Running Linters

```bash
# Lint all files
npm run lint

# Lint and fix
npm run lint:fix

# Format code
npm run format

# Check formatting
npm run format:check
```

### Pre-commit Hooks

Automatically runs on `git commit`:
- Lint and fix TypeScript files
- Format code with Prettier
- Run tests for changed files
- Validate commit message

## Documentation Standards

### JSDoc Comments

**Functions:**

```typescript
/**
 * Creates a new attestation with W3C Verifiable Credential
 *
 * @param data - Attestation creation data
 * @param userId - ID of the user creating the attestation
 * @returns Promise resolving to created attestation
 * @throws {ValidationError} If data is invalid
 * @throws {DatabaseError} If database operation fails
 *
 * @example
 * ```typescript
 * const attestation = await createAttestation({
 *   subject: 'PROD-001',
 *   type: 'QualityTest',
 *   claims: { result: 'pass' }
 * }, 'user-123');
 * ```
 */
async function createAttestation(
  data: CreateAttestationDTO,
  userId: string
): Promise<Attestation> {
  // Implementation
}
```

**Interfaces:**

```typescript
/**
 * Represents a verifiable attestation
 *
 * @property id - Unique attestation identifier
 * @property issuer_did - DID of the attestation issuer
 * @property subject - Subject of the attestation (e.g., product ID)
 * @property claims - Flexible claims data
 * @property status - Current attestation status
 */
interface Attestation {
  id: string;
  issuer_did: string;
  subject: string;
  claims: Record<string, any>;
  status: AttestationStatus;
}
```

### Code Comments

**When to comment:**
- Complex algorithms
- Business logic rationale
- Security considerations
- Performance optimizations
- Workarounds for bugs

```typescript
// Calculate expiration date (7 days from issuance)
// Required by EU Digital Product Passport regulation
const expirationDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

// Use SHA-256 for credential hashing to ensure
// compatibility with Stellar memo field (32 bytes)
const hash = crypto.createHash('sha256').update(credential).digest('hex');
```

**Avoid obvious comments:**

```typescript
// Bad
const total = price + tax; // Add price and tax

// Good (no comment needed)
const total = price + tax;
```

## Security Standards

### Input Validation

**Always validate user input:**

```typescript
import { z } from 'zod';

const CreateAttestationSchema = z.object({
  subject: z.string().min(1).max(255),
  type: z.string(),
  claims: z.record(z.any()),
});

// Validate
const data = CreateAttestationSchema.parse(request.body);
```

### Sensitive Data

**Never log sensitive data:**

```typescript
// Bad
logger.info('User login', { email, password });

// Good
logger.info('User login attempt', { email });
```

**Hash passwords:**

```typescript
import bcrypt from 'bcrypt';

const hash = await bcrypt.hash(password, 10);
```

### SQL Injection Prevention

**Use parameterized queries:**

```typescript
// Good
await query('SELECT * FROM users WHERE email = $1', [email]);

// Never
await query(`SELECT * FROM users WHERE email = '${email}'`);
```

## Performance Standards

### Database Queries

**Use indexes:**

```sql
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_attestations_user ON attestations(user_id);
```

**Avoid N+1 queries:**

```typescript
// Bad - N+1 queries
for (const user of users) {
  const attestations = await getAttestations(user.id);
}

// Good - Single query
const attestations = await getAttestationsByUsers(userIds);
```

### Caching

**Cache frequently accessed data:**

```typescript
// Cache with Redis
await redisClient.setEx(`user:${id}`, 3600, JSON.stringify(user));

const cached = await redisClient.get(`user:${id}`);
if (cached) return JSON.parse(cached);
```

## Git Workflow

### Commit Messages

**Format:** `<type>(<scope>): <description>`

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructuring
- `test`: Tests
- `chore`: Maintenance

**Examples:**
```
feat(api): add user authentication
fix(vc): resolve signature verification bug
docs(readme): update deployment instructions
test(auth): add integration tests for login
```

### Branching

- `main` - Production
- `develop` - Development
- `feature/*` - New features
- `fix/*` - Bug fixes
- `hotfix/*` - Production hotfixes

## CI/CD Pipeline

### Automated Checks

Every push and PR runs:
1. ✅ Linting (ESLint)
2. ✅ Unit tests
3. ✅ Integration tests
4. ✅ Coverage check (≥85%)
5. ✅ Security audit
6. ✅ Docker build
7. ✅ CodeQL analysis

### Required for Merge

- All tests pass
- Coverage ≥85%
- No linting errors
- Security audit passes
- Code review approved

## Code Review Checklist

### Reviewer Checklist

- [ ] Code follows style guide
- [ ] Tests are comprehensive
- [ ] No security vulnerabilities
- [ ] Documentation is clear
- [ ] No performance issues
- [ ] Error handling is proper
- [ ] TypeScript types are correct
- [ ] Commit messages are clear

### Author Checklist

Before requesting review:
- [ ] All tests pass locally
- [ ] Coverage ≥85%
- [ ] Linting passes
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Commit messages follow format

## Continuous Improvement

### Weekly

- Review test coverage reports
- Address linting warnings
- Update dependencies
- Review security audit results

### Monthly

- Refactor technical debt
- Update documentation
- Review and improve tests
- Performance profiling

### Quarterly

- Review and update standards
- Team retrospective
- Tooling evaluation
- Major dependency updates

## Tools & Resources

### Development Tools

- **VS Code Extensions:**
  - ESLint
  - Prettier
  - Jest Runner
  - GitLens

- **CLI Tools:**
  - `npm run lint` - Lint code
  - `npm run test` - Run tests
  - `npm run format` - Format code

### Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Jest Documentation](https://jestjs.io/)
- [ESLint Rules](https://eslint.org/docs/rules/)
- [Security Best Practices](https://cheatsheetseries.owasp.org/)

---

**Remember: Code quality is everyone's responsibility!**

Write clean code • Test thoroughly • Document clearly • Review carefully

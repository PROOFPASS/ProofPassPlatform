# Maintainable Tests Guide

## Overview

This project uses a comprehensive testing infrastructure designed for long-term maintainability.

## Test Helpers Architecture

### 📁 Test Helpers Structure

```
apps/api/__tests__/helpers/
├── factories.ts        # Data factories with builders
├── db-helpers.ts       # Database test utilities
├── mock-helpers.ts     # Reusable mocks
├── test-setup.ts       # Common setup/teardown
└── index.ts           # Central exports
```

## 1. Factories Pattern

**Purpose:** Create test data with sensible defaults, allowing overrides only where needed.

### Using Factories

```typescript
import { UserFactory, AttestationFactory } from '../helpers';

// Create with defaults
const user = UserFactory.build();

// Override specific fields
const admin = UserFactory.build({
  email: 'admin@example.com',
  organization: 'Admin Org'
});

// Create multiple instances
const users = UserFactory.buildMany(5);

// Each user gets unique IDs and emails automatically
```

### Available Factories

- **UserFactory** - Test users with unique emails
- **AttestationFactory** - Test attestations
- **CreateAttestationDTOFactory** - DTOs for API requests
- **VerifiableCredentialFactory** - W3C VCs

### Benefits

✅ **DRY** - No repeated test data creation
✅ **Consistent** - Same defaults everywhere
✅ **Flexible** - Easy to override specific fields
✅ **Maintainable** - Change defaults in one place

## 2. Database Helpers

**Purpose:** Simplify database operations in tests.

### Available Helpers

```typescript
import { createTestPool, cleanDatabase, createTestUser } from '../helpers/db-helpers';

describe('Integration Test', () => {
  let pool;

  beforeAll(async () => {
    pool = createTestPool();
  });

  beforeEach(async () => {
    // Clean slate for each test
    await cleanDatabase(pool);
  });

  afterAll(async () => {
    await closeTestPool();
  });

  it('should work with database', async () => {
    const user = await createTestUser(pool, {
      email: 'test@example.com',
      password_hash: 'hashed',
      name: 'Test',
      api_key_hash: 'hashed',
    });

    expect(user.id).toBeDefined();
  });
});
```

### Database Utilities

- `createTestPool()` - Create isolated test database connection
- `closeTestPool()` - Clean up connections
- `cleanDatabase()` - Remove all test data
- `createTestUser()` - Insert test user
- `createTestAttestation()` - Insert test attestation
- `waitFor()` - Async operation delays
- `retryOperation()` - Retry flaky operations

## 3. Mock Helpers

**Purpose:** Reusable mocks for external dependencies.

### Using Mocks

```typescript
import { mockStellarClient, mockQuery, resetAllMocks } from '../helpers/mock-helpers';

// Mock Stellar operations
mockStellarClient.anchorData.mockResolvedValue({
  txHash: 'test-hash',
  sequence: '123',
  fee: '100',
  timestamp: new Date(),
});

// Mock database queries
mockQuery.mockResolvedValueOnce({
  rows: [{ id: 1, name: 'Test' }]
});

// Reset between tests
beforeEach(() => {
  resetAllMocks();
});
```

### Available Mocks

- `mockStellarClient` - Blockchain operations
- `mockQuery` - Database queries
- `mockRedisClient` - Cache operations
- `createMockFastify()` - API server
- `createMockJWT()` - Authentication tokens

### Mock Utilities

- `resetAllMocks()` - Clear all mocks
- `mockDbSuccess()` - Mock successful query
- `mockDbError()` - Mock database error
- `mockEnv()` - Mock environment variables

## 4. Test Setup/Teardown

**Purpose:** Consistent test initialization and cleanup.

### Global Setup

```typescript
import { setupTest, cleanupTest } from '../helpers/test-setup';

beforeEach(() => {
  setupTest();
});

afterEach(() => {
  cleanupTest();
});
```

### What It Does

**setupTest():**
- Resets factory counters
- Clears all mocks
- Sets NODE_ENV=test

**cleanupTest():**
- Clears timers
- Clears mocks
- Resets state

## Writing Maintainable Tests

### ✅ DO: Use Factories

```typescript
// Good - Uses factory
it('should create user', () => {
  const user = UserFactory.build();
  expect(user.email).toContain('@example.com');
});

// Bad - Manual data creation
it('should create user', () => {
  const user = {
    id: 'user-1',
    email: 'test@example.com',
    password_hash: '$2b$10$...',
    name: 'Test',
    // ... lots of fields
  };
  expect(user.email).toContain('@example.com');
});
```

### ✅ DO: Use Helpers

```typescript
// Good - Uses helper
beforeEach(async () => {
  await cleanDatabase(pool);
});

// Bad - Manual cleanup
beforeEach(async () => {
  await pool.query('DELETE FROM users');
  await pool.query('DELETE FROM attestations');
  // ... many more tables
});
```

### ✅ DO: Use Descriptive Names

```typescript
// Good
it('should reject login with invalid password', async () => {
  const user = UserFactory.build();
  const result = await login(user.email, 'wrong-password');
  expect(result).toBeNull();
});

// Bad
it('test login', async () => {
  // What is being tested?
});
```

### ✅ DO: Test One Thing

```typescript
// Good - Tests one concept
it('should hash password before storing', async () => {
  const plaintext = 'password123';
  const hashed = await hashPassword(plaintext);
  expect(hashed).not.toBe(plaintext);
});

it('should verify correct password', async () => {
  const plaintext = 'password123';
  const hashed = await hashPassword(plaintext);
  const valid = await comparePassword(plaintext, hashed);
  expect(valid).toBe(true);
});

// Bad - Tests multiple things
it('should hash and verify password', async () => {
  const plaintext = 'password123';
  const hashed = await hashPassword(plaintext);
  expect(hashed).not.toBe(plaintext);
  const valid = await comparePassword(plaintext, hashed);
  expect(valid).toBe(true);
});
```

## Test Organization

### Recommended Structure

```typescript
describe('Module/Class Name', () => {
  // Setup
  beforeAll(() => {
    // One-time setup
  });

  beforeEach(() => {
    setupTest();
  });

  afterEach(() => {
    cleanupTest();
  });

  afterAll(() => {
    // One-time cleanup
  });

  describe('functionName', () => {
    it('should handle normal case', () => {});
    it('should handle edge case', () => {});
    it('should handle error case', () => {});
  });

  describe('anotherFunction', () => {
    it('should...', () => {});
  });
});
```

## Common Patterns

### Testing Async Functions

```typescript
it('should complete async operation', async () => {
  const result = await someAsyncFunction();
  expect(result).toBeDefined();
});

it('should handle async errors', async () => {
  await expect(failingAsyncFunction()).rejects.toThrow('Expected error');
});
```

### Testing with Timeouts

```typescript
it('should complete within timeout', async () => {
  await waitFor(100);
  const result = await quickOperation();
  expect(result).toBeDefined();
}, 5000); // 5 second timeout
```

### Testing Retry Logic

```typescript
it('should retry failed operations', async () => {
  let attempts = 0;
  const operation = async () => {
    attempts++;
    if (attempts < 3) throw new Error('Fail');
    return 'success';
  };

  const result = await retryOperation(operation, 3, 10);
  expect(result).toBe('success');
  expect(attempts).toBe(3);
});
```

## Debugging Tests

### Run Single Test

```bash
npm test -- -t "should create user"
```

### Run Single File

```bash
npm test -- auth.test.ts
```

### Debug Mode

```bash
npm test -- --detectOpenHandles --forceExit
```

### Verbose Output

```bash
npm test -- --verbose
```

## Maintaining Test Quality

### Regular Tasks

**Weekly:**
- Review test coverage
- Refactor duplicate code into helpers
- Update test documentation

**Monthly:**
- Review slow tests
- Update dependencies
- Clean up obsolete mocks

### Test Health Metrics

Monitor:
- Coverage percentage (target: 85%+)
- Test execution time
- Flaky test rate
- Mock usage patterns

## Best Practices Checklist

- [ ] Uses factories for test data
- [ ] Uses helpers for common operations
- [ ] Has descriptive test names
- [ ] Tests one thing per test
- [ ] Properly set up and tears down
- [ ] Mocks external dependencies
- [ ] Has good coverage
- [ ] Runs fast (<1s per test)
- [ ] No hardcoded values
- [ ] No test interdependencies

## Examples

See these files for reference:
- `apps/api/__tests__/unit/auth.test.ts`
- `apps/api/__tests__/integration/auth.integration.test.ts`
- `packages/vc-toolkit/__tests__/vc-generator.test.ts`

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Testing Best Practices](https://testingjavascript.com/)
- [Factory Pattern](https://github.com/thoughtbot/factory_bot)

---

**Remember: Maintainable tests are tests that are easy to read, write, and modify!**

Use factories • Use helpers • Test one thing • Keep it simple

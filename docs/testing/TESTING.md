# Testing Guide - ProofPass Platform

Complete guide for testing the ProofPass Platform with >85% coverage target.

## Table of Contents

- [Testing Strategy](#testing-strategy)
- [Test Structure](#test-structure)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [Coverage Requirements](#coverage-requirements)
- [CI/CD Integration](#cicd-integration)
- [Best Practices](#best-practices)

## Testing Strategy

ProofPass uses a comprehensive testing strategy:

1. **Unit Tests** - Test individual functions and classes in isolation
2. **Integration Tests** - Test API endpoints with database
3. **E2E Tests** - Test complete user workflows (future)
4. **Security Tests** - Automated security scanning

### Test Coverage Target

**Minimum: 85% coverage across all metrics**

- Statements: ≥85%
- Branches: ≥85%
- Functions: ≥85%
- Lines: ≥85%

## Test Structure

```
ProofPassPlatform/
├── packages/
│   ├── types/__tests__/
│   │   └── types.test.ts
│   ├── stellar-sdk/__tests__/
│   │   └── stellar-client.test.ts
│   └── vc-toolkit/__tests__/
│       ├── vc-generator.test.ts
│       └── vc-verifier.test.ts
├── apps/
│   └── api/__tests__/
│       ├── unit/
│       │   ├── auth.test.ts
│       │   ├── attestations.test.ts
│       │   └── utils.test.ts
│       └── integration/
│           ├── auth.integration.test.ts
│           └── attestations.integration.test.ts
└── jest.config.js
```

## Running Tests

### All Tests

```bash
npm test
```

### Watch Mode (Development)

```bash
npm run test:watch
```

### With Coverage

```bash
npm run test:coverage
```

### CI Mode

```bash
npm run test:ci
```

### Specific Test File

```bash
npm test -- packages/vc-toolkit/__tests__/vc-generator.test.ts
```

### Specific Test Suite

```bash
npm test -- --testNamePattern="VC Generator"
```

## Writing Tests

### Unit Test Example

```typescript
/**
 * Unit tests for VC Generator
 * Tests Verifiable Credential generation and signing
 */

import { createVerifiableCredential } from '../src/vc-generator';

describe('VC Generator', () => {
  describe('createVerifiableCredential', () => {
    it('should create a valid verifiable credential', () => {
      const vc = createVerifiableCredential({
        issuerDID: 'did:proofpass:123',
        subject: { id: 'PRODUCT-001' },
        type: ['QualityTest'],
      });

      expect(vc).toBeDefined();
      expect(vc.type).toContain('VerifiableCredential');
      expect(vc.issuer).toBe('did:proofpass:123');
    });

    it('should handle edge cases', () => {
      // Test edge cases...
    });

    it('should throw on invalid input', () => {
      expect(() => {
        createVerifiableCredential(null as any);
      }).toThrow();
    });
  });
});
```

### Integration Test Example

```typescript
/**
 * Integration tests for Authentication API
 */

import Fastify from 'fastify';
import { authRoutes } from '../../src/modules/auth/routes';

describe('Auth Integration Tests', () => {
  let app;

  beforeAll(async () => {
    app = Fastify();
    await app.register(authRoutes);
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should register a new user', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/register',
      payload: {
        email: 'test@example.com',
        password: 'secure123',
        name: 'Test User',
      },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toHaveProperty('token');
  });
});
```

### Testing Async Code

```typescript
describe('Async Functions', () => {
  it('should handle promises', async () => {
    const result = await someAsyncFunction();
    expect(result).toBeDefined();
  });

  it('should handle rejections', async () => {
    await expect(failingFunction()).rejects.toThrow('Error message');
  });
});
```

### Mocking

```typescript
// Mock external dependencies
jest.mock('../../src/config/database', () => ({
  query: jest.fn(),
}));

import { query } from '../../src/config/database';

describe('With Mocks', () => {
  it('should use mocked database', async () => {
    (query as jest.Mock).mockResolvedValue({ rows: [{ id: 1 }] });

    const result = await someFunction();
    expect(query).toHaveBeenCalledWith('SELECT * FROM users');
  });
});
```

## Coverage Requirements

### Viewing Coverage

After running tests with coverage:

```bash
npm run test:coverage
```

Open `coverage/lcov-report/index.html` in your browser.

### Coverage Threshold

Configured in `jest.config.js`:

```javascript
coverageThreshold: {
  global: {
    branches: 85,
    functions: 85,
    lines: 85,
    statements: 85,
  },
}
```

### What to Test

**Must Test (High Priority):**
- ✅ Business logic functions
- ✅ API endpoints
- ✅ Authentication/authorization
- ✅ Data validation
- ✅ Error handling
- ✅ Security-critical code

**Should Test (Medium Priority):**
- Utility functions
- Data transformations
- Blockchain integration
- VC generation/verification

**Can Skip (Low Priority):**
- Type definitions
- Configuration files
- Simple getters/setters
- Third-party library wrappers

## CI/CD Integration

### GitHub Actions

Tests run automatically on:
- Every push to `main` or `develop`
- Every pull request
- Scheduled weekly security scans

See `.github/workflows/ci.yml` for details.

### Required Checks

Before merging:
- ✅ All tests pass
- ✅ Coverage ≥85%
- ✅ Linting passes
- ✅ Security audit passes
- ✅ Docker image builds

### Pre-commit Hooks

Husky runs automatically:
- **pre-commit**: Lint, format, run related tests
- **commit-msg**: Validate commit message format

## Best Practices

### 1. Test Organization

```typescript
describe('Module Name', () => {
  describe('functionName', () => {
    it('should do something', () => {});
    it('should handle edge case', () => {});
    it('should throw on invalid input', () => {});
  });
});
```

### 2. Test Naming

**Good:**
```typescript
it('should return user when valid ID provided')
it('should throw error when user not found')
it('should hash password before storing')
```

**Bad:**
```typescript
it('test 1')
it('works')
it('check function')
```

### 3. AAA Pattern

```typescript
it('should do something', () => {
  // Arrange
  const input = 'test';
  const expected = 'TEST';

  // Act
  const result = transform(input);

  // Assert
  expect(result).toBe(expected);
});
```

### 4. Test Independence

```typescript
// Good - tests don't depend on each other
describe('User Service', () => {
  beforeEach(() => {
    // Fresh setup for each test
  });

  it('test 1', () => {});
  it('test 2', () => {});
});
```

### 5. Use Descriptive Assertions

```typescript
// Good
expect(user.email).toBe('test@example.com');
expect(errors).toHaveLength(2);
expect(response.statusCode).toBe(201);

// Better with custom matchers
expect(user).toMatchObject({
  email: 'test@example.com',
  name: 'Test User',
});
```

### 6. Test Error Cases

```typescript
it('should handle errors gracefully', async () => {
  await expect(dangerousFunction()).rejects.toThrow('Expected error');
});

it('should return error response', async () => {
  const response = await app.inject({
    method: 'POST',
    url: '/invalid',
  });

  expect(response.statusCode).toBe(400);
  expect(response.json()).toHaveProperty('error');
});
```

### 7. Mock External Dependencies

```typescript
// Mock HTTP requests
jest.mock('node-fetch');

// Mock database
jest.mock('../database');

// Mock time
jest.useFakeTimers();
jest.setSystemTime(new Date('2024-01-01'));
```

## Debugging Tests

### Run Single Test

```bash
npm test -- -t "should create a valid credential"
```

### Debug in VS Code

Add to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand", "--no-cache"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

### Verbose Output

```bash
npm test -- --verbose
```

## Common Issues

### Tests Timing Out

```typescript
// Increase timeout
jest.setTimeout(10000);

// Or per test
it('slow test', async () => {}, 10000);
```

### Database Connection Issues

```typescript
// Use test database
process.env.DATABASE_NAME = 'proofpass_test';

// Clean up after tests
afterAll(async () => {
  await pool.end();
});
```

### Async Issues

```typescript
// Always await or return promises
it('async test', async () => {
  await expect(asyncFn()).resolves.toBe(true);
});
```

## Continuous Improvement

### Weekly Tasks

- Review coverage reports
- Add tests for uncovered code
- Refactor duplicate test code
- Update test documentation

### Monthly Tasks

- Review and update test strategy
- Analyze slow tests and optimize
- Update test dependencies
- Review security test results

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Testing Best Practices](https://testingjavascript.com/)
- [TDD Guide](https://github.com/testdouble/contributing-tests/wiki/Test-Driven-Development)

## Getting Help

- **CI Failures**: Check GitHub Actions logs
- **Coverage Issues**: Run `npm run test:coverage` locally
- **Test Failures**: Use `--verbose` flag for details

---

**Remember: Good tests are as important as good code!**

Target: 85% coverage • Write tests first (TDD) • Keep tests fast • Test behavior, not implementation

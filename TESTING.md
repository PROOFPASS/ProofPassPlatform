# Testing Guide

This guide covers all testing procedures for the ProofPass Platform.

## Table of Contents

- [Overview](#overview)
- [Running Tests](#running-tests)
- [Test Suites](#test-suites)
- [Writing Tests](#writing-tests)
- [CI/CD Integration](#cicd-integration)
- [Troubleshooting](#troubleshooting)

## Overview

ProofPass uses a comprehensive testing strategy:

- **Unit Tests**: Jest for TypeScript/JavaScript code
- **Integration Tests**: End-to-end workflow validation
- **Bash Script Tests**: Shell script validation
- **CLI Tests**: Command-line interface testing

### Test Coverage

Current coverage:
- CLI Tests: 10+ test suites
- Bash Scripts: 34/34 tests (100% pass rate)
- Unit Tests: Core functionality coverage
- Integration Tests: Complete workflows

## Running Tests

### All Tests

```bash
# Run complete test suite
npm test

# Run with coverage report
npm run test:coverage

# Run in watch mode
npm run test:watch

# Run for CI/CD
npm run test:ci
```

### Specific Test Suites

```bash
# CLI tool tests
npm run test:cli

# Bash script tests
npm run test:scripts

# Run both CLI and script tests
npm run test:all

# Blockchain integration tests
npm run test:blockchain
```

### Individual Test Files

```bash
# Run specific test file
npx jest path/to/test.test.ts

# Run tests matching pattern
npx jest --testNamePattern="pattern"

# Run with verbose output
npx jest --verbose
```

## Test Suites

### 1. CLI Tests

Location: `cli/__tests__/proofpass.test.ts`

Tests CLI tool functionality:

```typescript
describe('ProofPass CLI', () => {
  // CLI execution tests
  it('should exist and be executable', () => {
    expect(fs.existsSync(CLI_PATH)).toBe(true);
  });

  // Help command tests
  it('should display help message', (done) => {
    // Async test implementation
  }, 30000);

  // Command validation tests
  it('should list all expected commands', () => {
    // Test 16 available commands
  });
});
```

**What's tested:**
- CLI existence and executability
- Help command output
- All 16 commands are listed
- Status command functionality
- File dependencies
- Command categorization
- Error handling
- npm script integration
- ANSI color output
- Environment validation

### 2. Bash Script Tests

Location: `scripts/__tests__/scripts.test.sh`

Tests shell script integrity:

```bash
# Script existence test
log_test "Testing validate-system.sh existence..."
if [ -f "scripts/validate-system.sh" ]; then
    log_pass "validate-system.sh exists"
fi

# Syntax validation
log_test "Testing validate-system.sh syntax..."
if bash -n scripts/validate-system.sh; then
    log_pass "validate-system.sh has valid syntax"
fi
```

**What's tested:**
- Script existence (3 scripts)
- Bash syntax validation
- Script executability
- Function definitions
- TTY detection
- Docker stderr suppression
- Conditional clear
- Shebangs
- Color definitions
- Logging functions
- Error handling (set -e)

**Test results:**
- 34/34 tests passing
- 100% success rate
- Generates detailed log file

### 3. Unit Tests

Location: Various `__tests__` directories

Standard Jest unit tests for:

```typescript
// Example unit test
describe('VC Toolkit', () => {
  it('should create verifiable credential', async () => {
    const credential = await createVC(data);
    expect(credential).toBeDefined();
    expect(credential.type).toContain('VerifiableCredential');
  });
});
```

### 4. Integration Tests

Location: `examples/demo-client/`

End-to-end workflow testing:

```bash
# Run demo as test
cd examples/demo-client
npm run demo
```

Tests complete workflows:
- Credential issuance
- Verification
- Blockchain anchoring
- API integration

## Writing Tests

### Jest Tests (TypeScript)

```typescript
import { describe, it, expect } from '@jest/globals';

describe('Feature Name', () => {
  // Setup
  beforeEach(() => {
    // Initialization
  });

  // Test case
  it('should do something', () => {
    const result = functionUnderTest();
    expect(result).toBe(expectedValue);
  });

  // Async test
  it('should handle async operations', async () => {
    const result = await asyncFunction();
    expect(result).toBeDefined();
  });

  // Cleanup
  afterEach(() => {
    // Teardown
  });
});
```

### Bash Script Tests

```bash
#!/bin/bash

# Test template
log_test "Testing feature..."
if [ condition ]; then
    log_pass "Feature works"
else
    log_fail "Feature failed"
fi
```

### CLI Tests

```typescript
describe('CLI Command', () => {
  it('should execute command', (done) => {
    const child = spawn('npx', ['tsx', CLI_PATH, 'command'], {
      cwd: ROOT_PATH,
    });

    let output = '';
    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    child.on('close', (code) => {
      expect(code).toBe(0);
      expect(output).toContain('expected text');
      done();
    });
  }, 30000); // 30 second timeout
});
```

## Test Configuration

### jest.config.js

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    }
  },
  collectCoverageFrom: [
    'packages/**/*.ts',
    'apps/**/*.ts',
    '!**/*.d.ts',
    '!**/node_modules/**'
  ]
};
```

### Coverage Reports

```bash
# Generate coverage report
npm run test:coverage

# View HTML report
open coverage/lcov-report/index.html
```

Coverage targets:
- Branches: 85%
- Functions: 85%
- Lines: 85%
- Statements: 85%

## CI/CD Integration

### GitHub Actions

Tests run automatically on:
- Pull requests
- Push to main branch
- Release tags

```yaml
# Example workflow
- name: Run Tests
  run: |
    npm test
    npm run test:scripts
    npm run test:cli
```

### Pre-commit Hooks

```bash
# Runs automatically before commit
npx lint-staged
```

Configured in `package.json`:
```json
{
  "lint-staged": {
    "*.ts": [
      "eslint --fix",
      "prettier --write"
    ]
  }
}
```

## Troubleshooting

### Common Issues

**1. Jest timeout errors**

```bash
# Increase timeout in test
it('long running test', async () => {
  // test code
}, 60000); // 60 seconds
```

**2. Permission errors in bash tests**

```bash
# Make script executable
chmod +x scripts/__tests__/scripts.test.sh
```

**3. Module not found**

```bash
# Rebuild node_modules
rm -rf node_modules package-lock.json
npm install
```

**4. Tests pass locally but fail in CI**

- Check Node.js version (>=20.0.0)
- Verify environment variables
- Check file permissions
- Review CI logs

### Debug Mode

```bash
# Run Jest in debug mode
node --inspect-brk node_modules/.bin/jest --runInBand

# Run with verbose output
npm test -- --verbose

# Run specific test with logs
DEBUG=* npm test -- path/to/test
```

### Test Logs

Bash script tests generate log files:

```bash
# View latest test log
cat scripts-test-*.log | tail -50

# Check for failures
grep FAIL scripts-test-*.log
```

## Best Practices

1. **Descriptive test names**
   ```typescript
   it('should create credential with valid data')
   it('should reject invalid signature')
   ```

2. **One assertion per test** (when possible)
   ```typescript
   it('should return 200 status', () => {
     expect(response.status).toBe(200);
   });
   ```

3. **Use beforeEach/afterEach** for setup/teardown
   ```typescript
   beforeEach(() => {
     // Setup test data
   });
   ```

4. **Mock external dependencies**
   ```typescript
   jest.mock('./external-service');
   ```

5. **Test edge cases**
   - Empty inputs
   - Null/undefined values
   - Error conditions
   - Boundary values

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Testing Best Practices](https://testingjavascript.com/)
- [GitHub Actions](https://docs.github.com/en/actions)

## Quick Reference

```bash
# Essential commands
npm test                  # Run all tests
npm run test:cli         # CLI tests only
npm run test:scripts     # Bash tests only
npm run test:coverage    # With coverage
npm run test:watch       # Watch mode

# Debugging
npm test -- --verbose    # Verbose output
npm test -- --detectOpenHandles  # Find hanging processes

# Coverage
npm run test:coverage    # Generate report
open coverage/lcov-report/index.html  # View report
```

---

**Author**: Fernando Boiero <fboiero@frvm.utn.edu.ar>
**Last Updated**: November 2025

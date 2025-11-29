module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/?(*.)+(spec|test).ts'],
  // Exclude platform tests - they use next/jest and should run with their own config
  testPathIgnorePatterns: ['/node_modules/', '/apps/platform/'],
  transform: {
    '^.+\\.(ts|js)$': 'ts-jest',
  },
  // ESM modules that need to be transformed by Jest
  // Note: packages listed here will NOT be ignored (negative lookahead)
  transformIgnorePatterns: [
    'node_modules/(?!(@noble/ed25519|@noble/curves|@noble/hashes|multiformats|uint8arrays|did-jwt-vc|did-jwt|did-resolver|key-did-resolver|web-did-resolver)/)',
  ],
  collectCoverageFrom: [
    'packages/*/src/**/*.ts',
    'apps/api/src/**/*.ts',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/coverage/**',
  ],
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  },
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
  moduleNameMapper: {
    '^@proofpass/types$': '<rootDir>/packages/types/src',
    '^@proofpass/stellar-sdk$': '<rootDir>/packages/stellar-sdk/src',
    '^@proofpass/vc-toolkit$': '<rootDir>/packages/vc-toolkit/src',
    // Map multiformats subpath exports to CJS versions
    '^multiformats/bases/base58$': '<rootDir>/node_modules/multiformats/cjs/src/bases/base58.js',
    '^multiformats/(.*)$': '<rootDir>/node_modules/multiformats/cjs/src/$1.js',
    // Platform app module resolution
    '^@/(.*)$': '<rootDir>/apps/platform/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testTimeout: 10000,
  verbose: true,
};

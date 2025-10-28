/**
 * Mock Helpers
 * Reusable mocks for external dependencies
 */

/**
 * Mock Stellar client
 */
export const mockStellarClient = {
  anchorData: jest.fn().mockResolvedValue({
    txHash: 'mock-tx-hash-123',
    sequence: '123456',
    fee: '100',
    timestamp: new Date(),
  }),
  getTransaction: jest.fn().mockResolvedValue({
    hash: 'mock-tx-hash-123',
    sequence: '123456',
    sourceAccount: 'GXXXXXX',
    feeCharged: '100',
    operationCount: 1,
    createdAt: new Date(),
    successful: true,
  }),
  getBalance: jest.fn().mockResolvedValue('1000.00'),
  verifyAnchor: jest.fn().mockResolvedValue(true),
  getPublicKey: jest.fn().mockReturnValue('GXXXXXX'),
};

/**
 * Mock database query function
 */
export const mockQuery = jest.fn();

/**
 * Mock Redis client
 */
export const mockRedisClient = {
  get: jest.fn(),
  set: jest.fn(),
  setEx: jest.fn(),
  del: jest.fn(),
  keys: jest.fn(),
  connect: jest.fn(),
  disconnect: jest.fn(),
  isOpen: true,
};

/**
 * Mock Fastify instance for testing
 */
export const createMockFastify = () => ({
  register: jest.fn(),
  listen: jest.fn(),
  close: jest.fn(),
  inject: jest.fn(),
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  jwt: {
    sign: jest.fn().mockReturnValue('mock-jwt-token'),
    verify: jest.fn(),
  },
  log: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
});

/**
 * Reset all mocks
 */
export function resetAllMocks(): void {
  jest.clearAllMocks();
  mockQuery.mockReset();
  mockStellarClient.anchorData.mockReset();
  mockStellarClient.getTransaction.mockReset();
  mockRedisClient.get.mockReset();
  mockRedisClient.set.mockReset();
}

/**
 * Mock successful database response
 */
export function mockDbSuccess(rows: any[]): void {
  mockQuery.mockResolvedValueOnce({ rows, rowCount: rows.length });
}

/**
 * Mock database error
 */
export function mockDbError(error: Error): void {
  mockQuery.mockRejectedValueOnce(error);
}

/**
 * Create a mock JWT token
 */
export function createMockJWT(payload: any): string {
  return `mock.jwt.${Buffer.from(JSON.stringify(payload)).toString('base64')}`;
}

/**
 * Mock environment variables
 */
export function mockEnv(env: Record<string, string>): void {
  Object.entries(env).forEach(([key, value]) => {
    process.env[key] = value;
  });
}

/**
 * Restore environment variables
 */
export function restoreEnv(keys: string[]): void {
  keys.forEach((key) => {
    delete process.env[key];
  });
}

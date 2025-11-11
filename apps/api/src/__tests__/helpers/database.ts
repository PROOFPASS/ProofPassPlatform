/**
 * Database Test Helpers
 */

export const mockQuery = jest.fn();

export const mockPool = {
  query: mockQuery,
  connect: jest.fn().mockResolvedValue({
    query: mockQuery,
    release: jest.fn(),
  }),
  end: jest.fn(),
  on: jest.fn(),
};

export function resetMocks() {
  mockQuery.mockReset();
  mockPool.connect.mockClear();
  mockPool.end.mockClear();
}

export function mockDBResponse(rows: any[] = [], rowCount: number | null = null) {
  mockQuery.mockResolvedValueOnce({
    rows,
    rowCount: rowCount !== null ? rowCount : rows.length,
  });
}

export function mockDBError(error: Error) {
  mockQuery.mockRejectedValueOnce(error);
}

// Mock data factories
export function createMockOrganization(overrides: Partial<any> = {}) {
  return {
    id: 'org-123',
    name: 'Test Organization',
    email: 'test@org.com',
    plan_id: 'plan-free',
    status: 'active',
    billing_email: 'billing@org.com',
    subscription_end: new Date('2024-12-31'),
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

export function createMockAPIKey(overrides: Partial<any> = {}) {
  return {
    id: 'key-123',
    organization_id: 'org-123',
    user_id: 'user-123',
    name: 'Test API Key',
    key_prefix: 'pk_test_',
    key_hash: '$2b$10$test.hash.here',
    is_active: true,
    last_used_at: new Date(),
    created_at: new Date(),
    ...overrides,
  };
}

export function createMockPayment(overrides: Partial<any> = {}) {
  return {
    id: 'payment-123',
    organization_id: 'org-123',
    amount: 49.00,
    currency: 'USD',
    payment_date: new Date(),
    payment_method: 'Transferencia',
    status: 'confirmed',
    created_at: new Date(),
    ...overrides,
  };
}

export function createMockUser(overrides: Partial<any> = {}) {
  return {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    organization_id: 'org-123',
    role: 'owner',
    is_active: true,
    created_at: new Date(),
    ...overrides,
  };
}

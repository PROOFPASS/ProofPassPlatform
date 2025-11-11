/**
 * Redis Test Helpers
 */

export const mockRedis = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  incr: jest.fn(),
  pExpire: jest.fn(),
  ttl: jest.fn(),
  flushdb: jest.fn(),
  quit: jest.fn(),
};

export function resetRedisMocks() {
  Object.values(mockRedis).forEach(mock => mock.mockReset());
}

export function mockRedisGet(key: string, value: any) {
  mockRedis.get.mockImplementation((k: string) => {
    if (k === key) return Promise.resolve(JSON.stringify(value));
    return Promise.resolve(null);
  });
}

export function mockRedisIncr(currentValue: number = 0) {
  let counter = currentValue;
  mockRedis.incr.mockImplementation(() => {
    counter++;
    return Promise.resolve(counter);
  });
}

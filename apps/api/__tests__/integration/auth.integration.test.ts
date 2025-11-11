/**
 * Integration tests for Authentication API
 * Tests complete auth flow with mocked services
 */

import Fastify, { FastifyInstance } from 'fastify';
import { authRoutes } from '../../src/modules/auth/routes';
import jwt from '@fastify/jwt';

// Mock the service layer
jest.mock('../../src/modules/auth/service', () => ({
  register: jest.fn(),
  login: jest.fn(),
}));

// Mock database
jest.mock('../../src/config/database', () => ({
  query: jest.fn(),
  pool: {
    query: jest.fn(),
    on: jest.fn(),
  },
}));

import { register, login } from '../../src/modules/auth/service';

describe('Auth Integration Tests', () => {
  let app: FastifyInstance;
  const mockRegister = register as jest.MockedFunction<typeof register>;
  const mockLogin = login as jest.MockedFunction<typeof login>;

  beforeAll(async () => {
    app = Fastify({ logger: false });
    await app.register(jwt, { secret: 'test-secret' });
    await app.register(authRoutes, { prefix: '/auth' });
    await app.ready();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/register', () => {
    it('should register a new user', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        organization: 'Test Org',
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockRegister.mockResolvedValue({
        token: 'mock-jwt-token',
        user: { ...mockUser, api_key: 'mock-api-key' },
      });

      const response = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: {
          email: `test-${Date.now()}@example.com`,
          password: 'securePassword123!',
          name: 'Test User',
          organization: 'Test Org',
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('token');
      expect(body).toHaveProperty('user');
      expect(body.user.email).toContain('@example.com');
      expect(body.user).not.toHaveProperty('password_hash');
    });

    it('should reject registration with invalid email', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: {
          email: 'invalid-email',
          password: 'securePassword123!',
          name: 'Test User',
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should reject registration with short password', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: {
          email: 'test@example.com',
          password: 'short',
          name: 'Test User',
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should reject registration without required fields', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: {
          email: 'test@example.com',
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('POST /auth/login', () => {
    const testEmail = `login-test-${Date.now()}@example.com`;
    const testPassword = 'testPassword123!';

    it('should login with correct credentials', async () => {
      const mockUser = {
        id: 'user-123',
        email: testEmail,
        name: 'Login Test User',
        organization: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockLogin.mockResolvedValue({
        token: 'mock-jwt-token',
        user: mockUser as any,
      });

      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email: testEmail,
          password: testPassword,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('token');
      expect(body.user.email).toBe(testEmail);
    });

    it('should reject login with wrong password', async () => {
      mockLogin.mockRejectedValue(new Error('Invalid credentials'));

      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email: testEmail,
          password: 'wrongPassword',
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should reject login with non-existent user', async () => {
      mockLogin.mockRejectedValue(new Error('Invalid credentials'));

      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email: 'nonexistent@example.com',
          password: 'password123',
        },
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /auth/me', () => {
    let authToken: string;

    beforeAll(async () => {
      // Create a valid JWT token for testing
      authToken = app.jwt.sign({
        id: 'user-123',
        email: 'me-test@example.com',
        name: 'Me Test User',
      });
    });

    it('should return current user with valid token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/auth/me',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('id');
      expect(body).toHaveProperty('email');
      expect(body).not.toHaveProperty('password_hash');
    });

    it('should reject request without token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/auth/me',
      });

      expect(response.statusCode).toBe(401);
    });

    it('should reject request with invalid token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/auth/me',
        headers: {
          authorization: 'Bearer invalid-token',
        },
      });

      expect(response.statusCode).toBe(401);
    });
  });
});

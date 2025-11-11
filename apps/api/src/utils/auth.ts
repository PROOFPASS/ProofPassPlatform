import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { FastifyRequest } from 'fastify';

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateApiKey(): string {
  return crypto.randomBytes(32).toString('hex');
}

export async function hashApiKey(apiKey: string, salt: string): Promise<string> {
  return crypto
    .createHash('sha256')
    .update(apiKey + salt)
    .digest('hex');
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

export async function authenticate(request: FastifyRequest): Promise<AuthUser> {
  try {
    await request.jwtVerify();
    return request.user as AuthUser;
  } catch (error) {
    throw new Error('Unauthorized');
  }
}

export async function authenticateApiKey(
  request: FastifyRequest,
  apiKeySalt: string
): Promise<string> {
  const apiKey = request.headers['x-api-key'] as string;

  if (!apiKey) {
    throw new Error('API key required');
  }

  const hashedKey = await hashApiKey(apiKey, apiKeySalt);
  return hashedKey;
}

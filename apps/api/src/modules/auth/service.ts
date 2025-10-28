import { query } from '../../config/database';
import { hashPassword, comparePassword, generateApiKey, hashApiKey } from '../../utils/auth';
import { config } from '../../config/env';
import type { CreateUserDTO, LoginDTO, AuthToken } from '@proofpass/types';

export async function register(
  data: CreateUserDTO,
  jwtSign: (payload: any) => string
): Promise<AuthToken> {
  // Check if user exists
  const existingUser = await query('SELECT id FROM users WHERE email = $1', [data.email]);

  if (existingUser.rows.length > 0) {
    throw new Error('User already exists');
  }

  // Hash password
  const passwordHash = await hashPassword(data.password);

  // Generate API key
  const apiKey = generateApiKey();
  const apiKeyHash = await hashApiKey(apiKey, config.auth.apiKeySalt);

  // Insert user
  const result = await query(
    `INSERT INTO users (email, password_hash, name, organization, api_key_hash)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, email, name, organization, created_at`,
    [data.email, passwordHash, data.name, data.organization || null, apiKeyHash]
  );

  const user = result.rows[0];

  // Generate JWT
  const token = jwtSign({
    id: user.id,
    email: user.email,
    name: user.name,
  });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      organization: user.organization,
      api_key: apiKey, // Return the plain API key only on registration
      created_at: user.created_at,
    } as any,
  };
}

export async function login(
  data: LoginDTO,
  jwtSign: (payload: any) => string
): Promise<Omit<AuthToken, 'api_key'>> {
  // Find user
  const result = await query(
    'SELECT id, email, password_hash, name, organization FROM users WHERE email = $1',
    [data.email]
  );

  if (result.rows.length === 0) {
    throw new Error('Invalid credentials');
  }

  const user = result.rows[0];

  // Verify password
  const validPassword = await comparePassword(data.password, user.password_hash);

  if (!validPassword) {
    throw new Error('Invalid credentials');
  }

  // Update last login
  await query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);

  // Generate JWT
  const token = jwtSign({
    id: user.id,
    email: user.email,
    name: user.name,
  });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      organization: user.organization,
    } as any,
  };
}

import dotenv from 'dotenv';

dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),

  db: {
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    database: process.env.DATABASE_NAME || 'proofpass',
    user: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  stellar: {
    network: process.env.STELLAR_NETWORK || 'testnet',
    secretKey: process.env.STELLAR_SECRET_KEY || '',
    publicKey: process.env.STELLAR_PUBLIC_KEY || '',
  },

  optimism: {
    rpcUrl: process.env.OPTIMISM_RPC_URL || '',
    privateKey: process.env.OPTIMISM_PRIVATE_KEY || '',
  },

  auth: {
    jwtSecret: process.env.JWT_SECRET || 'change-this-secret-in-production',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    apiKeySalt: process.env.API_KEY_SALT || 'change-this-salt-in-production',
  },

  app: {
    logLevel: process.env.LOG_LEVEL || 'info',
    corsOrigin: process.env.CORS_ORIGIN || '*',
  },
};

// Validate required environment variables
function validateConfig() {
  const errors: string[] = [];

  if (config.env === 'production') {
    if (!process.env.DATABASE_PASSWORD) {
      errors.push('DATABASE_PASSWORD is required in production');
    }
    if (config.auth.jwtSecret === 'change-this-secret-in-production') {
      errors.push('JWT_SECRET must be set in production');
    }
    if (config.auth.apiKeySalt === 'change-this-salt-in-production') {
      errors.push('API_KEY_SALT must be set in production');
    }
  }

  if (errors.length > 0) {
    console.error('Configuration errors:');
    errors.forEach(err => console.error(`  - ${err}`));
    process.exit(1);
  }
}

validateConfig();

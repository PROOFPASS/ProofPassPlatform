-- Migration 004: Add User Roles and DID Storage
-- This migration adds:
-- 1. Role-based access control (RBAC) for users
-- 2. DID storage table for reusable DIDs

-- Add role column to users table
ALTER TABLE users
ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'user';

-- Create index for role queries
CREATE INDEX idx_users_role ON users(role);

-- Update constraint to ensure valid roles
ALTER TABLE users
ADD CONSTRAINT check_user_role
CHECK (role IN ('user', 'admin', 'superadmin'));

-- Create user_dids table for DID storage and reuse
CREATE TABLE user_dids (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  did VARCHAR(255) NOT NULL UNIQUE,
  did_method VARCHAR(20) NOT NULL,
  public_key TEXT NOT NULL,
  private_key_encrypted TEXT NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_used_at TIMESTAMP WITH TIME ZONE,
  usage_count INTEGER NOT NULL DEFAULT 0
);

-- Create indexes for DID queries
CREATE INDEX idx_user_dids_user ON user_dids(user_id);
CREATE INDEX idx_user_dids_did ON user_dids(did);
CREATE INDEX idx_user_dids_primary ON user_dids(user_id, is_primary) WHERE is_primary = true;

-- Ensure only one primary DID per user
CREATE UNIQUE INDEX idx_user_dids_one_primary
ON user_dids(user_id)
WHERE is_primary = true;

-- Add DID reference to attestations table
ALTER TABLE attestations
ADD COLUMN user_did_id UUID REFERENCES user_dids(id) ON DELETE SET NULL;

CREATE INDEX idx_attestations_user_did ON attestations(user_did_id);

-- Comment on new structures
COMMENT ON COLUMN users.role IS 'User role for RBAC: user, admin, superadmin';
COMMENT ON TABLE user_dids IS 'Stores user DIDs for reuse across attestations';
COMMENT ON COLUMN user_dids.private_key_encrypted IS 'AES-256 encrypted private key';
COMMENT ON COLUMN user_dids.is_primary IS 'Primary DID used for new attestations';

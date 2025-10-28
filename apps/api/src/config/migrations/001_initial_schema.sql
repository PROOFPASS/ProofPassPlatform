-- ProofPass Platform Database Schema
-- Version: 0.1.0

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  organization VARCHAR(255),
  api_key UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
  api_key_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_api_key ON users(api_key);

-- Attestation templates table
CREATE TABLE attestation_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(100) NOT NULL,
  schema JSONB NOT NULL,
  example_claims JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_templates_type ON attestation_templates(type);

-- Attestations table
CREATE TABLE attestations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  issuer_did VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  claims JSONB NOT NULL,
  issued_at TIMESTAMP WITH TIME ZONE NOT NULL,
  credential JSONB NOT NULL,
  blockchain_tx_hash VARCHAR(255),
  blockchain_network VARCHAR(20) NOT NULL DEFAULT 'stellar',
  qr_code TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_attestations_user ON attestations(user_id);
CREATE INDEX idx_attestations_subject ON attestations(subject);
CREATE INDEX idx_attestations_type ON attestations(type);
CREATE INDEX idx_attestations_status ON attestations(status);
CREATE INDEX idx_attestations_tx_hash ON attestations(blockchain_tx_hash);

-- Product passports table
CREATE TABLE product_passports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  aggregated_credential JSONB NOT NULL,
  blockchain_tx_hash VARCHAR(255),
  blockchain_network VARCHAR(20) NOT NULL DEFAULT 'stellar',
  qr_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_passports_user ON product_passports(user_id);
CREATE INDEX idx_passports_product ON product_passports(product_id);
CREATE INDEX idx_passports_tx_hash ON product_passports(blockchain_tx_hash);

-- Passport attestations junction table (many-to-many)
CREATE TABLE passport_attestations (
  passport_id UUID NOT NULL REFERENCES product_passports(id) ON DELETE CASCADE,
  attestation_id UUID NOT NULL REFERENCES attestations(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (passport_id, attestation_id)
);

CREATE INDEX idx_passport_attestations_passport ON passport_attestations(passport_id);
CREATE INDEX idx_passport_attestations_attestation ON passport_attestations(attestation_id);

-- ZK Proofs table
CREATE TABLE zk_proofs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  attestation_id UUID NOT NULL REFERENCES attestations(id) ON DELETE CASCADE,
  circuit_type VARCHAR(50) NOT NULL,
  public_inputs JSONB NOT NULL,
  proof TEXT NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_zkproofs_user ON zk_proofs(user_id);
CREATE INDEX idx_zkproofs_attestation ON zk_proofs(attestation_id);
CREATE INDEX idx_zkproofs_circuit ON zk_proofs(circuit_type);

-- Blockchain transactions table
CREATE TABLE blockchain_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tx_hash VARCHAR(255) UNIQUE NOT NULL,
  network VARCHAR(20) NOT NULL,
  type VARCHAR(50) NOT NULL,
  reference_id UUID NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  block_number BIGINT,
  timestamp TIMESTAMP WITH TIME ZONE,
  fee VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_blockchain_tx_hash ON blockchain_transactions(tx_hash);
CREATE INDEX idx_blockchain_reference ON blockchain_transactions(reference_id);
CREATE INDEX idx_blockchain_status ON blockchain_transactions(status);

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attestations_updated_at BEFORE UPDATE ON attestations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_passports_updated_at BEFORE UPDATE ON product_passports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blockchain_tx_updated_at BEFORE UPDATE ON blockchain_transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

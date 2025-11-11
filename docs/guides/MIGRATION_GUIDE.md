# 🔐 Migration Guide: MVP → Production Security

This guide helps you migrate from MVP/simplified implementations to production-ready security.

**Date:** October 29, 2024
**Status:** Ready for implementation

---

## 📋 Overview

The platform now has **two implementations** for critical security components:

| Component | MVP (Old) | Production (New) | Status |
|-----------|-----------|------------------|--------|
| **ZK Proofs** | HMAC commitments | zk-SNARKs (Groth16) | ✅ Ready |
| **VC Signatures** | HMAC (symmetric) | Ed25519 (asymmetric) | ✅ Ready |
| **DID Resolution** | Not implemented | did:key, did:web | ✅ Ready |
| **Replay Protection** | Not implemented | Nullifier tracking | ✅ Ready |
| **Stellar Hashing** | Truncated (16 bytes) | Full (32 bytes) | ✅ Fixed |

---

## 🚀 Migration Steps

### Step 1: Update Dependencies

```bash
cd packages/zk-toolkit
npm install

cd ../vc-toolkit
npm install
```

### Step 2: Compile Circuits (First Time Only)

```bash
cd packages/zk-toolkit
npm run setup:circuits
```

⏱️ **This takes 20-30 minutes** - it's generating cryptographic keys. Run it once.

---

## 🔧 Code Migration

### 1. Zero-Knowledge Proofs

#### ❌ OLD CODE (MVP):
```typescript
import { generateThresholdProof, verifyThresholdProof } from '@proofpass/zk-toolkit';

// Uses HMAC - NOT zero-knowledge!
const proof = generateThresholdProof({
  value: 25,
  threshold: 18,
});
```

#### ✅ NEW CODE (Production):
```typescript
import {
  generateThresholdProof as generateSNARKProof,
  verifyThresholdProof as verifySNARKProof
} from '@proofpass/zk-toolkit';

// Uses real zk-SNARKs - cryptographically secure!
const proof = await generateSNARKProof({
  value: 25,
  threshold: 18,
});

// Proof includes nullifier for replay protection
console.log('Nullifier:', proof.nullifierHash);
```

**Key Changes:**
- Function is now `async` (crypto operations take time)
- Returns `SNARKProofResult` with `nullifierHash`
- Actual zero-knowledge - value cannot be brute-forced

---

### 2. Verifiable Credentials

#### ❌ OLD CODE (MVP):
```typescript
import { signCredential } from '@proofpass/vc-toolkit';

// Uses HMAC - anyone who can verify can forge!
const privateKey = 'secret123';
const signedVC = signCredential(credential, privateKey);
```

#### ✅ NEW CODE (Production):
```typescript
import {
  generateDIDKeyPair,
  signCredential
} from '@proofpass/vc-toolkit';

// Generate Ed25519 key pair
const keyPair = generateDIDKeyPair();
console.log('Issuer DID:', keyPair.did);

// Sign with private key
const signedVC = signCredential(credential, keyPair);

// Verify with public key (anyone can verify, only issuer can sign)
import { verifyCredentialSignature } from '@proofpass/vc-toolkit';
const isValid = verifyCredentialSignature(signedVC, keyPair.publicKey);
```

**Key Changes:**
- Use `DIDKeyPair` instead of string
- Asymmetric cryptography (Ed25519)
- Proper W3C VC compliance
- DIDs are cryptographically derived

---

### 3. DID Resolution

#### ✅ NEW FEATURE:
```typescript
import { resolveDID, getVerificationMethod } from '@proofpass/vc-toolkit';

// Resolve DID to get public key
const result = await resolveDID('did:key:z6Mkf5rGMoatrSj1f4CyvuHBeXJELe9RPdzo2rJqA23fkzrn');

if (result.didDocument) {
  const verificationMethod = getVerificationMethod(
    result.didDocument,
    result.didDocument.verificationMethod[0].id
  );

  // Extract public key for verification
  const publicKey = extractEd25519PublicKey(
    decodeMultibaseKey(verificationMethod.publicKeyMultibase)
  );
}
```

**Supported DID Methods:**
- `did:key` - Self-contained (public key in identifier)
- `did:web` - HTTP-based resolution

---

### 4. Replay Protection

#### ✅ NEW FEATURE:
```typescript
import {
  verifyAndRecordNullifier,
  verifyAndRecordTransaction
} from '@proofpass/zk-toolkit';

// Verify ZK proof and check for replay
try {
  await verifyAndRecordNullifier(
    proof.nullifierHash,
    'threshold',
    { userId: 'user123' }
  );

  console.log('Proof accepted!');
} catch (error) {
  console.error('Replay attack detected!', error);
}

// Verify blockchain transaction
try {
  await verifyAndRecordTransaction(
    txHash,
    'stellar',
    dataHash,
    { credentialId: 'vc123' }
  );
} catch (error) {
  console.error('Transaction already recorded!', error);
}
```

**Features:**
- Prevents proof reuse
- Tracks used nullifiers
- Tracks blockchain transactions
- In-memory (dev) or PostgreSQL (production)

---

### 5. Stellar Blockchain

#### ✅ AUTOMATICALLY FIXED:

The hash truncation bug has been fixed. No code changes needed on your end!

**What changed:**
- Now uses full 32 bytes (64 hex chars)
- Consistent hashing everywhere
- Better collision resistance

---

## 📦 Production Database Setup

### PostgreSQL Migration

```sql
-- Run this in your production database

-- Nullifier tracking (prevents ZK proof reuse)
CREATE TABLE IF NOT EXISTS nullifiers (
  nullifier VARCHAR(128) PRIMARY KEY,
  proof_type VARCHAR(50) NOT NULL,
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB,
  INDEX idx_nullifier_timestamp (timestamp),
  INDEX idx_nullifier_type (proof_type)
);

-- Transaction tracking (prevents blockchain replay)
CREATE TABLE IF NOT EXISTS transactions (
  tx_hash VARCHAR(128) PRIMARY KEY,
  blockchain VARCHAR(50) NOT NULL,
  data_hash VARCHAR(64) NOT NULL,
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB,
  INDEX idx_tx_timestamp (timestamp),
  INDEX idx_tx_blockchain (blockchain)
);
```

### Cleanup Cron Job

```bash
# Add to crontab (run daily at 2 AM)
0 2 * * * psql -d proofpass -c "DELETE FROM nullifiers WHERE timestamp < NOW() - INTERVAL '90 days'"
0 2 * * * psql -d proofpass -c "DELETE FROM transactions WHERE timestamp < NOW() - INTERVAL '90 days'"
```

---

## 🧪 Testing

### Test ZK-SNARKs

```bash
cd packages/zk-toolkit
npm run test:snark
```

### Test VCs

```bash
cd packages/vc-toolkit
npm test
```

---

## ⚡ Performance Impact

| Operation | MVP Time | Production Time | Notes |
|-----------|----------|-----------------|-------|
| **ZK Proof Gen** | ~5ms | ~800ms | First proof loads circuit (~200ms overhead) |
| **ZK Proof Verify** | ~1ms | ~3ms | Very fast verification |
| **VC Signing** | ~2ms | ~1ms | Ed25519 is faster than HMAC |
| **VC Verification** | ~2ms | ~1ms | Public key verification |

**Impact:** ZK proof generation is slower (cryptographically secure operations), but verification is still very fast.

---

## 🔐 Security Checklist

Before going to production:

- [ ] Run `npm run setup:circuits` to generate zk-SNARK keys
- [ ] Update all ZK proof code to use `snark-proofs.ts`
- [ ] Update all VC code to use `vc-signer.ts` and `did-keys.ts`
- [ ] Set up PostgreSQL tables for replay protection
- [ ] Configure cron jobs for cleanup
- [ ] Test with production data volume
- [ ] Run security test suite
- [ ] Consider external security audit

---

## 🆘 Troubleshooting

### "Circuits not compiled" error

**Solution:**
```bash
cd packages/zk-toolkit
./scripts/setup-circuits.sh
```

This takes 20-30 minutes. Run once per development environment.

### "Cannot find module '@noble/curves'" error

**Solution:**
```bash
cd packages/vc-toolkit
npm install
```

### Slow ZK proof generation

**Expected behavior.** First proof loads circuit files (~200ms). Subsequent proofs are faster (~600-800ms).

For better performance:
- Batch multiple proofs
- Use worker threads for parallel generation
- Cache circuit artifacts in memory

---

## 📚 Additional Resources

- **ZK-SNARKs:** [packages/zk-toolkit/README.md](packages/zk-toolkit/README.md)
- **Security Audit:** [SECURITY_AUDIT.md](SECURITY_AUDIT.md)
- **Security Plan:** [SECURITY_IMPROVEMENTS_PLAN.md](SECURITY_IMPROVEMENTS_PLAN.md)

---

## 🎯 Backward Compatibility

**Good news:** Old code still works! The MVP implementations are kept for backward compatibility.

However, they are **NOT SECURE**. Migrate to production implementations before deploying with real user data.

---

## ❓ Questions?

Contact: fboiero@frvm.utn.edu.ar

**Last Updated:** October 29, 2024

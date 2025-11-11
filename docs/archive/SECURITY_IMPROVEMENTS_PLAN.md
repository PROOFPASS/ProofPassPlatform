# Security Improvements Plan - ProofPass Platform

**Based on:** Security Audit (October 28, 2024)
**Priority:** Address CRITICAL issues before production deployment
**Timeline:** 6-8 weeks for full implementation

---

## Phase 1: Critical Fixes (Weeks 1-3)

### 1.1 Replace Zero-Knowledge Proof Implementation

**Status:** 🔴 CRITICAL - Current Implementation Not Secure
**Timeline:** 2-3 weeks
**Effort:** High

#### Current State
- Using simplified HMAC-based "proofs"
- No actual zero-knowledge properties
- Vulnerable to brute-force attacks

#### Target State
- Real zk-SNARKs using circom + snarkjs
- Actual zero-knowledge guarantees
- Production-grade cryptography

#### Implementation Steps

**Step 1: Install Dependencies**
```bash
npm install --workspace=packages/zk-toolkit snarkjs circomlib
npm install --save-dev circom
```

**Step 2: Create Circom Circuits**

Create `packages/zk-toolkit/circuits/threshold.circom`:
```circom
pragma circom 2.0.0;

include "node_modules/circomlib/circuits/comparators.circom";

// Proves that value >= threshold without revealing value
template ThresholdProof() {
    signal input value;
    signal input threshold;
    signal input nullifier;  // Prevents linkability

    signal output nullifierHash;
    signal output valid;

    // Check value >= threshold
    component gte = GreaterEqThan(32);
    gte.in[0] <== value;
    gte.in[1] <== threshold;
    valid <== gte.out;

    // Create nullifier hash (prevents replays)
    component poseidon = Poseidon(2);
    poseidon.inputs[0] <== value;
    poseidon.inputs[1] <== nullifier;
    nullifierHash <== poseidon.out;

    // Constraint: valid must be 1
    valid === 1;
}

component main {public [threshold, nullifierHash]} = ThresholdProof();
```

**Step 3: Compile Circuits**

Create `packages/zk-toolkit/scripts/compile-circuits.sh`:
```bash
#!/bin/bash
set -e

CIRCUITS_DIR="packages/zk-toolkit/circuits"
BUILD_DIR="packages/zk-toolkit/build"

mkdir -p $BUILD_DIR

# Compile circuit
circom $CIRCUITS_DIR/threshold.circom \
  --r1cs \
  --wasm \
  --sym \
  -o $BUILD_DIR

# Download Powers of Tau (or use cached)
if [ ! -f "$BUILD_DIR/pot12_final.ptau" ]; then
  wget https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_12.ptau \
    -O $BUILD_DIR/pot12_final.ptau
fi

# Generate zkey
snarkjs groth16 setup \
  $BUILD_DIR/threshold.r1cs \
  $BUILD_DIR/pot12_final.ptau \
  $BUILD_DIR/threshold_0000.zkey

# Contribute to ceremony (for production, do real ceremony)
snarkjs zkey contribute \
  $BUILD_DIR/threshold_0000.zkey \
  $BUILD_DIR/threshold_final.zkey \
  --name="ProofPass Contribution" \
  -v

# Export verification key
snarkjs zkey export verificationkey \
  $BUILD_DIR/threshold_final.zkey \
  $BUILD_DIR/verification_key.json
```

**Step 4: Update ZK Toolkit Implementation**

Replace `packages/zk-toolkit/src/circuits.ts` with proper implementation:

```typescript
import { groth16 } from 'snarkjs';
import path from 'path';
import crypto from 'crypto';

const BUILD_DIR = path.join(__dirname, '../build');

export interface ZKProofResult {
  proof: {
    pi_a: string[];
    pi_b: string[][];
    pi_c: string[];
    protocol: string;
    curve: string;
  };
  publicSignals: string[];
}

/**
 * Generate a threshold proof (zk-SNARK)
 * Proves that value >= threshold without revealing value
 */
export async function generateThresholdProof(
  value: number,
  threshold: number
): Promise<ZKProofResult> {
  if (value < threshold) {
    throw new Error('Invalid proof: value does not meet threshold');
  }

  // Generate random nullifier
  const nullifier = crypto.randomBytes(32).toString('hex');
  const nullifierBigInt = BigInt('0x' + nullifier);

  // Prepare inputs
  const inputs = {
    value: value.toString(),
    threshold: threshold.toString(),
    nullifier: nullifierBigInt.toString(),
  };

  // Generate witness
  const wasmFile = path.join(BUILD_DIR, 'threshold.wasm');
  const { proof, publicSignals } = await groth16.fullProve(
    inputs,
    wasmFile,
    path.join(BUILD_DIR, 'threshold_final.zkey')
  );

  return {
    proof,
    publicSignals,
  };
}

/**
 * Verify a threshold proof (zk-SNARK)
 */
export async function verifyThresholdProof(
  proof: any,
  publicSignals: string[]
): Promise<boolean> {
  const vKey = require(path.join(BUILD_DIR, 'verification_key.json'));
  return await groth16.verify(vKey, publicSignals, proof);
}
```

**Benefits:**
- ✅ Real zero-knowledge (value is hidden)
- ✅ Cryptographically secure (zk-SNARKs)
- ✅ Non-interactive (groth16)
- ✅ Small proof size (~200 bytes)
- ✅ Fast verification (~2ms)

---

### 1.2 Implement Proper W3C Verifiable Credentials

**Status:** 🔴 CRITICAL - Not W3C Compliant
**Timeline:** 1-2 weeks
**Effort:** Medium

#### Implementation Steps

**Step 1: Install W3C VC Libraries**
```bash
npm install --workspace=packages/vc-toolkit \
  did-jwt \
  did-jwt-vc \
  did-resolver \
  key-did-resolver \
  web-did-resolver \
  @decentralized-identity/did-jwt-vc
```

**Step 2: Implement Proper DID Support**

Create `packages/vc-toolkit/src/did-manager.ts`:
```typescript
import { Resolver } from 'did-resolver';
import { getResolver as getKeyResolver } from 'key-did-resolver';
import { getResolver as getWebResolver } from 'web-did-resolver';
import { Ed25519Provider } from 'key-did-provider-ed25519';
import { DID } from 'dids';
import * as u8a from 'uint8arrays';

export class DIDManager {
  private resolver: Resolver;
  private did?: DID;

  constructor() {
    // Support multiple DID methods
    this.resolver = new Resolver({
      ...getKeyResolver(),
      ...getWebResolver(),
    });
  }

  /**
   * Create a new DID from a seed
   */
  async createDID(seed: Uint8Array): Promise<string> {
    const provider = new Ed25519Provider(seed);
    this.did = new DID({ provider, resolver: this.resolver });
    await this.did.authenticate();
    return this.did.id;
  }

  /**
   * Resolve a DID to its DID Document
   */
  async resolveDID(didString: string): Promise<any> {
    const result = await this.resolver.resolve(didString);
    if (result.didResolutionMetadata.error) {
      throw new Error(`Failed to resolve DID: ${result.didResolutionMetadata.error}`);
    }
    return result.didDocument;
  }

  /**
   * Get the DID instance for signing
   */
  getDID(): DID {
    if (!this.did) {
      throw new Error('DID not initialized');
    }
    return this.did;
  }
}
```

**Step 3: Implement Proper VC Signing**

Replace `packages/vc-toolkit/src/vc-generator.ts`:
```typescript
import { createVerifiableCredentialJwt, JwtCredentialPayload } from 'did-jwt-vc';
import { DIDManager } from './did-manager';
import { Issuer } from 'did-jwt-vc';

export class VCGenerator {
  constructor(private didManager: DIDManager) {}

  /**
   * Create and sign a W3C Verifiable Credential (proper implementation)
   */
  async createVerifiableCredential(
    issuerDID: string,
    subjectDID: string,
    credentialSubject: any,
    vcType: string[] = []
  ): Promise<string> {
    // Create VC payload
    const vcPayload: JwtCredentialPayload = {
      sub: subjectDID,
      vc: {
        '@context': [
          'https://www.w3.org/2018/credentials/v1',
        ],
        type: ['VerifiableCredential', ...vcType],
        credentialSubject,
      },
    };

    // Get DID for signing (with private key)
    const did = this.didManager.getDID();

    // Create issuer
    const issuer: Issuer = {
      did: issuerDID,
      signer: did.signer(),
      alg: 'EdDSA',
    };

    // Sign and create JWT
    const vcJwt = await createVerifiableCredentialJwt(
      vcPayload,
      issuer
    );

    return vcJwt; // Returns proper JWT with Ed25519 signature
  }
}
```

**Step 4: Implement Proper VC Verification**

Replace `packages/vc-toolkit/src/vc-verifier.ts`:
```typescript
import { verifyCredential } from 'did-jwt-vc';
import { DIDManager } from './did-manager';

export class VCVerifier {
  constructor(private didManager: DIDManager) {}

  /**
   * Verify a W3C Verifiable Credential (proper implementation)
   */
  async verifyVerifiableCredential(vcJwt: string): Promise<{
    verified: boolean;
    payload?: any;
    errors?: string[];
  }> {
    try {
      // Verify using DID resolution for public key
      const verifiedVC = await verifyCredential(
        vcJwt,
        this.didManager.resolver
      );

      return {
        verified: true,
        payload: verifiedVC.verifiableCredential,
      };
    } catch (error: any) {
      return {
        verified: false,
        errors: [error.message],
      };
    }
  }
}
```

**Benefits:**
- ✅ W3C compliant
- ✅ Proper Ed25519 signatures
- ✅ DID resolution
- ✅ Asymmetric cryptography (public key verification)
- ✅ Standard JWT format
- ✅ Interoperable with other W3C VC systems

---

### 1.3 Fix Stellar Blockchain Hash Issue

**Status:** 🟡 MEDIUM - Inconsistent Hashing
**Timeline:** 2 days
**Effort:** Low

**Fix:** `packages/stellar-sdk/src/stellar-client.ts`

```typescript
async anchorData(data: string): Promise<AnchorDataResult> {
  try {
    // Create hash of the data
    const dataHash = crypto.createHash('sha256').update(data).digest('hex');
    const dataHashBuffer = Buffer.from(dataHash, 'hex'); // Convert full hash to buffer

    // Load account
    const account = await this.server.loadAccount(this.keypair.publicKey());

    // Build transaction
    const transaction = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: this.network,
    })
      .addOperation(
        StellarSdk.Operation.manageData({
          name: 'proofpass',
          value: dataHashBuffer.slice(0, 64).toString('hex'), // Still max 64 bytes for data
        })
      )
      .addMemo(StellarSdk.Memo.hash(dataHashBuffer)) // Use full 32 bytes
      .setTimeout(30)
      .build();

    // ... rest unchanged
  }
}

async verifyAnchor(txHash: string, data: string): Promise<boolean> {
  try {
    const tx = await this.getTransaction(txHash);
    if (!tx || !tx.successful) {
      return false;
    }

    // Create hash of the data
    const dataHash = crypto.createHash('sha256').update(data).digest('hex');

    // Check if memo matches (full hash)
    if (tx.memo && typeof tx.memo === 'string') {
      const memoHash = Buffer.from(tx.memo, 'base64').toString('hex');
      return memoHash === dataHash; // Compare full 32 bytes
    }

    return false;
  } catch (error) {
    return false;
  }
}
```

---

## Phase 2: High Priority Fixes (Weeks 4-5)

### 2.1 Implement Key Management System

**Step 1: Environment-based Key Storage (Current - OK for MVP)**
```typescript
// Already implemented - using environment variables
const stellarSecret = process.env.STELLAR_SECRET_KEY;
const jwtSecret = process.env.JWT_SECRET;
```

**Step 2: Add Key Rotation Support**

Create `packages/types/src/key-management.ts`:
```typescript
export interface KeyVersion {
  id: string;
  publicKey: string;
  createdAt: Date;
  expiresAt?: Date;
  status: 'active' | 'rotating' | 'expired';
}

export interface KeyRotationPolicy {
  rotationInterval: number; // days
  gracePeriod: number; // days to accept old key
}
```

**Step 3: Database Schema for Key Versions**

```sql
CREATE TABLE key_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_id VARCHAR(255) NOT NULL,
  public_key TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  status VARCHAR(50) DEFAULT 'active',
  key_type VARCHAR(50) NOT NULL
);

CREATE INDEX idx_key_versions_status ON key_versions(status);
CREATE INDEX idx_key_versions_key_id ON key_versions(key_id);
```

---

### 2.2 Add Replay Attack Prevention

Create migration `003_replay_protection.sql`:
```sql
CREATE TABLE used_nonces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nonce VARCHAR(255) UNIQUE NOT NULL,
  used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_used_nonces_nonce ON used_nonces(nonce);
CREATE INDEX idx_used_nonces_expires ON used_nonces(expires_at);

-- Cleanup old nonces automatically
CREATE OR REPLACE FUNCTION cleanup_expired_nonces()
RETURNS void AS $$
BEGIN
  DELETE FROM used_nonces WHERE expires_at < CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;
```

---

## Phase 3: Testing & Validation (Week 6)

### 3.1 Security Test Suite

Create `packages/zk-toolkit/__tests__/security.test.ts`:
```typescript
describe('ZK Proof Security Tests', () => {
  it('should not reveal value through brute force', async () => {
    const realValue = 100;
    const threshold = 50;

    const proof = await generateThresholdProof(realValue, threshold);

    // Try to brute force the value
    for (let guess = 0; guess <= 1000; guess++) {
      // Should not be able to verify with wrong value
      const canGuess = await canDeriveValueFromProof(proof, guess);
      expect(canGuess).toBe(false);
    }
  });

  it('should prevent replay attacks', async () => {
    const proof1 = await generateThresholdProof(100, 50);
    const proof2 = await generateThresholdProof(100, 50);

    // Different nullifiers = different proofs
    expect(proof1.publicSignals).not.toEqual(proof2.publicSignals);
  });

  it('should fail for invalid statements', async () => {
    // Value 30 does not meet threshold 50
    await expect(
      generateThresholdProof(30, 50)
    ).rejects.toThrow();
  });
});

describe('VC Signature Security Tests', () => {
  it('should prevent signature forgery', async () => {
    const vc = await createVC(issuerDID, 'alice', { admin: false });

    // Try to forge admin claim
    const tampered = JSON.parse(vc);
    tampered.vc.credentialSubject.admin = true;
    const tamperedJwt = JSON.stringify(tampered);

    const result = await verifyVC(tamperedJwt);
    expect(result.verified).toBe(false);
  });

  it('should require public key for verification', async () => {
    const vcJwt = await createVC(issuerDID, 'alice', { name: 'Alice' });

    // Verification should work with public key
    const result = await verifyVC(vcJwt);
    expect(result.verified).toBe(true);

    // Should not need private key for verification
    expect(result).not.toContain('privateKey');
  });
});
```

---

## Phase 4: Documentation & Audit (Weeks 7-8)

### 4.1 Update Security Documentation

- Document new ZK implementation
- Explain cryptographic choices
- Provide security guarantees
- Update API documentation

### 4.2 External Security Audit

**Recommended Auditors:**
- Trail of Bits (top choice for crypto)
- Least Authority (ZK specialists)
- OpenZeppelin (smart contracts & crypto)

**Audit Scope:**
- zk-SNARK circuits
- Cryptographic implementations
- Key management
- W3C VC compliance

---

## Timeline Summary

| Phase | Duration | Status |
|-------|----------|--------|
| **Phase 1: Critical Fixes** | 3 weeks | 🔴 Required |
| **Phase 2: High Priority** | 2 weeks | 🟠 Recommended |
| **Phase 3: Testing** | 1 week | ✅ Essential |
| **Phase 4: Documentation** | 2 weeks | 📝 Important |
| **Total** | **6-8 weeks** | |

---

## Success Criteria

✅ **Phase 1 Complete When:**
- zk-SNARKs generating real zero-knowledge proofs
- VCs using Ed25519 signatures (did-jwt)
- Stellar hash issue fixed
- All critical security tests passing

✅ **Phase 2 Complete When:**
- Key rotation implemented
- Replay protection active
- DID resolution working

✅ **Phase 3 Complete When:**
- 100% of security tests passing
- Penetration test completed
- No critical vulnerabilities found

✅ **Phase 4 Complete When:**
- Security documentation complete
- External audit passed (if required)
- Production deployment checklist verified

---

## Current Status: MVP (Not Production-Ready)

**Safe for:**
- ✅ Demonstrations
- ✅ Proof of concept
- ✅ Development testing

**NOT safe for:**
- ❌ Production with real data
- ❌ Privacy-sensitive applications
- ❌ Compliance/audit requirements
- ❌ Financial transactions

---

**Next Steps:**
1. Review this plan with stakeholders
2. Allocate 6-8 weeks for implementation
3. Begin Phase 1 immediately if production deployment planned
4. Consider external audit after Phase 3

**Contact:** fboiero@frvm.utn.edu.ar for questions

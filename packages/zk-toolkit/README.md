# 🔐 ZK-Toolkit - Zero-Knowledge Proof Library

Production-grade zero-knowledge proof toolkit using real zk-SNARKs (Groth16 proof system).

## ⚠️ Important Security Notice

This package now includes **two implementations**:

### 1. `snark-proofs.ts` - **PRODUCTION-READY** ✅
- Real zk-SNARKs using Groth16 protocol
- Cryptographically secure zero-knowledge proofs
- Uses circom circuits + snarkjs
- **USE THIS FOR PRODUCTION**

### 2. `circuits.ts` - **MVP/DEMO ONLY** ⚠️
- Simplified HMAC-based commitments
- NOT zero-knowledge
- For backward compatibility and demos only
- **DO NOT USE IN PRODUCTION**

---

## 🚀 Quick Start

### Installation

```bash
npm install @proofpass/zk-toolkit
```

### Setup Circuits (First Time Only)

Before using the SNARK proofs, you need to compile the circuits and generate cryptographic keys:

```bash
cd packages/zk-toolkit
./scripts/setup-circuits.sh
```

This will:
1. Download Powers of Tau file (~200MB)
2. Compile all circom circuits
3. Generate proving and verification keys

**⏱️ Estimated time:** 10-15 minutes

---

## 📖 Usage

### Threshold Proofs

Prove that a value meets a minimum threshold without revealing the actual value.

```typescript
import { generateThresholdProof, verifyThresholdProof } from '@proofpass/zk-toolkit';

// Generate proof (prover side)
const proof = await generateThresholdProof({
  value: 25,      // Private: actual value (not revealed)
  threshold: 18,  // Public: minimum required value
});

console.log('Proof generated!');
console.log('Nullifier Hash:', proof.nullifierHash); // Unique ID
console.log('Public Signals:', proof.publicSignals);

// Verify proof (verifier side)
const result = await verifyThresholdProof(
  proof.proof,
  proof.publicSignals
);

console.log('Proof valid:', result.verified); // true
// Verifier knows: value >= 18
// Verifier does NOT know: actual value (25)
```

### Range Proofs

Prove that a value is within a range [min, max] without revealing it.

```typescript
import { generateRangeProof, verifyRangeProof } from '@proofpass/zk-toolkit';

// Generate proof
const proof = await generateRangeProof({
  value: 35,  // Private: actual value
  min: 18,    // Public: minimum
  max: 65,    // Public: maximum
});

// Verify proof
const result = await verifyRangeProof(
  proof.proof,
  proof.publicSignals
);

console.log('Proof valid:', result.verified); // true
// Verifier knows: 18 <= value <= 65
// Verifier does NOT know: actual value (35)
```

### Set Membership Proofs

Prove that a value is a member of a set without revealing which element.

```typescript
import { generateSetMembershipProof, verifySetMembershipProof } from '@proofpass/zk-toolkit';

// Define the set
const validCountries = ['USA', 'Canada', 'Mexico', 'UK', 'France'];

// Generate proof
const proof = await generateSetMembershipProof({
  value: 'Canada',  // Private: actual value
  set: validCountries,  // Public: valid set
});

// Verify proof
const result = await verifySetMembershipProof(
  proof.proof,
  proof.publicSignals
);

console.log('Proof valid:', result.verified); // true
// Verifier knows: value is in the set
// Verifier does NOT know: which element ('Canada')
```

---

## 🏗️ Architecture

### Circuits (circom)

Located in `circuits/`:

- **`threshold.circom`** - Proves: `value >= threshold`
- **`range.circom`** - Proves: `min <= value <= max`
- **`set-membership.circom`** - Proves: `value ∈ set`

All circuits use:
- **Poseidon hash** (efficient in ZK circuits)
- **Nullifiers** (prevents proof reuse)
- **Public outputs** (verified by smart contracts/verifiers)

### TypeScript Implementation

- **`snark-proofs.ts`** - Production zk-SNARK implementation
- **`circuits.ts`** - Legacy simplified implementation (demo only)

---

## 🔑 Cryptographic Details

### Proof System: Groth16

- **Type:** zk-SNARK (Zero-Knowledge Succinct Non-Interactive Argument of Knowledge)
- **Setup:** Requires trusted setup ceremony
- **Proof size:** ~200 bytes (constant, regardless of circuit complexity)
- **Verification time:** ~2-5ms (very fast!)

### Security Properties

✅ **Zero-Knowledge:** Verifier learns nothing except proof validity
✅ **Soundness:** Prover cannot create fake proofs
✅ **Completeness:** Valid statements always verify
✅ **Non-Interactive:** No back-and-forth communication needed

### Nullifiers

Each proof includes a unique `nullifierHash` that:
- Prevents proof reuse (same value generates different proofs)
- Allows tracking without revealing the value
- Computed as: `Poseidon(value, random_nullifier)`

---

## 🧪 Testing

### Unit Tests

```bash
npm test
```

### Generate and Verify Example Proofs

```bash
node examples/test-threshold.js
node examples/test-range.js
node examples/test-set-membership.js
```

---

## 📊 Performance

Measured on MacBook Pro M1:

| Circuit | Proof Generation | Verification | Proof Size |
|---------|-----------------|--------------|------------|
| **Threshold** | ~800ms | ~3ms | 192 bytes |
| **Range** | ~1200ms | ~3ms | 192 bytes |
| **Set Membership** | ~1500ms | ~4ms | 192 bytes |

**Note:** First proof generation includes circuit loading (~200ms overhead).

---

## 🔧 Development

### Modify Circuits

1. Edit circuits in `circuits/*.circom`
2. Recompile and regenerate keys:

```bash
./scripts/setup-circuits.sh
```

3. Rebuild TypeScript:

```bash
npm run build
```

### Add New Circuit

1. Create `circuits/my-circuit.circom`
2. Add compilation step to `scripts/setup-circuits.sh`
3. Implement TypeScript wrapper in `src/snark-proofs.ts`
4. Add tests in `__tests__/`

---

## 📁 Directory Structure

```
zk-toolkit/
├── circuits/               # Circom circuit definitions
│   ├── circomlib/         # Circom standard library (cloned)
│   ├── threshold.circom   # Threshold proof circuit
│   ├── range.circom       # Range proof circuit
│   └── set-membership.circom
│
├── build/                 # Compiled circuits (auto-generated)
│   ├── *.r1cs            # Constraint systems
│   ├── *.sym             # Symbol files
│   └── *_js/*.wasm       # Witness generators
│
├── keys/                  # Cryptographic keys (auto-generated)
│   ├── *_final.zkey      # Proving keys
│   ├── *_verification_key.json  # Verification keys
│   └── *.ptau            # Powers of Tau (trusted setup)
│
├── src/
│   ├── snark-proofs.ts   # Production zk-SNARK implementation
│   ├── circuits.ts       # Legacy simplified implementation
│   └── index.ts          # Public exports
│
└── scripts/
    └── setup-circuits.sh  # Circuit compilation script
```

---

## 🔒 Security Considerations

### Trusted Setup

The Groth16 proof system requires a **trusted setup ceremony**. Currently using:

- **Powers of Tau:** Hermez ceremony (up to 2^28 constraints)
- **Circuit-specific setup:** Generated locally with random entropy

**For production:**
- Conduct a multi-party trusted setup ceremony
- Use contributions from multiple independent parties
- Document all participants and procedures

### Key Management

**Proving keys** (`*_final.zkey`):
- Can be public
- Required for proof generation
- ~10-50 MB per circuit

**Verification keys** (`*_verification_key.json`):
- Must be public
- Required for verification
- ~2-5 KB per circuit
- Can be embedded in smart contracts

### Private Inputs

⚠️ **Never log or expose private inputs:**

```typescript
// ❌ WRONG - Exposes private value!
console.log('Proving age:', privateAge);
const proof = await generateThresholdProof({ value: privateAge, threshold: 18 });

// ✅ CORRECT - Only log public outputs
const proof = await generateThresholdProof({ value: privateAge, threshold: 18 });
console.log('Proof generated:', proof.nullifierHash);
```

---

## 🌐 Integration with ProofPass

### Verifiable Credentials

ZK proofs are used in verifiable credentials to prove claims without revealing data:

```typescript
import { createVC } from '@proofpass/vc-toolkit';
import { generateThresholdProof } from '@proofpass/zk-toolkit';

// Create ZK proof for age
const ageProof = await generateThresholdProof({
  value: userData.age,
  threshold: 18,
});

// Embed in VC
const vc = await createVC({
  type: 'AgeVerification',
  zkProof: {
    type: 'threshold',
    proof: ageProof.proof,
    publicSignals: ageProof.publicSignals,
  },
});
```

### Blockchain Anchoring

Nullifier hashes can be anchored to Stellar blockchain:

```typescript
import { StellarClient } from '@proofpass/stellar-sdk';

const stellar = new StellarClient();

// Anchor nullifier hash to blockchain
await stellar.anchorData(proof.nullifierHash);

// Anyone can verify the proof was created at this time
// But cannot learn the original value
```

---

## 📚 Learn More

### Zero-Knowledge Proofs
- [ZK Whiteboard Sessions](https://zkhack.dev/whiteboard/)
- [circom Documentation](https://docs.circom.io/)
- [snarkjs Guide](https://github.com/iden3/snarkjs)

### Groth16 Protocol
- [Original Paper (2016)](https://eprint.iacr.org/2016/260.pdf)
- [Understanding zk-SNARKs](https://vitalik.ca/general/2017/11/09/starks_part_1.html)

### Security
- [Trusted Setup Ceremonies](https://github.com/iden3/hermez-ceremony)
- [Powers of Tau](https://github.com/privacy-scaling-explorations/perpetualpowersoftau)

---

## 🤝 Contributing

Found a bug or want to add a new circuit?

1. Create an issue describing the circuit/feature
2. Implement the circom circuit with tests
3. Add TypeScript wrapper
4. Update documentation
5. Submit a pull request

---

## 📄 License

GNU AGPL-3.0 - See LICENSE file for details

---

## 🙋 Support

- **GitHub Issues:** https://github.com/PROOFPASS/ProofPassPlatform/issues
- **Email:** fboiero@frvm.utn.edu.ar
- **Documentation:** https://proofpass.io/docs

---

**Built with ❤️ by the ProofPass team**

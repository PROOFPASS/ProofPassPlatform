# ProofPass Platform - Demo Client

This demo client showcases the complete end-to-end workflow of the ProofPass Platform, demonstrating how to create, manage, and verify digital credentials, zero-knowledge proofs, and product passports.

## Overview

The demo consists of 4 sequential scripts that demonstrate:

1. **Creating Verifiable Credentials** - Issue W3C-compliant credentials
2. **Generating Zero-Knowledge Proofs** - Create privacy-preserving proofs
3. **Building Product Passports** - Assemble portable digital identities
4. **Verifying Everything** - Cryptographically verify all components

## Prerequisites

Before running the demo, ensure you have:

1. **ProofPass API running** on `http://localhost:3000`
   ```bash
   # In the root directory
   npm run dev:api
   ```

2. **User account created**
   - You need a registered user account
   - Register via: `POST /api/v1/auth/register`
   - Or use the frontend dashboard

3. **Environment configured**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

## Installation

```bash
# From the demo-client directory
cd examples/demo-client

# Install dependencies
npm install
```

## Configuration

Edit the `.env` file with your credentials:

```bash
# ProofPass API Configuration
API_URL=http://localhost:3000
API_KEY=your_api_key_here

# User credentials for authentication
USER_EMAIL=your@email.com
USER_PASSWORD=your_password

# Optional: Blockchain network
BLOCKCHAIN_NETWORK=stellar
```

## Usage

### Run the Complete Demo

Execute all steps in sequence:

```bash
npm run demo
```

This will:
1. Create a Verifiable Credential for a product
2. Generate a zero-knowledge proof
3. Create a Product Passport
4. Verify all components

### Run Individual Steps

You can also run each step independently:

```bash
# Step 1: Create a Verifiable Credential
npm run 1:create-vc

# Step 2: Generate a Zero-Knowledge Proof
npm run 2:generate-zkp

# Step 3: Create a Product Passport
npm run 3:create-passport

# Step 4: Verify all components
npm run 4:verify-all
```

### Running Scripts Directly

```bash
# Using tsx (recommended)
npx tsx 1-create-vc.ts

# Or make them executable
chmod +x *.ts
./1-create-vc.ts
```

## What Each Step Does

### Step 1: Create Verifiable Credential

**Script**: `1-create-vc.ts`

Creates a W3C-compliant Verifiable Credential for a product:

- Authenticates with the ProofPass API
- Issues a credential with product information:
  - Product name, SKU, manufacturer
  - Certifications (GOTS, Fair Trade)
  - Carbon footprint data
  - Manufacturing details
- Saves credential data for subsequent steps

**Output**:
- Credential ID
- DID (Decentralized Identifier)
- Credential JWT
- `demo-data.json` file

### Step 2: Generate Zero-Knowledge Proof

**Script**: `2-generate-zkp.ts`

Generates a zk-SNARK proof from the credential:

- Loads credential from step 1
- Creates a threshold proof demonstrating:
  - Carbon footprint >= 2.0
  - WITHOUT revealing actual value (2.5)
- Uses Groth16 proof system
- Includes nullifier for replay protection

**Output**:
- Proof ID
- zk-SNARK proof (pi_a, pi_b, pi_c)
- Public signals
- Updated `demo-data.json`

### Step 3: Create Product Passport

**Script**: `3-create-passport.ts`

Assembles a Digital Product Passport:

- Loads credentials and proofs
- Creates or retrieves user passport
- Adds credential to passport
- Displays passport contents

**Output**:
- Passport ID
- List of credentials in passport
- Passport metadata
- Updated `demo-data.json`

### Step 4: Verify All Components

**Script**: `4-verify-all.ts`

Verifies the entire workflow:

- **Credential Verification**:
  - Signature verification (Ed25519)
  - Expiration check
  - DID resolution

- **ZK Proof Verification**:
  - Groth16 proof validation
  - Public signals verification
  - Threshold condition check

- **Passport Verification**:
  - Passport status check
  - Credentials accessibility
  - Integrity validation

**Output**:
- Comprehensive verification results
- Security properties demonstrated
- Use cases and next steps

## Demo Data

All demo data is stored in `demo-data.json`:

```json
{
  "userId": "...",
  "accessToken": "...",
  "credentialId": "...",
  "credential": "...",
  "did": "did:key:...",
  "zkProofId": "...",
  "zkProof": {...},
  "zkPublicSignals": [...],
  "passportId": "..."
}
```

This file is created after step 1 and updated by each subsequent step.

## Example Output

```
🔐 ProofPass Demo - Step 1: Create Verifiable Credential

1️⃣  Authenticating...
✅ Authenticated as: demo@proofpass.com
   User ID: 123abc

2️⃣  Creating Verifiable Credential...
✅ Verifiable Credential created successfully!

📄 Credential Details:
   ID: vc_abc123
   DID: did:key:z6Mk...
   Status: active
   Created: 12/15/2024, 10:30:00 AM

✅ Demo data saved to: demo-data.json

📌 Next step: Run `npm run 2:generate-zkp` to create a zero-knowledge proof
```

## Troubleshooting

### Authentication Failed

```bash
❌ Error: Unauthorized (401)
```

**Solution**: Check your `.env` file:
- Verify `USER_EMAIL` and `USER_PASSWORD` are correct
- Make sure the user account exists
- Try registering a new account

### API Not Running

```bash
❌ Error: connect ECONNREFUSED
```

**Solution**: Start the ProofPass API:
```bash
# In the root directory
npm run dev:api
```

### Missing Previous Steps

```bash
❌ Error: demo-data.json not found
```

**Solution**: Run the previous steps first:
```bash
npm run 1:create-vc
npm run 2:generate-zkp
```

Or run the complete demo:
```bash
npm run demo
```

### Session Expired

```bash
❌ Error: Token expired (401)
```

**Solution**: Re-run the complete demo to get a fresh token:
```bash
npm run demo
```

## Technical Details

### Technologies Used

- **TypeScript** - Type-safe scripting
- **tsx** - TypeScript execution without compilation
- **axios** - HTTP client for API calls
- **chalk** - Colored terminal output
- **dotenv** - Environment variable management

### Security Features Demonstrated

1. **Cryptographic Signatures** (Ed25519)
   - Public key cryptography
   - Digital signatures
   - Key pair generation

2. **Zero-Knowledge Proofs** (Groth16 zk-SNARKs)
   - Privacy-preserving proofs
   - Selective disclosure
   - No information leakage

3. **Decentralized Identifiers** (DID:key)
   - Self-contained DIDs
   - W3C DID Core 1.0 compliant
   - Multicodec encoding

4. **Verifiable Credentials** (W3C VC Data Model)
   - JWT format
   - JWS signatures
   - Standard compliance

5. **Additional Security**
   - Replay protection (nullifiers)
   - Tamper-evident credentials
   - Cryptographic verification

### API Endpoints Used

- `POST /api/v1/auth/login` - User authentication
- `POST /api/v1/attestations` - Create credential
- `POST /api/v1/attestations/verify` - Verify credential
- `POST /api/v1/zkp/proofs` - Generate ZK proof
- `POST /api/v1/zkp/verify` - Verify ZK proof
- `GET /api/v1/passports/me` - Get user passport
- `POST /api/v1/passports` - Create passport
- `POST /api/v1/passports/:id/credentials` - Add credential
- `GET /api/v1/passports/:id` - Get passport details

## Use Cases

This demo illustrates several real-world use cases:

### Supply Chain Transparency
- Track product origin and journey
- Verify certifications and compliance
- Prove ethical sourcing

### Product Authentication
- Verify product authenticity
- Prevent counterfeiting
- Establish provenance

### ESG Reporting
- Track carbon footprint
- Prove sustainability claims
- Enable regulatory compliance

### Digital Product Passports
- EU Digital Product Passport compliance
- Circular economy enablement
- Consumer transparency

## Next Steps

After running the demo, explore:

1. **Frontend Dashboard**
   ```bash
   npm run dev:platform
   ```
   Visit: http://localhost:3001

2. **API Documentation**
   - Review API endpoints
   - Test with Postman/Insomnia
   - Explore additional features

3. **Integration**
   - Use the demo code as a template
   - Integrate into your application
   - Customize credential schemas

4. **Production Deployment**
   - Configure production environment
   - Setup Docker containers
   - Deploy to cloud infrastructure

## Support

For issues or questions:

- **Documentation**: See main repository README
- **API Docs**: Check `/docs` endpoint
- **Issues**: Open an issue on GitHub
- **Community**: Join our discussions

## License

This demo client is part of the ProofPass Platform.
See LICENSE file in the root directory for details.

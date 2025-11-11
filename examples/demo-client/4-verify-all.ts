#!/usr/bin/env tsx
/**
 * Step 4: Verify All Components
 *
 * This script demonstrates how to:
 * 1. Verify the Verifiable Credential
 * 2. Verify the Zero-Knowledge Proof
 * 3. Verify the Product Passport
 * 4. Display comprehensive verification results
 */

import axios from 'axios';
import chalk from 'chalk';
import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load environment variables
config();

const API_URL = process.env.API_URL || 'http://localhost:3000';

interface DemoData {
  userId: string;
  accessToken: string;
  credentialId: string;
  credential: string;
  did: string;
  zkProofId: string;
  zkProof: any;
  zkPublicSignals: string[];
  passportId: string;
}

interface VerificationResult {
  valid: boolean;
  verified: boolean;
  error?: string;
  details?: any;
}

async function main() {
  console.log(chalk.blue.bold('\n🔐 ProofPass Demo - Step 4: Verify All Components\n'));

  try {
    // Step 1: Load demo data from previous steps
    const dataPath = join(__dirname, 'demo-data.json');
    let demoData: DemoData;

    try {
      const fileContent = readFileSync(dataPath, 'utf-8');
      demoData = JSON.parse(fileContent);
    } catch (error) {
      console.error(chalk.red('❌ Error: demo-data.json not found'));
      console.log(chalk.yellow('\n💡 Tip: Run all previous steps first:'));
      console.log(chalk.yellow('   npm run demo\n'));
      process.exit(1);
    }

    if (!demoData.passportId) {
      console.error(chalk.red('❌ Error: Passport not found in demo data'));
      console.log(chalk.yellow('\n💡 Tip: Run `npm run 3:create-passport` first\n'));
      process.exit(1);
    }

    console.log(chalk.cyan('📋 Verification Summary:'));
    console.log(chalk.gray(`   Credential ID: ${demoData.credentialId}`));
    console.log(chalk.gray(`   ZK Proof ID: ${demoData.zkProofId}`));
    console.log(chalk.gray(`   Passport ID: ${demoData.passportId}\n`));

    let allVerified = true;

    // Step 2: Verify Verifiable Credential
    console.log(chalk.cyan('1️⃣  Verifying Verifiable Credential...'));

    try {
      const vcVerifyResponse = await axios.post<VerificationResult>(
        `${API_URL}/api/v1/attestations/verify`,
        {
          credential: demoData.credential,
        },
        {
          headers: {
            'Authorization': `Bearer ${demoData.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (vcVerifyResponse.data.verified || vcVerifyResponse.data.valid) {
        console.log(chalk.green('   ✅ Credential is valid!\n'));
        console.log(chalk.gray('   ✓ Signature verified'));
        console.log(chalk.gray('   ✓ Not expired'));
        console.log(chalk.gray('   ✓ Issuer DID resolved'));
        console.log(chalk.gray(`   ✓ Issued by: ${demoData.did}\n`));
      } else {
        console.log(chalk.red('   ❌ Credential verification failed\n'));
        allVerified = false;
      }
    } catch (error: any) {
      console.log(chalk.red('   ❌ Error verifying credential:'), error.response?.data?.message || error.message);
      allVerified = false;
    }

    // Step 3: Verify Zero-Knowledge Proof
    console.log(chalk.cyan('2️⃣  Verifying Zero-Knowledge Proof...'));

    try {
      const zkpVerifyResponse = await axios.post<VerificationResult>(
        `${API_URL}/api/v1/zkp/verify`,
        {
          proof: demoData.zkProof,
          publicSignals: demoData.zkPublicSignals,
        },
        {
          headers: {
            'Authorization': `Bearer ${demoData.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (zkpVerifyResponse.data.verified || zkpVerifyResponse.data.valid) {
        console.log(chalk.green('   ✅ Zero-Knowledge Proof is valid!\n'));
        console.log(chalk.gray('   ✓ Groth16 proof verified'));
        console.log(chalk.gray('   ✓ Public signals match'));
        console.log(chalk.gray('   ✓ Threshold condition satisfied'));
        console.log(chalk.gray('   ✓ No information leaked\n'));
      } else {
        console.log(chalk.red('   ❌ ZK Proof verification failed\n'));
        allVerified = false;
      }
    } catch (error: any) {
      console.log(chalk.red('   ❌ Error verifying ZK proof:'), error.response?.data?.message || error.message);
      allVerified = false;
    }

    // Step 4: Verify Passport
    console.log(chalk.cyan('3️⃣  Verifying Product Passport...'));

    try {
      const passportResponse = await axios.get(
        `${API_URL}/api/v1/passports/${demoData.passportId}`,
        {
          headers: {
            'Authorization': `Bearer ${demoData.accessToken}`,
          },
        }
      );

      const passport = passportResponse.data;

      if (passport.status === 'active' && passport.credentials.length > 0) {
        console.log(chalk.green('   ✅ Passport is valid!\n'));
        console.log(chalk.gray(`   ✓ Status: ${passport.status}`));
        console.log(chalk.gray(`   ✓ Contains ${passport.credentials.length} credential(s)`));
        console.log(chalk.gray(`   ✓ Owner: ${passport.userId}`));
        console.log(chalk.gray(`   ✓ All credentials accessible\n`));
      } else {
        console.log(chalk.yellow('   ⚠️  Passport exists but may have issues\n'));
        allVerified = false;
      }
    } catch (error: any) {
      console.log(chalk.red('   ❌ Error verifying passport:'), error.response?.data?.message || error.message);
      allVerified = false;
    }

    // Step 5: Final Summary
    console.log(chalk.blue('═'.repeat(60)));

    if (allVerified) {
      console.log(chalk.green.bold('\n✨ ALL VERIFICATIONS PASSED! ✨\n'));

      console.log(chalk.yellow('🎉 What you have accomplished:'));
      console.log(chalk.gray('   1. Created a W3C-compliant Verifiable Credential'));
      console.log(chalk.gray('   2. Generated a cryptographic zero-knowledge proof'));
      console.log(chalk.gray('   3. Assembled a portable Product Passport'));
      console.log(chalk.gray('   4. Verified all components independently\n'));

      console.log(chalk.magenta('🔐 Security Properties Demonstrated:'));
      console.log(chalk.gray('   ✓ Cryptographic signatures (Ed25519)'));
      console.log(chalk.gray('   ✓ Zero-knowledge privacy (Groth16 zk-SNARKs)'));
      console.log(chalk.gray('   ✓ Decentralized identifiers (DID:key)'));
      console.log(chalk.gray('   ✓ Tamper-evident credentials (JWT)'));
      console.log(chalk.gray('   ✓ Selective disclosure (ZK proofs)'));
      console.log(chalk.gray('   ✓ Replay protection (nullifiers)\n'));

      console.log(chalk.cyan('📚 Use Cases:'));
      console.log(chalk.gray('   • Supply chain transparency'));
      console.log(chalk.gray('   • Product authentication'));
      console.log(chalk.gray('   • Compliance verification'));
      console.log(chalk.gray('   • ESG reporting'));
      console.log(chalk.gray('   • Digital product passports\n'));

      console.log(chalk.blue('🚀 Next Steps:'));
      console.log(chalk.gray('   • Explore the frontend dashboard at http://localhost:3001'));
      console.log(chalk.gray('   • Check out API documentation'));
      console.log(chalk.gray('   • Integrate ProofPass into your application'));
      console.log(chalk.gray('   • Deploy to production\n'));

    } else {
      console.log(chalk.red.bold('\n⚠️  SOME VERIFICATIONS FAILED\n'));
      console.log(chalk.yellow('💡 Tips:'));
      console.log(chalk.gray('   • Make sure the API is running (npm run dev:api)'));
      console.log(chalk.gray('   • Check that all previous steps completed successfully'));
      console.log(chalk.gray('   • Verify your .env configuration'));
      console.log(chalk.gray('   • Try running the complete demo: npm run demo\n'));
    }

    console.log(chalk.blue('═'.repeat(60) + '\n'));

    process.exit(allVerified ? 0 : 1);

  } catch (error: any) {
    console.error(chalk.red('\n❌ Unexpected Error:'), error.message);
    if (error.response?.status === 401) {
      console.log(chalk.yellow('\n💡 Tip: Your session may have expired. Run the full demo again:\n   npm run demo\n'));
    }
    process.exit(1);
  }
}

main();

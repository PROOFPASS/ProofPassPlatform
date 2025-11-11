#!/usr/bin/env tsx
/**
 * Step 2: Generate Zero-Knowledge Proof
 *
 * This script demonstrates how to:
 * 1. Load the credential created in step 1
 * 2. Generate a zk-SNARK proof from the credential
 * 3. Save the proof for verification
 */

import axios from 'axios';
import chalk from 'chalk';
import { config } from 'dotenv';
import { readFileSync, writeFileSync } from 'fs';
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
}

interface ZKProofResponse {
  id: string;
  proof: {
    pi_a: string[];
    pi_b: string[][];
    pi_c: string[];
    protocol: string;
    curve: string;
  };
  publicSignals: string[];
  verificationKey: string;
  status: string;
  createdAt: string;
}

async function main() {
  console.log(chalk.blue.bold('\n🔐 ProofPass Demo - Step 2: Generate Zero-Knowledge Proof\n'));

  try {
    // Step 1: Load demo data from previous step
    const dataPath = join(__dirname, 'demo-data.json');
    let demoData: DemoData;

    try {
      const fileContent = readFileSync(dataPath, 'utf-8');
      demoData = JSON.parse(fileContent);
    } catch (error) {
      console.error(chalk.red('❌ Error: demo-data.json not found'));
      console.log(chalk.yellow('\n💡 Tip: Run `npm run 1:create-vc` first\n'));
      process.exit(1);
    }

    console.log(chalk.cyan('1️⃣  Loading credential data...'));
    console.log(chalk.gray(`   Credential ID: ${demoData.credentialId}`));
    console.log(chalk.gray(`   DID: ${demoData.did}\n`));

    // Step 2: Generate Zero-Knowledge Proof
    console.log(chalk.cyan('2️⃣  Generating zk-SNARK proof...'));
    console.log(chalk.gray('   This may take a few seconds...\n'));

    const proofRequest = {
      credentialId: demoData.credentialId,
      proofType: 'threshold', // Can be 'threshold', 'range', or 'membership'
      circuit: 'threshold',
      publicInputs: {
        threshold: 2, // Prove carbon footprint is >= 2.0 without revealing exact value
      },
      privateInputs: {
        value: 2.5, // Actual carbon footprint from the credential
        nullifier: Math.floor(Math.random() * 1000000).toString(), // Prevent replay attacks
      },
    };

    const zkpResponse = await axios.post<ZKProofResponse>(
      `${API_URL}/api/v1/zkp/proofs`,
      proofRequest,
      {
        headers: {
          'Authorization': `Bearer ${demoData.accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const { id, proof, publicSignals, status, createdAt } = zkpResponse.data;

    console.log(chalk.green('✅ Zero-Knowledge Proof generated successfully!\n'));
    console.log(chalk.yellow('🔐 Proof Details:'));
    console.log(chalk.gray(`   ID: ${id}`));
    console.log(chalk.gray(`   Protocol: ${proof.protocol} (${proof.curve})`));
    console.log(chalk.gray(`   Status: ${status}`));
    console.log(chalk.gray(`   Created: ${new Date(createdAt).toLocaleString()}`));
    console.log(chalk.gray(`   Public Signals: [${publicSignals.join(', ')}]`));
    console.log(chalk.gray(`   Proof Size: ${JSON.stringify(proof).length} bytes\n`));

    console.log(chalk.magenta('🎯 Proof Properties:'));
    console.log(chalk.gray('   ✓ Proves carbon footprint >= 2.0'));
    console.log(chalk.gray('   ✓ Does NOT reveal actual value (2.5)'));
    console.log(chalk.gray('   ✓ Cryptographically verifiable'));
    console.log(chalk.gray('   ✓ Cannot be replayed (nullifier)\n'));

    // Step 3: Save proof data for next steps
    const updatedData = {
      ...demoData,
      zkProofId: id,
      zkProof: proof,
      zkPublicSignals: publicSignals,
      zkCreatedAt: new Date().toISOString(),
    };

    writeFileSync(dataPath, JSON.stringify(updatedData, null, 2));

    console.log(chalk.green('✅ Proof data saved to: demo-data.json'));
    console.log(chalk.blue('\n📌 Next step: Run `npm run 3:create-passport` to create a product passport\n'));

  } catch (error: any) {
    console.error(chalk.red('\n❌ Error:'), error.response?.data?.message || error.message);
    if (error.response?.status === 401) {
      console.log(chalk.yellow('\n💡 Tip: Your session may have expired. Run `npm run 1:create-vc` again\n'));
    } else if (error.response?.status === 400) {
      console.log(chalk.yellow('\n💡 Tip: Check that the proof parameters are valid'));
      console.log(chalk.yellow('   - threshold proofs require: threshold, value, nullifier'));
      console.log(chalk.yellow('   - range proofs require: min, max, value, nullifier'));
      console.log(chalk.yellow('   - membership proofs require: set, value, nullifier\n'));
    }
    process.exit(1);
  }
}

main();

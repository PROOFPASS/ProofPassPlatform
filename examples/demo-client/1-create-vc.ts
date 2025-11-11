#!/usr/bin/env tsx
/**
 * Step 1: Create a Verifiable Credential
 *
 * This script demonstrates how to:
 * 1. Authenticate with the ProofPass API
 * 2. Create a Verifiable Credential (VC)
 * 3. Save the credential ID for subsequent steps
 */

import axios from 'axios';
import chalk from 'chalk';
import { config } from 'dotenv';
import { writeFileSync } from 'fs';
import { join } from 'path';

// Load environment variables
config();

const API_URL = process.env.API_URL || 'http://localhost:3000';
const USER_EMAIL = process.env.USER_EMAIL;
const USER_PASSWORD = process.env.USER_PASSWORD;

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
  };
}

interface VCResponse {
  id: string;
  credential: string;
  did: string;
  status: string;
  createdAt: string;
}

async function main() {
  console.log(chalk.blue.bold('\n🔐 ProofPass Demo - Step 1: Create Verifiable Credential\n'));

  // Validate environment variables
  if (!USER_EMAIL || !USER_PASSWORD) {
    console.error(chalk.red('❌ Error: Missing USER_EMAIL or USER_PASSWORD in .env file'));
    process.exit(1);
  }

  try {
    // Step 1: Authenticate
    console.log(chalk.cyan('1️⃣  Authenticating...'));
    const authResponse = await axios.post<AuthResponse>(`${API_URL}/api/v1/auth/login`, {
      email: USER_EMAIL,
      password: USER_PASSWORD,
    });

    const { accessToken, user } = authResponse.data;
    console.log(chalk.green(`✅ Authenticated as: ${user.email}`));
    console.log(chalk.gray(`   User ID: ${user.id}\n`));

    // Step 2: Create Verifiable Credential
    console.log(chalk.cyan('2️⃣  Creating Verifiable Credential...'));

    const credentialData = {
      type: ['VerifiableCredential', 'ProductCredential'],
      credentialSubject: {
        id: user.id,
        product: {
          name: 'Organic Cotton T-Shirt',
          sku: 'DEMO-COTTON-001',
          manufacturer: 'EcoTextiles Inc.',
          certifications: ['GOTS', 'Fair Trade'],
          carbonFootprint: 2.5,
          recyclable: true,
        },
        manufacture: {
          date: '2024-12-01',
          location: 'Mumbai, India',
          batchNumber: 'BATCH-2024-001',
        },
      },
      expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
    };

    const vcResponse = await axios.post<VCResponse>(
      `${API_URL}/api/v1/attestations`,
      credentialData,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const { id, credential, did, status, createdAt } = vcResponse.data;

    console.log(chalk.green('✅ Verifiable Credential created successfully!\n'));
    console.log(chalk.yellow('📄 Credential Details:'));
    console.log(chalk.gray(`   ID: ${id}`));
    console.log(chalk.gray(`   DID: ${did}`));
    console.log(chalk.gray(`   Status: ${status}`));
    console.log(chalk.gray(`   Created: ${new Date(createdAt).toLocaleString()}\n`));

    // Step 3: Save data for next steps
    const demoData = {
      userId: user.id,
      accessToken,
      credentialId: id,
      credential,
      did,
      createdAt: new Date().toISOString(),
    };

    const dataPath = join(__dirname, 'demo-data.json');
    writeFileSync(dataPath, JSON.stringify(demoData, null, 2));

    console.log(chalk.green('✅ Demo data saved to: demo-data.json'));
    console.log(chalk.blue('\n📌 Next step: Run `npm run 2:generate-zkp` to create a zero-knowledge proof\n'));

  } catch (error: any) {
    console.error(chalk.red('\n❌ Error:'), error.response?.data?.message || error.message);
    if (error.response?.status === 401) {
      console.log(chalk.yellow('\n💡 Tip: Make sure your USER_EMAIL and USER_PASSWORD are correct in .env'));
      console.log(chalk.yellow('   If you don\'t have an account, register at: POST /api/v1/auth/register\n'));
    }
    process.exit(1);
  }
}

main();

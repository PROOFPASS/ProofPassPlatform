#!/usr/bin/env tsx
/**
 * Step 3: Create Product Passport
 *
 * This script demonstrates how to:
 * 1. Load credentials and proofs from previous steps
 * 2. Create or get user's passport
 * 3. Add credentials to the passport
 * 4. Display passport contents
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
  zkProofId: string;
  zkProof: any;
  zkPublicSignals: string[];
}

interface PassportResponse {
  id: string;
  userId: string;
  credentials: Array<{
    id: string;
    credential: string;
    type: string[];
    issuer: string;
    addedAt: string;
  }>;
  metadata: {
    title: string;
    description: string;
    tags: string[];
  };
  status: string;
  createdAt: string;
  updatedAt: string;
}

async function main() {
  console.log(chalk.blue.bold('\n🔐 ProofPass Demo - Step 3: Create Product Passport\n'));

  try {
    // Step 1: Load demo data from previous steps
    const dataPath = join(__dirname, 'demo-data.json');
    let demoData: DemoData;

    try {
      const fileContent = readFileSync(dataPath, 'utf-8');
      demoData = JSON.parse(fileContent);
    } catch (error) {
      console.error(chalk.red('❌ Error: demo-data.json not found'));
      console.log(chalk.yellow('\n💡 Tip: Run steps 1 and 2 first:'));
      console.log(chalk.yellow('   npm run 1:create-vc'));
      console.log(chalk.yellow('   npm run 2:generate-zkp\n'));
      process.exit(1);
    }

    if (!demoData.zkProofId) {
      console.error(chalk.red('❌ Error: ZK Proof not found in demo data'));
      console.log(chalk.yellow('\n💡 Tip: Run `npm run 2:generate-zkp` first\n'));
      process.exit(1);
    }

    console.log(chalk.cyan('1️⃣  Loading previous data...'));
    console.log(chalk.gray(`   Credential ID: ${demoData.credentialId}`));
    console.log(chalk.gray(`   ZK Proof ID: ${demoData.zkProofId}\n`));

    // Step 2: Get or create passport
    console.log(chalk.cyan('2️⃣  Getting user passport...'));

    let passport: PassportResponse;

    try {
      // Try to get existing passport
      const getResponse = await axios.get<PassportResponse>(
        `${API_URL}/api/v1/passports/me`,
        {
          headers: {
            'Authorization': `Bearer ${demoData.accessToken}`,
          },
        }
      );
      passport = getResponse.data;
      console.log(chalk.green(`✅ Found existing passport: ${passport.id}\n`));
    } catch (error: any) {
      if (error.response?.status === 404) {
        // Create new passport
        console.log(chalk.yellow('   No passport found, creating new one...\n'));

        const createResponse = await axios.post<PassportResponse>(
          `${API_URL}/api/v1/passports`,
          {
            metadata: {
              title: 'My Product Passport',
              description: 'Demo passport for ProofPass Platform',
              tags: ['demo', 'ecommerce', 'sustainability'],
            },
          },
          {
            headers: {
              'Authorization': `Bearer ${demoData.accessToken}`,
              'Content-Type': 'application/json',
            },
          }
        );
        passport = createResponse.data;
        console.log(chalk.green(`✅ Created new passport: ${passport.id}\n`));
      } else {
        throw error;
      }
    }

    // Step 3: Add credential to passport
    console.log(chalk.cyan('3️⃣  Adding credential to passport...'));

    const addCredentialResponse = await axios.post(
      `${API_URL}/api/v1/passports/${passport.id}/credentials`,
      {
        credentialId: demoData.credentialId,
      },
      {
        headers: {
          'Authorization': `Bearer ${demoData.accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log(chalk.green('✅ Credential added to passport!\n'));

    // Step 4: Get updated passport
    const updatedPassportResponse = await axios.get<PassportResponse>(
      `${API_URL}/api/v1/passports/${passport.id}`,
      {
        headers: {
          'Authorization': `Bearer ${demoData.accessToken}`,
        },
      }
    );

    const updatedPassport = updatedPassportResponse.data;

    // Display passport details
    console.log(chalk.yellow('📋 Passport Details:'));
    console.log(chalk.gray(`   ID: ${updatedPassport.id}`));
    console.log(chalk.gray(`   Status: ${updatedPassport.status}`));
    console.log(chalk.gray(`   Title: ${updatedPassport.metadata.title}`));
    console.log(chalk.gray(`   Description: ${updatedPassport.metadata.description}`));
    console.log(chalk.gray(`   Tags: ${updatedPassport.metadata.tags.join(', ')}`));
    console.log(chalk.gray(`   Credentials: ${updatedPassport.credentials.length}`));
    console.log(chalk.gray(`   Created: ${new Date(updatedPassport.createdAt).toLocaleString()}\n`));

    if (updatedPassport.credentials.length > 0) {
      console.log(chalk.yellow('📄 Credentials in Passport:'));
      updatedPassport.credentials.forEach((cred, index) => {
        console.log(chalk.gray(`   ${index + 1}. ${cred.id}`));
        console.log(chalk.gray(`      Type: ${cred.type.join(', ')}`));
        console.log(chalk.gray(`      Issuer: ${cred.issuer}`));
        console.log(chalk.gray(`      Added: ${new Date(cred.addedAt).toLocaleString()}\n`));
      });
    }

    // Step 5: Save passport data
    const updatedData = {
      ...demoData,
      passportId: updatedPassport.id,
      passportStatus: updatedPassport.status,
      passportCreatedAt: new Date().toISOString(),
    };

    writeFileSync(dataPath, JSON.stringify(updatedData, null, 2));

    console.log(chalk.green('✅ Passport data saved to: demo-data.json'));
    console.log(chalk.blue('\n📌 Next step: Run `npm run 4:verify-all` to verify all components\n'));

    console.log(chalk.magenta('🎯 What you can do with this passport:'));
    console.log(chalk.gray('   ✓ Share it via QR code'));
    console.log(chalk.gray('   ✓ Verify credentials independently'));
    console.log(chalk.gray('   ✓ Add more credentials over time'));
    console.log(chalk.gray('   ✓ Download as portable JSON'));
    console.log(chalk.gray('   ✓ Present to verifiers\n'));

  } catch (error: any) {
    console.error(chalk.red('\n❌ Error:'), error.response?.data?.message || error.message);
    if (error.response?.status === 401) {
      console.log(chalk.yellow('\n💡 Tip: Your session may have expired. Run `npm run 1:create-vc` again\n'));
    } else if (error.response?.status === 404) {
      console.log(chalk.yellow('\n💡 Tip: The credential or passport may not exist'));
      console.log(chalk.yellow('   Try running the previous steps again\n'));
    }
    process.exit(1);
  }
}

main();

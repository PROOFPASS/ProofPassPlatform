#!/usr/bin/env ts-node
/**
 * Script to create a Stellar testnet account
 * Run with: npx ts-node scripts/setup-stellar.ts
 */

import { StellarClient } from '../packages/stellar-sdk/src/stellar-client';

async function setupStellar() {
  console.log('🌟 Creating Stellar testnet account...\n');

  try {
    const account = await StellarClient.createTestAccount('testnet');

    console.log('✅ Account created successfully!\n');
    console.log('Public Key (STELLAR_PUBLIC_KEY):');
    console.log(account.publicKey);
    console.log('\nSecret Key (STELLAR_SECRET_KEY):');
    console.log(account.secretKey);
    console.log('\n⚠️  IMPORTANT: Save these keys securely!');
    console.log('⚠️  Add them to your .env file\n');

    // Test the account
    console.log('Testing account...');
    const client = new StellarClient({
      network: 'testnet',
      secretKey: account.secretKey,
      publicKey: account.publicKey,
    });

    const balance = await client.getBalance();
    console.log(`✅ Account balance: ${balance} XLM\n`);
  } catch (error) {
    console.error('❌ Error creating account:', error);
    process.exit(1);
  }
}

setupStellar();

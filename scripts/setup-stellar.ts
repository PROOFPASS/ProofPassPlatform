#!/usr/bin/env ts-node
/**
 * Script to create a Stellar testnet account
 * Run with: npx ts-node scripts/setup-stellar.ts
 */

import { StellarClient } from '../packages/stellar-sdk/src/stellar-client';

async function setupStellar() {
  console.log('[INFO] Creating Stellar testnet account...\n');

  try {
    const account = await StellarClient.createTestAccount('testnet');

    console.log('[SUCCESS] Account created successfully!\n');
    console.log('Public Key (STELLAR_PUBLIC_KEY):');
    console.log(account.publicKey);
    console.log('\nSecret Key (STELLAR_SECRET_KEY):');
    console.log(account.secretKey);
    console.log('\n[WARNING] IMPORTANT: Save these keys securely!');
    console.log('[WARNING] Add them to your .env file\n');

    // Test the account
    console.log('Testing account...');
    const client = new StellarClient({
      network: 'testnet',
      secretKey: account.secretKey,
      publicKey: account.publicKey,
    });

    const balance = await client.getBalance();
    console.log(`[OK] Account balance: ${balance} XLM\n`);
  } catch (error) {
    console.error('[ERROR] Error creating account:', error);
    process.exit(1);
  }
}

setupStellar();

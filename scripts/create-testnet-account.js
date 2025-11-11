#!/usr/bin/env node
/**
 * Simple script to create a Stellar testnet account
 * This uses plain JavaScript to avoid TypeScript compilation issues
 */

const StellarSdk = require('@stellar/stellar-sdk');
const fs = require('fs');
const path = require('path');

async function createAccount() {
  console.log('🌟 Creating Stellar testnet account...\n');

  try {
    // Generate keypair
    const keypair = StellarSdk.Keypair.random();
    const publicKey = keypair.publicKey();
    const secretKey = keypair.secret();

    console.log('Generated keypair!');
    console.log('Public Key:', publicKey);
    console.log('Secret Key:', secretKey);
    console.log('\n📡 Funding account with Friendbot...\n');

    // Fund with Friendbot
    const response = await fetch(
      `https://friendbot.stellar.org?addr=${encodeURIComponent(publicKey)}`
    );

    if (!response.ok) {
      throw new Error(`Friendbot failed: ${response.statusText}`);
    }

    console.log('✅ Account funded successfully!\n');

    // Test the account
    const server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org');
    const account = await server.loadAccount(publicKey);
    const balance = account.balances.find(b => b.asset_type === 'native');

    console.log(`💰 Balance: ${balance.balance} XLM\n`);

    // Update .env file
    const envPath = path.join(__dirname, '..', '.env');
    let envContent = fs.readFileSync(envPath, 'utf-8');

    // Replace the empty values
    envContent = envContent.replace(
      /STELLAR_SECRET_KEY=.*/,
      `STELLAR_SECRET_KEY=${secretKey}`
    );
    envContent = envContent.replace(
      /STELLAR_PUBLIC_KEY=.*/,
      `STELLAR_PUBLIC_KEY=${publicKey}`
    );

    fs.writeFileSync(envPath, envContent);
    console.log('✅ Credentials saved to .env file\n');

    console.log('═══════════════════════════════════════');
    console.log('🎉 Setup complete!\n');
    console.log('Your Stellar testnet account is ready to use.');
    console.log(`Explorer: https://stellar.expert/explorer/testnet/account/${publicKey}`);
    console.log('═══════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createAccount();

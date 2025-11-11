import { StellarClient } from '../packages/stellar-sdk/src/stellar-client';

async function test() {
  console.log('Creating Stellar testnet account...\n');

  try {
    const account = await StellarClient.createTestAccount('testnet');
    console.log('Account created!');
    console.log('Public Key:', account.publicKey);
    console.log('Secret Key:', account.secretKey);
    console.log('\nAdd to .env:');
    console.log(`STELLAR_PUBLIC_KEY=${account.publicKey}`);
    console.log(`STELLAR_SECRET_KEY=${account.secretKey}`);
  } catch (error) {
    console.error('Error:', error);
  }
}

test();

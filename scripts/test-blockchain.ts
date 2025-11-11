#!/usr/bin/env ts-node
/**
 * Script to test blockchain anchoring on Stellar testnet
 * Run with: npx tsx scripts/test-blockchain.ts
 */

import { StellarClient } from '../packages/stellar-sdk/src/stellar-client';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

interface TestResult {
  success: boolean;
  message: string;
  data?: any;
}

async function main() {
  console.log('🚀 ProofPass Blockchain Testing Script\n');
  console.log('═══════════════════════════════════════\n');

  const results: TestResult[] = [];

  // Check if we have credentials
  let secretKey = process.env.STELLAR_SECRET_KEY;
  let publicKey = process.env.STELLAR_PUBLIC_KEY;

  if (!secretKey || !publicKey) {
    console.log('⚠️  No Stellar credentials found in .env');
    console.log('Creating new testnet account...\n');

    try {
      const account = await StellarClient.createTestAccount('testnet');
      secretKey = account.secretKey;
      publicKey = account.publicKey;

      console.log('✅ New account created!\n');
      console.log('Public Key:', publicKey);
      console.log('Secret Key:', secretKey);
      console.log('\n⚠️  IMPORTANT: Add these to your .env file:\n');
      console.log(`STELLAR_PUBLIC_KEY=${publicKey}`);
      console.log(`STELLAR_SECRET_KEY=${secretKey}\n`);

      // Optionally save to .env
      const envPath = path.join(__dirname, '..', '.env');
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf-8');
        if (!envContent.includes('STELLAR_PUBLIC_KEY')) {
          fs.appendFileSync(envPath, `\nSTELLAR_PUBLIC_KEY=${publicKey}\n`);
          fs.appendFileSync(envPath, `STELLAR_SECRET_KEY=${secretKey}\n`);
          console.log('✅ Credentials saved to .env file\n');
        }
      }

      results.push({
        success: true,
        message: 'Account created successfully',
        data: { publicKey },
      });
    } catch (error: any) {
      results.push({
        success: false,
        message: `Failed to create account: ${error.message}`,
      });
      printResults(results);
      process.exit(1);
    }
  } else {
    console.log('✅ Using existing Stellar credentials from .env\n');
    console.log('Public Key:', publicKey);
  }

  // Initialize client
  const client = new StellarClient({
    network: 'testnet',
    secretKey: secretKey!,
    publicKey: publicKey!,
  });

  console.log('\n─────────────────────────────────────\n');

  // Test 1: Check balance
  console.log('📊 Test 1: Checking account balance...');
  try {
    const balance = await client.getBalance();
    console.log(`✅ Balance: ${balance} XLM\n`);
    results.push({
      success: true,
      message: 'Balance check successful',
      data: { balance },
    });
  } catch (error: any) {
    console.log(`❌ Failed: ${error.message}\n`);
    results.push({
      success: false,
      message: `Balance check failed: ${error.message}`,
    });
  }

  // Test 2: Anchor sample data
  console.log('📝 Test 2: Anchoring sample data to blockchain...');
  const sampleData = JSON.stringify({
    type: 'ProductCertification',
    product: 'Organic Coffee Beans - Batch #12345',
    certification: 'USDA Organic',
    issueDate: new Date().toISOString(),
    manufacturer: 'Fair Trade Coffee Co.',
  });

  let txHash: string | undefined;
  try {
    const result = await client.anchorData(sampleData);
    txHash = result.txHash;
    console.log('✅ Data anchored successfully!');
    console.log(`   Transaction Hash: ${result.txHash}`);
    console.log(`   Fee: ${result.fee} stroops`);
    console.log(`   Timestamp: ${result.timestamp}`);
    console.log(`   Explorer: https://stellar.expert/explorer/testnet/tx/${result.txHash}\n`);
    results.push({
      success: true,
      message: 'Data anchored successfully',
      data: result,
    });
  } catch (error: any) {
    console.log(`❌ Failed: ${error.message}\n`);
    results.push({
      success: false,
      message: `Anchoring failed: ${error.message}`,
    });
  }

  // Test 3: Retrieve transaction
  if (txHash) {
    console.log('🔍 Test 3: Retrieving transaction details...');
    try {
      const tx = await client.getTransaction(txHash);
      if (tx) {
        console.log('✅ Transaction retrieved successfully!');
        console.log(`   Source Account: ${tx.sourceAccount}`);
        console.log(`   Operations: ${tx.operationCount}`);
        console.log(`   Status: ${tx.successful ? 'Success' : 'Failed'}\n`);
        results.push({
          success: true,
          message: 'Transaction retrieval successful',
          data: tx,
        });
      }
    } catch (error: any) {
      console.log(`❌ Failed: ${error.message}\n`);
      results.push({
        success: false,
        message: `Transaction retrieval failed: ${error.message}`,
      });
    }

    // Test 4: Verify anchor
    console.log('✔️  Test 4: Verifying anchored data...');
    try {
      const isValid = await client.verifyAnchor(txHash, sampleData);
      if (isValid) {
        console.log('✅ Data verification successful! Hash matches.\n');
        results.push({
          success: true,
          message: 'Data verification successful',
        });
      } else {
        console.log('❌ Data verification failed! Hash mismatch.\n');
        results.push({
          success: false,
          message: 'Data verification failed: hash mismatch',
        });
      }
    } catch (error: any) {
      console.log(`❌ Failed: ${error.message}\n`);
      results.push({
        success: false,
        message: `Verification failed: ${error.message}`,
      });
    }
  }

  // Test 5: Get transaction history
  console.log('📜 Test 5: Fetching transaction history...');
  try {
    const history = await client.getTransactionHistory(5);
    console.log(`✅ Retrieved ${history.length} transactions:`);
    history.forEach((tx, idx) => {
      console.log(`   ${idx + 1}. ${tx.hash.substring(0, 16)}... (${tx.operationCount} ops)`);
    });
    console.log();
    results.push({
      success: true,
      message: 'Transaction history retrieved',
      data: { count: history.length },
    });
  } catch (error: any) {
    console.log(`❌ Failed: ${error.message}\n`);
    results.push({
      success: false,
      message: `History retrieval failed: ${error.message}`,
    });
  }

  // Print final results
  console.log('═══════════════════════════════════════\n');
  printResults(results);

  // Example API calls
  console.log('\n📡 Example API calls:\n');
  console.log('# Get blockchain info (public)');
  console.log('curl http://localhost:3000/api/v1/blockchain/info\n');
  console.log('# Anchor data (requires auth)');
  console.log('curl -X POST http://localhost:3000/api/v1/blockchain/anchor \\');
  console.log('  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\');
  console.log('  -H "Content-Type: application/json" \\');
  console.log('  -d \'{"data":"Your data to anchor"}\'\n');
  console.log('# Verify anchor (public)');
  console.log('curl -X POST http://localhost:3000/api/v1/blockchain/verify \\');
  console.log('  -H "Content-Type: application/json" \\');
  console.log(`  -d '{"txHash":"${txHash || 'TRANSACTION_HASH'}","data":"Your data to verify"}'\n`);
  console.log('# Get transaction (public)');
  console.log(`curl http://localhost:3000/api/v1/blockchain/transactions/${txHash || 'TRANSACTION_HASH'}\n`);
}

function printResults(results: TestResult[]) {
  console.log('📊 Test Results:\n');
  const passed = results.filter(r => r.success).length;
  const total = results.length;

  results.forEach((result, idx) => {
    const icon = result.success ? '✅' : '❌';
    console.log(`${icon} Test ${idx + 1}: ${result.message}`);
  });

  console.log(`\n${passed}/${total} tests passed`);

  if (passed === total) {
    console.log('\n🎉 All tests passed! Your blockchain integration is working.\n');
  } else {
    console.log('\n⚠️  Some tests failed. Check the errors above.\n');
  }
}

main().catch((error) => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});

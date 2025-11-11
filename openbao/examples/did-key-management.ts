/**
 * Example: DID Key Management with OpenBao
 *
 * Demonstrates how to securely store and manage DID keys using OpenBao
 */

import { initializeOpenBao } from '../../apps/api/src/services/openbao.service';
import { generateDIDKey } from '@proofpass/vc-toolkit';

async function main() {
  console.log('🔐 OpenBao DID Key Management Example\n');

  // 1. Initialize OpenBao service
  console.log('1️⃣ Initializing OpenBao connection...');
  const openBao = initializeOpenBao({
    address: process.env.OPENBAO_ADDR || 'http://localhost:8200',
    token: process.env.OPENBAO_TOKEN || 'dev-root-token-proofpass',
  });

  // Health check
  const isHealthy = await openBao.healthCheck();
  console.log(`   ✓ OpenBao health: ${isHealthy ? 'OK' : 'FAIL'}\n`);

  if (!isHealthy) {
    console.error('❌ OpenBao is not healthy. Please check the service.');
    process.exit(1);
  }

  // 2. Generate a new DID key pair
  console.log('2️⃣ Generating DID key pair...');
  const keyPair = await generateDIDKey();
  console.log(`   ✓ DID: ${keyPair.did}`);
  console.log(`   ✓ Public Key: ${keyPair.publicKeyBase58.substring(0, 20)}...`);
  console.log(`   ✓ Private Key: [REDACTED]\n`);

  // 3. Store the key in OpenBao
  console.log('3️⃣ Storing DID key in OpenBao...');
  const keyId = 'example-user-primary-key';

  await openBao.storeDIDKey(keyId, {
    did: keyPair.did,
    publicKey: keyPair.publicKeyBase58,
    privateKey: keyPair.privateKeyBase58,
    keyType: 'Ed25519',
    createdAt: new Date().toISOString(),
  });
  console.log(`   ✓ Key stored with ID: ${keyId}\n`);

  // 4. Retrieve the key from OpenBao
  console.log('4️⃣ Retrieving DID key from OpenBao...');
  const retrievedKey = await openBao.getDIDKey(keyId);

  if (retrievedKey) {
    console.log(`   ✓ Retrieved DID: ${retrievedKey.did}`);
    console.log(`   ✓ Key Type: ${retrievedKey.keyType}`);
    console.log(`   ✓ Created: ${retrievedKey.createdAt}\n`);
  }

  // 5. List all DID keys
  console.log('5️⃣ Listing all DID keys...');
  const allKeys = await openBao.listDIDKeys();
  console.log(`   ✓ Total keys: ${allKeys.length}`);
  allKeys.forEach((key) => {
    console.log(`      - ${key}`);
  });
  console.log();

  // 6. Encrypt sensitive data
  console.log('6️⃣ Encrypting sensitive data with Transit engine...');
  const sensitiveData = JSON.stringify({
    email: 'user@example.com',
    phone: '+1234567890',
    metadata: { role: 'admin' },
  });

  const encrypted = await openBao.encrypt(sensitiveData);
  console.log(`   ✓ Encrypted: ${encrypted.substring(0, 50)}...\n`);

  // 7. Decrypt data
  console.log('7️⃣ Decrypting data...');
  const decrypted = await openBao.decrypt(encrypted);
  const decryptedData = JSON.parse(decrypted);
  console.log(`   ✓ Decrypted email: ${decryptedData.email}`);
  console.log(`   ✓ Decrypted phone: ${decryptedData.phone}\n`);

  // 8. Organization key management
  console.log('8️⃣ Managing organization keys...');
  const orgId = 'org-example-123';
  const orgKeyId = 'primary-signing-key';

  const orgKeyPair = await generateDIDKey();
  await openBao.storeOrganizationKey(orgId, orgKeyId, {
    did: orgKeyPair.did,
    publicKey: orgKeyPair.publicKeyBase58,
    privateKey: orgKeyPair.privateKeyBase58,
    keyType: 'Ed25519',
    createdAt: new Date().toISOString(),
    organizationId: orgId,
  });
  console.log(`   ✓ Organization key stored: ${orgId}/${orgKeyId}\n`);

  // 9. List organization keys
  console.log('9️⃣ Listing organization keys...');
  const orgKeys = await openBao.listOrganizationKeys(orgId);
  console.log(`   ✓ Organization ${orgId} has ${orgKeys.length} key(s)`);
  orgKeys.forEach((key) => {
    console.log(`      - ${key}`);
  });
  console.log();

  // 10. Generate data encryption key
  console.log('🔟 Generating data encryption key...');
  const { plaintext: dek, ciphertext: encryptedDek } = await openBao.generateDataKey();
  console.log(`   ✓ DEK (plaintext): ${dek.substring(0, 30)}...`);
  console.log(`   ✓ DEK (encrypted): ${encryptedDek.substring(0, 50)}...`);
  console.log('   ℹ️  Use the plaintext DEK for encryption, store only the encrypted version\n');

  // Cleanup (optional - comment out to keep the keys)
  console.log('🧹 Cleanup: Deleting example keys...');
  await openBao.deleteDIDKey(keyId);
  console.log(`   ✓ Deleted key: ${keyId}`);

  console.log('\n✅ Example completed successfully!');
  console.log('\n📝 Security Best Practices:');
  console.log('   1. Never log or expose private keys');
  console.log('   2. Use encryption for sensitive data in database');
  console.log('   3. Rotate keys periodically');
  console.log('   4. Use organization-specific keys for isolation');
  console.log('   5. Enable audit logging in production');
}

// Run example
main().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});

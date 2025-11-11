/**
 * Example: Using Real DIDs with Verifiable Credentials
 *
 * This example demonstrates:
 * 1. Generating did:key identifiers
 * 2. Creating did:web identifiers
 * 3. Issuing Verifiable Credentials with did-jwt-vc
 * 4. Verifying Verifiable Credentials
 */

import {
  // DID:key methods
  generateDIDKey,

  // DID:web methods
  createDIDWeb,
  buildDIDWeb,

  // VC Issuing
  issueVC,
  createCredential,

  // VC Verification
  verifyVC,
} from '../src/index';

async function example() {
  console.log('=== ProofPass DID & VC Example ===\n');

  // ==========================================
  // 1. Generate did:key for Issuer
  // ==========================================
  console.log('1. Generating DID:key for issuer...');
  const issuerKeyPair = await generateDIDKey();
  console.log(`   Issuer DID: ${issuerKeyPair.did}`);
  console.log(`   Public Key (base58): ${issuerKeyPair.publicKeyBase58.substring(0, 20)}...\n`);

  // ==========================================
  // 2. Generate did:key for Subject (holder)
  // ==========================================
  console.log('2. Generating DID:key for credential subject...');
  const subjectKeyPair = await generateDIDKey();
  console.log(`   Subject DID: ${subjectKeyPair.did}\n`);

  // ==========================================
  // 3. Create did:web for Organization
  // ==========================================
  console.log('3. Creating DID:web for organization...');
  const orgDIDWeb = await createDIDWeb({
    domain: 'proofpass.com',
    path: ['organizations', 'org-123'],
  });
  console.log(`   Org DID: ${orgDIDWeb.did}`);
  console.log(`   DID Document should be hosted at:`);
  console.log(`   https://proofpass.com/organizations/org-123/did.json\n`);

  // ==========================================
  // 4. Create a Verifiable Credential
  // ==========================================
  console.log('4. Creating Verifiable Credential...');
  const credential = createCredential({
    issuerDID: issuerKeyPair.did,
    subjectDID: subjectKeyPair.did,
    type: ['EducationCredential'],
    credentialSubject: {
      degree: {
        type: 'BachelorDegree',
        name: 'Bachelor of Science in Computer Science',
      },
      university: 'ProofPass University',
      graduationDate: '2024-01-15',
    },
    expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
  });

  console.log('   Credential created:');
  console.log(`   - Type: ${JSON.stringify(credential.type)}`);
  console.log(`   - Issuer: ${credential.issuer}`);
  console.log(`   - Subject: ${credential.credentialSubject.id}`);
  console.log(`   - Degree: ${credential.credentialSubject.degree.name}\n`);

  // ==========================================
  // 5. Issue the VC as a JWT
  // ==========================================
  console.log('5. Signing Verifiable Credential (creating JWT)...');
  try {
    const vcJwt = await issueVC({
      credential,
      issuerKeyPair,
      expiresInSeconds: 365 * 24 * 60 * 60, // 1 year
    });

    console.log(`   VC JWT created (${vcJwt.length} characters)`);
    console.log(`   JWT preview: ${vcJwt.substring(0, 80)}...\n`);

    // ==========================================
    // 6. Verify the VC
    // ==========================================
    console.log('6. Verifying Verifiable Credential...');
    const verificationResult = await verifyVC(vcJwt);

    console.log(`   Verification result:`);
    console.log(`   - Verified: ${verificationResult.verified}`);
    console.log(`   - Issuer: ${verificationResult.issuer}`);
    console.log(`   - Subject: ${verificationResult.subject}`);
    if (verificationResult.error) {
      console.log(`   - Note: ${verificationResult.error}`);
    }
    if (verificationResult.credentialSubject) {
      console.log(`   - Claims: ${JSON.stringify(verificationResult.credentialSubject, null, 2)}`);
    }
  } catch (error) {
    console.error('   Error:', error instanceof Error ? error.message : error);
    console.log('\n   Note: Full verification requires did-jwt-vc to be installed.');
    console.log('   Run: cd packages/vc-toolkit && npm install\n');
  }

  // ==========================================
  // 7. Create Product Passport VC Example
  // ==========================================
  console.log('\n7. Creating Product Passport Verifiable Credential...');
  const productCredential = createCredential({
    issuerDID: orgDIDWeb.did,
    subjectDID: `did:web:product-registry.com:products:${Date.now()}`,
    type: ['ProductPassportCredential'],
    credentialSubject: {
      product: {
        name: 'Organic Cotton T-Shirt',
        gtin: '00012345678905',
        manufacturer: 'EcoFashion Inc.',
      },
      sustainability: {
        carbonFootprint: '2.5 kg CO2e',
        waterUsage: '2700 liters',
        recyclableContent: '95%',
      },
      certifications: ['GOTS', 'Fair Trade', 'Carbon Neutral'],
    },
  });

  console.log('   Product Passport created:');
  console.log(`   - Product: ${productCredential.credentialSubject.product.name}`);
  console.log(`   - GTIN: ${productCredential.credentialSubject.product.gtin}`);
  console.log(`   - Certifications: ${productCredential.credentialSubject.certifications.join(', ')}\n`);

  console.log('=== Example Complete ===');
}

// Run the example
if (require.main === module) {
  example().catch(console.error);
}

export { example };

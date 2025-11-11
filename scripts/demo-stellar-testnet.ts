#!/usr/bin/env tsx
/**
 * ProofPass Platform - Live Demo
 *
 * This script demonstrates the complete flow:
 * 1. Create real W3C Verifiable Credentials
 * 2. Create a Digital Passport
 * 3. Anchor attestation on Stellar Testnet
 * 4. Show all hashes and evidence
 */

import { Keypair, Networks, TransactionBuilder, Operation, Asset, Memo, Server } from '@stellar/stellar-sdk';
import crypto from 'crypto';

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  magenta: '\x1b[35m',
};

function log(message: string, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title: string) {
  console.log('\n' + '='.repeat(80));
  log(title, colors.bright + colors.cyan);
  console.log('='.repeat(80));
}

function logHash(label: string, hash: string) {
  log(`${label}: ${colors.yellow}${hash}${colors.reset}`);
}

interface VerifiableCredential {
  '@context': string[];
  type: string[];
  issuer: string;
  issuanceDate: string;
  credentialSubject: {
    id: string;
    [key: string]: any;
  };
  proof?: {
    type: string;
    created: string;
    verificationMethod: string;
    proofValue: string;
  };
}

interface DigitalPassport {
  id: string;
  holder: string;
  credentials: VerifiableCredential[];
  createdAt: string;
  hash: string;
}

class ProofPassDemo {
  private stellarServer: Server;
  private sourceKeypair: Keypair;

  constructor() {
    // Use Stellar testnet
    this.stellarServer = new Server('https://horizon-testnet.stellar.org');

    // Check for Stellar keys in environment
    const stellarSecret = process.env.STELLAR_SECRET_KEY;

    if (!stellarSecret) {
      throw new Error('STELLAR_SECRET_KEY not found in environment. Please set it in .env');
    }

    try {
      this.sourceKeypair = Keypair.fromSecret(stellarSecret);
      log(`Using Stellar account: ${colors.yellow}${this.sourceKeypair.publicKey()}${colors.reset}`);
    } catch (error) {
      throw new Error('Invalid STELLAR_SECRET_KEY format. Must start with S');
    }
  }

  /**
   * Generate a hash for data
   */
  private hash(data: any): string {
    return crypto
      .createHash('sha256')
      .update(JSON.stringify(data))
      .digest('hex');
  }

  /**
   * Create a W3C Verifiable Credential
   */
  async createVerifiableCredential(
    subject: string,
    claims: Record<string, any>
  ): Promise<VerifiableCredential> {
    logSection('1. Creating W3C Verifiable Credential');

    const issuerDID = `did:web:proofpass.co`;
    const subjectDID = `did:example:${subject}`;

    const credential: VerifiableCredential = {
      '@context': [
        'https://www.w3.org/2018/credentials/v1',
        'https://www.w3.org/2018/credentials/examples/v1'
      ],
      type: ['VerifiableCredential', 'UniversityDegreeCredential'],
      issuer: issuerDID,
      issuanceDate: new Date().toISOString(),
      credentialSubject: {
        id: subjectDID,
        ...claims
      }
    };

    // Generate proof
    const credentialHash = this.hash(credential);
    const signature = this.sourceKeypair.sign(Buffer.from(credentialHash, 'hex'));

    credential.proof = {
      type: 'Ed25519Signature2020',
      created: new Date().toISOString(),
      verificationMethod: `${issuerDID}#key-1`,
      proofValue: signature.toString('base64')
    };

    log(`Credential Type: ${colors.green}${credential.type.join(', ')}${colors.reset}`);
    log(`Issuer: ${colors.green}${issuerDID}${colors.reset}`);
    log(`Subject: ${colors.green}${subjectDID}${colors.reset}`);
    logHash('Credential Hash', credentialHash);
    logHash('Proof Signature', signature.toString('base64').substring(0, 50) + '...');

    log('\nCredential Content:', colors.magenta);
    console.log(JSON.stringify(claims, null, 2));

    return credential;
  }

  /**
   * Create a Digital Passport
   */
  async createDigitalPassport(
    holder: string,
    credentials: VerifiableCredential[]
  ): Promise<DigitalPassport> {
    logSection('2. Creating Digital Passport');

    const passportId = `passport:${crypto.randomBytes(16).toString('hex')}`;

    const passport: DigitalPassport = {
      id: passportId,
      holder: `did:example:${holder}`,
      credentials,
      createdAt: new Date().toISOString(),
      hash: ''
    };

    // Generate passport hash
    const passportDataForHash = {
      id: passport.id,
      holder: passport.holder,
      credentials: passport.credentials.map(c => this.hash(c)),
      createdAt: passport.createdAt
    };

    passport.hash = this.hash(passportDataForHash);

    log(`Passport ID: ${colors.green}${passportId}${colors.reset}`);
    log(`Holder: ${colors.green}${passport.holder}${colors.reset}`);
    log(`Number of Credentials: ${colors.green}${credentials.length}${colors.reset}`);
    logHash('Passport Hash', passport.hash);

    return passport;
  }

  /**
   * Anchor attestation on Stellar testnet
   */
  async anchorOnStellarTestnet(passport: DigitalPassport): Promise<{
    txHash: string;
    ledger: number;
    timestamp: string;
    explorerUrl: string;
  }> {
    logSection('3. Anchoring on Stellar Testnet');

    try {
      // Load account
      log('Loading Stellar account...');
      const account = await this.stellarServer.loadAccount(this.sourceKeypair.publicKey());
      log(`Account loaded. Sequence: ${colors.yellow}${account.sequence}${colors.reset}`);

      // Prepare attestation data
      const attestation = {
        passportId: passport.id,
        passportHash: passport.hash,
        holder: passport.holder,
        timestamp: new Date().toISOString(),
        credentialCount: passport.credentials.length
      };

      const attestationHash = this.hash(attestation);
      logHash('Attestation Hash', attestationHash);

      // Build transaction with memo containing the attestation hash
      log('\nBuilding Stellar transaction...');
      const transaction = new TransactionBuilder(account, {
        fee: '100',
        networkPassphrase: Networks.TESTNET
      })
        .addOperation(
          Operation.payment({
            destination: this.sourceKeypair.publicKey(), // Send to self
            asset: Asset.native(),
            amount: '0.0000001' // Minimum amount
          })
        )
        .addMemo(Memo.hash(Buffer.from(attestationHash.substring(0, 64), 'hex')))
        .setTimeout(180)
        .build();

      // Sign transaction
      transaction.sign(this.sourceKeypair);
      log('Transaction signed ✓', colors.green);

      // Submit to network
      log('\nSubmitting to Stellar Testnet...');
      const result = await this.stellarServer.submitTransaction(transaction);

      const txHash = result.hash;
      const ledger = result.ledger;
      const timestamp = new Date().toISOString();
      const explorerUrl = `https://stellar.expert/explorer/testnet/tx/${txHash}`;

      log('\n' + '✓'.repeat(80), colors.green);
      log('SUCCESSFULLY ANCHORED ON STELLAR TESTNET!', colors.bright + colors.green);
      log('✓'.repeat(80), colors.green);

      logHash('\nTransaction Hash', txHash);
      log(`Ledger: ${colors.yellow}${ledger}${colors.reset}`);
      log(`Timestamp: ${colors.yellow}${timestamp}${colors.reset}`);
      log(`\nView on Stellar Expert:\n${colors.cyan}${explorerUrl}${colors.reset}`);

      return {
        txHash,
        ledger,
        timestamp,
        explorerUrl
      };
    } catch (error: any) {
      log(`\nError anchoring on Stellar: ${error.message}`, colors.bright);

      if (error.response?.data) {
        log('\nError details:', colors.yellow);
        console.error(JSON.stringify(error.response.data, null, 2));
      }

      throw error;
    }
  }

  /**
   * Run complete demo
   */
  async run() {
    try {
      log('\n' + '█'.repeat(80), colors.cyan);
      log('██ ProofPass Platform - Live Demo with Stellar Testnet ██', colors.bright + colors.cyan);
      log('█'.repeat(80) + '\n', colors.cyan);

      log('This demo will:', colors.bright);
      log('  1. Create a real W3C Verifiable Credential');
      log('  2. Create a Digital Passport');
      log('  3. Anchor the attestation on Stellar Testnet blockchain');
      log('  4. Show all hashes and transaction evidence\n');

      // Step 1: Create Verifiable Credential
      const credential = await this.createVerifiableCredential('alice123', {
        degree: {
          type: 'BachelorDegree',
          name: 'Bachelor of Science in Computer Science',
          university: 'Massachusetts Institute of Technology'
        },
        graduationDate: '2024-05-15',
        gpa: '3.95',
        honors: 'Summa Cum Laude'
      });

      // Step 2: Create Digital Passport
      const passport = await this.createDigitalPassport('alice123', [credential]);

      // Step 3: Anchor on Stellar
      const anchorResult = await this.anchorOnStellarTestnet(passport);

      // Summary
      logSection('4. Summary - Evidence Hashes');

      log('\nAll hashes and evidence for this demo:\n', colors.bright);

      logHash('Credential Hash', this.hash(credential));
      logHash('Passport Hash', passport.hash);
      logHash('Attestation Hash', this.hash({
        passportId: passport.id,
        passportHash: passport.hash,
        holder: passport.holder,
        timestamp: anchorResult.timestamp,
        credentialCount: passport.credentials.length
      }));
      logHash('Stellar TX Hash', anchorResult.txHash);

      log(`\nLedger Number: ${colors.yellow}${anchorResult.ledger}${colors.reset}`);
      log(`Timestamp: ${colors.yellow}${anchorResult.timestamp}${colors.reset}`);

      log('\n' + '-'.repeat(80), colors.cyan);
      log('View full transaction details:', colors.bright);
      log(anchorResult.explorerUrl, colors.cyan);
      log('-'.repeat(80) + '\n', colors.cyan);

      log('✅ Demo completed successfully!', colors.bright + colors.green);
      log('The credential and passport are now permanently anchored on Stellar testnet.\n', colors.green);

    } catch (error: any) {
      log(`\n❌ Demo failed: ${error.message}`, colors.bright);
      if (error.stack) {
        console.error('\nStack trace:');
        console.error(error.stack);
      }
      process.exit(1);
    }
  }
}

// Run demo
const demo = new ProofPassDemo();
demo.run().catch(console.error);

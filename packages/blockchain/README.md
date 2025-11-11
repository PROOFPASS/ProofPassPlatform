# @proofpass/blockchain

Multi-blockchain support for ProofPass Platform. Anchor verifiable credential data on **Optimism**, **Arbitrum**, or **Stellar** - you choose where to persist!

## Features

- Multi-blockchain support (Optimism, Arbitrum, Stellar)
- Unified API across all blockchains
- Batch anchoring for high throughput
- Transaction verification
- Automatic fee estimation
- Full TypeScript support

## Supported Networks

| Blockchain | Networks | Type |
|------------|----------|------|
| **Optimism** | optimism, optimism-sepolia | Ethereum L2 |
| **Arbitrum** | arbitrum, arbitrum-sepolia | Ethereum L2 |
| **Stellar** | stellar-testnet, stellar-mainnet | Layer 0 |

## Installation

```bash
npm install @proofpass/blockchain
```

## Quick Start

### Choose Your Blockchain

```typescript
import { BlockchainManager } from '@proofpass/blockchain';

// Create manager
const manager = new BlockchainManager();

// Add Optimism (sepolia)
manager.addProvider({
  network: 'optimism-sepolia',
  privateKey: '0x...' // Ethereum private key
});

// Add Arbitrum (sepolia)
manager.addProvider({
  network: 'arbitrum-sepolia',
  privateKey: '0x...' // Ethereum private key
});

// Add Stellar (testnet)
manager.addProvider({
  network: 'stellar-testnet',
  privateKey: 'SCXXXXXX...' // Stellar secret key
});

// Set default network (optional)
manager.setDefaultNetwork('optimism-sepolia');
```

### Anchor Data

```typescript
// Anchor on default network (Optimism)
const result = await manager.getProvider().anchorData(
  '1234567890abcdef...', // Data hash (hex)
  { type: 'credential', version: '1.0' } // Optional metadata
);

console.log('Anchored on:', result.network);
console.log('TX Hash:', result.txHash);
console.log('Fee:', result.fee);

// Anchor on specific network (Arbitrum)
const arbitrumResult = await manager.getProvider('arbitrum-sepolia').anchorData(
  '1234567890abcdef...'
);

// Anchor on Stellar
const stellarResult = await manager.getProvider('stellar-testnet').anchorData(
  '1234567890abcdef...'
);
```

### Batch Anchoring

```typescript
const dataHashes = [
  '1234567890abcdef...',
  'abcdef1234567890...',
  'fedcba0987654321...'
];

// Batch anchor on Optimism
const batchResult = await manager.getProvider('optimism-sepolia').batchAnchorData(dataHashes);

console.log('Anchored:', batchResult.anchored);
console.log('Failed:', batchResult.failed);
console.log('Results:', batchResult.results);
```

### Verify Anchored Data

```typescript
// Verify that data was anchored in a transaction
const verification = await manager.getProvider('optimism-sepolia').verifyAnchor(
  'txHash123...', // Transaction hash
  '1234567890abcdef...' // Data hash
);

console.log('Valid:', verification.valid);
console.log('Timestamp:', verification.timestamp);
```

### Get Transaction Status

```typescript
const status = await manager.getProvider().getTransactionStatus('txHash123...');

console.log('Confirmed:', status.confirmed);
console.log('Confirmations:', status.confirmations);
console.log('Block:', status.blockNumber);
console.log('Fee:', status.fee);
```

### Estimate Fees

```typescript
// Estimate fee for single anchor
const fee = await manager.getProvider('optimism-sepolia').estimateFee(1);
console.log('Estimated fee:', fee);

// Estimate fee for batch of 10
const batchFee = await manager.getProvider('arbitrum-sepolia').estimateFee(10);
console.log('Batch fee:', batchFee);
```

### Check Balance

```typescript
const ethBalance = await manager.getProvider('optimism-sepolia').getBalance();
console.log('Balance:', ethBalance, 'ETH');

const arbBalance = await manager.getProvider('arbitrum-sepolia').getBalance();
console.log('Balance:', arbBalance, 'ETH');

const balance = await manager.getProvider('stellar-testnet').getBalance();
console.log('Balance:', balance, 'XLM');
```

## Direct Provider Usage

You can also use providers directly without the manager:

```typescript
import { OptimismProvider, ArbitrumProvider, StellarProvider } from '@proofpass/blockchain';

// Optimism
const optimism = new OptimismProvider('optimism-sepolia', '0x...', 'https://custom-rpc-url');
const optResult = await optimism.anchorData('hash...');

// Arbitrum
const arbitrum = new ArbitrumProvider('arbitrum-sepolia', '0x...');
const arbResult = await arbitrum.anchorData('hash...');

// Stellar
const stellar = new StellarProvider('stellar-testnet', 'SCXXXXXX...');
const result = await stellar.anchorData('hash...');
```

## Integration with ProofPass SDK

```typescript
import ProofPass from '@proofpass/client';
import { BlockchainManager } from '@proofpass/blockchain';
import { createHash } from 'crypto';

const proofpass = new ProofPass('your-api-key');
const blockchain = new BlockchainManager();

// Configure blockchains
blockchain.addProvider({
  network: 'optimism-sepolia',
  privateKey: process.env.ETH_PRIVATE_KEY!
});

blockchain.addProvider({
  network: 'arbitrum-sepolia',
  privateKey: process.env.ETH_PRIVATE_KEY!
});

blockchain.addProvider({
  network: 'stellar-testnet',
  privateKey: process.env.STELLAR_SECRET!
});

// Create attestation
const attestation = await proofpass.attestations.create({
  type: 'identity',
  subject: 'did:key:z6Mkf...',
  claims: { name: 'Alice', verified: true }
});

// Hash the credential
const credentialHash = createHash('sha256')
  .update(JSON.stringify(attestation.credential))
  .digest('hex');

// Anchor on Optimism
const optimismAnchor = await blockchain.getProvider('optimism-sepolia')
  .anchorData(credentialHash, {
    attestationId: attestation.id,
    type: attestation.type
  });

console.log('Anchored on Optimism:', optimismAnchor.txHash);

// Or anchor on Arbitrum
const arbitrumAnchor = await blockchain.getProvider('arbitrum-sepolia')
  .anchorData(credentialHash);

console.log('Anchored on Arbitrum:', arbitrumAnchor.txHash);

// Or anchor on Stellar
const stellarAnchor = await blockchain.getProvider('stellar-testnet')
  .anchorData(credentialHash);

console.log('Anchored on Stellar:', stellarAnchor.txHash);
```

## Use Cases

### 1. Multi-Chain Redundancy

Anchor the same credential hash on multiple blockchains for redundancy:

```typescript
const credentialHash = '1234567890abcdef...';

// Anchor on all available networks
const networks = manager.getNetworks();
const results = await Promise.all(
  networks.map(network =>
    manager.getProvider(network).anchorData(credentialHash)
  )
);

console.log('Anchored on', results.length, 'blockchains');
```

### 2. Cost Optimization

Choose the cheapest network based on current fees:

```typescript
async function anchorOnCheapest(manager: BlockchainManager, dataHash: string) {
  const networks = manager.getNetworks();

  // Get fee estimates
  const fees = await Promise.all(
    networks.map(async network => ({
      network,
      fee: await manager.getProvider(network).estimateFee()
    }))
  );

  // Sort by fee
  fees.sort((a, b) => parseFloat(a.fee) - parseFloat(b.fee));

  // Anchor on cheapest
  const cheapest = fees[0];
  return manager.getProvider(cheapest.network).anchorData(dataHash);
}
```

### 3. Network-Specific Requirements

Route based on requirements:

```typescript
function getNetworkForUseCase(useCase: string): BlockchainNetwork {
  switch (useCase) {
    case 'ethereum-ecosystem':
      return 'optimism'; // OP Stack ecosystem
    case 'high-frequency':
      return 'arbitrum-sepolia'; // Low fees, fast finality
    case 'maximum-decentralization':
      return 'stellar-mainnet'; // Stellar network
    default:
      return 'optimism-sepolia';
  }
}

const network = getNetworkForUseCase('high-frequency');
const result = await manager.getProvider(network).anchorData(hash);
```

## API Reference

### BlockchainManager

```typescript
class BlockchainManager {
  addProvider(config: BlockchainConfig): void
  getProvider(network?: BlockchainNetwork): BlockchainProvider
  setDefaultNetwork(network: BlockchainNetwork): void
  getNetworks(): BlockchainNetwork[]
  getDefaultNetwork(): BlockchainNetwork | undefined
  removeProvider(network: BlockchainNetwork): void
}
```

### BlockchainProvider

```typescript
abstract class BlockchainProvider {
  abstract anchorData(dataHash: string, metadata?: Record<string, any>): Promise<AnchorResult>
  abstract batchAnchorData(dataHashes: string[], metadata?: Record<string, any>): Promise<BatchAnchorResult>
  abstract getTransactionStatus(txHash: string): Promise<TransactionStatus>
  abstract verifyAnchor(txHash: string, dataHash: string): Promise<VerificationResult>
  abstract getBalance(): Promise<string>
  abstract estimateFee(dataCount?: number): Promise<string>
  getNetwork(): BlockchainNetwork
}
```

## TypeScript Support

Full TypeScript support with exported types:

```typescript
import type {
  BlockchainNetwork,
  BlockchainConfig,
  AnchorResult,
  BatchAnchorResult,
  TransactionStatus,
  VerificationResult
} from '@proofpass/blockchain';
```

## Environment Variables

```bash
# Stellar
STELLAR_SECRET_KEY=SCXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Ethereum L2s (Optimism & Arbitrum)
ETH_PRIVATE_KEY=0xabcdef1234567890...

# Optional: Custom RPC URLs
OPTIMISM_RPC_URL=https://custom-optimism-rpc.io
ARBITRUM_RPC_URL=https://custom-arbitrum-rpc.io
```

## Network Comparison

| Feature | Optimism | Arbitrum | Stellar |
|---------|----------|----------|---------|
| **Finality** | 1-2 seconds | 1-2 seconds | 3-5 seconds |
| **Cost** | Low (~$0.001-$0.01) | Very Low (~$0.0001-$0.001) | Very Low (~$0.00001) |
| **Throughput** | ~4000 TPS | ~4000 TPS | ~1000 TPS |
| **Ecosystem** | Ethereum L2 | Ethereum L2 | Stellar native |
| **Data size** | Unlimited | Unlimited | 64 bytes/op |
| **Batch limit** | Gas limit | Gas limit | 100 ops/tx |
| **Permanence** | ✅ Permanent | ✅ Permanent | ✅ Permanent |
| **Method** | Transaction data | Transaction data | manageData op |

## Data Permanence

### All 3 Blockchains Store Data PERMANENTLY

**Important:** Our implementation does NOT use Soroban (Stellar smart contracts with state archival). Instead, we use:

1. **Optimism**: Transaction data field
   - Data stored PERMANENTLY in L2 blocks
   - Immutable once confirmed
   - Cost: ~$0.001-$0.01 per transaction
   - Retrievable forever via RPC nodes

2. **Arbitrum**: Transaction data field
   - Data stored PERMANENTLY in L2 blocks
   - Immutable once confirmed
   - Cost: ~$0.0001-$0.001 per transaction
   - Retrievable forever via RPC nodes

3. **Stellar**: Native `manageData` operations
   - Data stored PERMANENTLY in the ledger
   - No expiration or state archival
   - Cost: ~$0.00001 per operation
   - Retrievable forever via Horizon API

### Cost Comparison (1000 anchors)

```
Optimism:  1000 × $0.005   = $5.00      (Good for Ethereum ecosystem)
Arbitrum:  1000 × $0.0005  = $0.50      (Very affordable)
Stellar:   1000 × $0.00001 = $0.01      (CHEAPEST)
```

### When to Use Each

- **Optimism**: When OP Stack ecosystem integration is needed
- **Arbitrum**: Best balance of cost and Ethereum ecosystem
- **Stellar**: Best for high-volume, low-cost anchoring

## Soroban vs Native Operations

**Why we DON'T use Soroban:**

| Feature | Soroban (Smart Contracts) | Native Operations |
|---------|---------------------------|-------------------|
| **Data persistence** | ❌ Temporary (state archival) | ✅ Permanent |
| **Cost to extend** | 💰 Ongoing fees | ✨ One-time fee |
| **Complexity** | 🔧 Requires contract deployment | 🎯 Simple operations |
| **Suitability** | ❌ Not ideal for anchoring | ✅ Perfect for anchoring |

Our implementation uses **native Stellar operations** which are permanent and don't require state rental or extension fees.

## License

LGPL-3.0

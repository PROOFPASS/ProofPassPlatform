/**
 * Zero-Knowledge Proof Toolkit
 * Production-ready zk-SNARKs using Groth16 proof system
 *
 * Features:
 * - Threshold proofs: Prove value >= threshold without revealing value
 * - Range proofs: Prove value in [min, max] without revealing value
 * - Set membership proofs: Prove value is in set without revealing which one
 * - Replay protection: Nullifier-based anti-replay mechanism
 *
 * All proofs use Groth16 zk-SNARKs with BN128 elliptic curve
 */

// Real zk-SNARK implementations (production-ready)
export * from './snark-proofs';

// Replay protection with nullifiers
export * from './replay-protection';

// Legacy simplified circuits (deprecated - use snark-proofs instead)
// These are hash-based proofs without zero-knowledge properties
// export * from './circuits';

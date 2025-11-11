/**
 * Tests for real zk-SNARK proofs
 *
 * NOTE: These tests require the circuits to be compiled and keys generated first.
 * Run: ./scripts/setup-circuits.sh
 */

import {
  generateThresholdProof,
  verifyThresholdProof,
  generateRangeProof,
  verifyRangeProof,
  generateSetMembershipProof,
  verifySetMembershipProof,
} from '../src/snark-proofs';
import * as fs from 'fs';
import * as path from 'path';

// Check if circuits are setup
const circuitsSetup = (): boolean => {
  try {
    const keysPath = path.join(__dirname, '..', 'keys', 'threshold_final.zkey');
    return fs.existsSync(keysPath);
  } catch {
    return false;
  }
};

describe('zk-SNARK Proofs', () => {
  // Skip all tests if circuits are not setup
  const skipIfNotSetup = circuitsSetup() ? describe : describe.skip;

  skipIfNotSetup('Threshold Proofs', () => {
    it('should generate and verify valid threshold proof', async () => {
      const proof = await generateThresholdProof({
        value: 25,
        threshold: 18,
      });

      expect(proof).toHaveProperty('proof');
      expect(proof).toHaveProperty('publicSignals');
      expect(proof).toHaveProperty('nullifierHash');

      const result = await verifyThresholdProof(
        proof.proof,
        proof.publicSignals
      );

      expect(result.verified).toBe(true);
      expect(result.error).toBeUndefined();
    }, 30000); // 30 second timeout for proof generation

    it('should reject invalid threshold proof (value < threshold)', async () => {
      await expect(
        generateThresholdProof({
          value: 15,
          threshold: 18,
        })
      ).rejects.toThrow('value does not meet threshold');
    });

    it('should generate different nullifiers for same value', async () => {
      const proof1 = await generateThresholdProof({
        value: 25,
        threshold: 18,
      });

      const proof2 = await generateThresholdProof({
        value: 25,
        threshold: 18,
      });

      // Proofs should be different (different nullifiers)
      expect(proof1.nullifierHash).not.toBe(proof2.nullifierHash);
    }, 30000);

    it('should reject tampered proof', async () => {
      const proof = await generateThresholdProof({
        value: 25,
        threshold: 18,
      });

      // Tamper with the proof
      const tamperedProof = JSON.parse(proof.proof);
      tamperedProof.pi_a[0] = '0';

      const result = await verifyThresholdProof(
        JSON.stringify(tamperedProof),
        proof.publicSignals
      );

      expect(result.verified).toBe(false);
    }, 30000);
  });

  skipIfNotSetup('Range Proofs', () => {
    it('should generate and verify valid range proof', async () => {
      const proof = await generateRangeProof({
        value: 35,
        min: 18,
        max: 65,
      });

      expect(proof).toHaveProperty('proof');
      expect(proof).toHaveProperty('publicSignals');
      expect(proof).toHaveProperty('nullifierHash');

      const result = await verifyRangeProof(
        proof.proof,
        proof.publicSignals
      );

      expect(result.verified).toBe(true);
    }, 30000);

    it('should reject value below range', async () => {
      await expect(
        generateRangeProof({
          value: 15,
          min: 18,
          max: 65,
        })
      ).rejects.toThrow('value not in range');
    });

    it('should reject value above range', async () => {
      await expect(
        generateRangeProof({
          value: 70,
          min: 18,
          max: 65,
        })
      ).rejects.toThrow('value not in range');
    });

    it('should accept value at min boundary', async () => {
      const proof = await generateRangeProof({
        value: 18,
        min: 18,
        max: 65,
      });

      const result = await verifyRangeProof(
        proof.proof,
        proof.publicSignals
      );

      expect(result.verified).toBe(true);
    }, 30000);

    it('should accept value at max boundary', async () => {
      const proof = await generateRangeProof({
        value: 65,
        min: 18,
        max: 65,
      });

      const result = await verifyRangeProof(
        proof.proof,
        proof.publicSignals
      );

      expect(result.verified).toBe(true);
    }, 30000);
  });

  skipIfNotSetup('Set Membership Proofs', () => {
    it('should generate and verify valid set membership proof', async () => {
      const validSet = ['apple', 'banana', 'cherry', 'date'];

      const proof = await generateSetMembershipProof({
        value: 'banana',
        set: validSet,
      });

      expect(proof).toHaveProperty('proof');
      expect(proof).toHaveProperty('publicSignals');
      expect(proof).toHaveProperty('nullifierHash');

      const result = await verifySetMembershipProof(
        proof.proof,
        proof.publicSignals
      );

      expect(result.verified).toBe(true);
    }, 30000);

    it('should reject value not in set', async () => {
      const validSet = ['apple', 'banana', 'cherry'];

      await expect(
        generateSetMembershipProof({
          value: 'orange',
          set: validSet,
        })
      ).rejects.toThrow('value not in set');
    });

    it('should work with numeric values', async () => {
      const validSet = [1, 2, 3, 4, 5];

      const proof = await generateSetMembershipProof({
        value: 3,
        set: validSet,
      });

      const result = await verifySetMembershipProof(
        proof.proof,
        proof.publicSignals
      );

      expect(result.verified).toBe(true);
    }, 30000);

    it('should work with single element set', async () => {
      const proof = await generateSetMembershipProof({
        value: 'only',
        set: ['only'],
      });

      const result = await verifySetMembershipProof(
        proof.proof,
        proof.publicSignals
      );

      expect(result.verified).toBe(true);
    }, 30000);
  });

  // If circuits not setup, show helpful message
  if (!circuitsSetup()) {
    it('should prompt to run circuit setup', () => {
      console.warn('\n⚠️  zk-SNARK tests skipped: Circuits not compiled\n');
      console.warn('Run the following command to setup circuits:\n');
      console.warn('  cd packages/zk-toolkit');
      console.warn('  ./scripts/setup-circuits.sh\n');
    });
  }
});

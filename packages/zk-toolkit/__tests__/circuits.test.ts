/**
 * Unit tests for ZK Proof Circuits
 * Tests proof generation and verification
 */

import {
  generateThresholdProof,
  verifyThresholdProof,
  generateRangeProof,
  verifyRangeProof,
  generateSetMembershipProof,
  verifySetMembershipProof,
  verifyProof,
} from '../src/circuits';

describe('ZK Proof Circuits', () => {
  describe('Threshold Proofs', () => {
    describe('generateThresholdProof', () => {
      it('should generate valid proof when value meets threshold', () => {
        const result = generateThresholdProof({
          value: 95,
          threshold: 90,
        });

        expect(result.proof).toBeDefined();
        expect(result.publicInputs).toBeDefined();
        expect(result.publicInputs.threshold).toBe(90);
        expect(result.publicInputs.commitment).toBeDefined();
      });

      it('should throw error when value below threshold', () => {
        expect(() => {
          generateThresholdProof({
            value: 85,
            threshold: 90,
          });
        }).toThrow('Invalid proof: value does not meet threshold');
      });

      it('should handle edge case where value equals threshold', () => {
        const result = generateThresholdProof({
          value: 90,
          threshold: 90,
        });

        expect(result.proof).toBeDefined();
        expect(result.publicInputs.threshold).toBe(90);
      });
    });

    describe('verifyThresholdProof', () => {
      it('should verify valid threshold proof', () => {
        const { proof, publicInputs } = generateThresholdProof({
          value: 95,
          threshold: 90,
        });

        const isValid = verifyThresholdProof(proof, publicInputs);
        expect(isValid).toBe(true);
      });

      it('should reject proof with wrong public inputs', () => {
        const { proof, publicInputs } = generateThresholdProof({
          value: 95,
          threshold: 90,
        });

        // Try with different threshold
        const isValid = verifyThresholdProof(proof, {
          ...publicInputs,
          threshold: 95,
        });
        expect(isValid).toBe(false);
      });

      it('should reject invalid proof format', () => {
        const isValid = verifyThresholdProof('invalid-proof', {
          threshold: 90,
          commitment: 'abc',
        });
        expect(isValid).toBe(false);
      });
    });
  });

  describe('Range Proofs', () => {
    describe('generateRangeProof', () => {
      it('should generate valid proof when value in range', () => {
        const result = generateRangeProof({
          value: 5,
          min: 2,
          max: 8,
        });

        expect(result.proof).toBeDefined();
        expect(result.publicInputs).toBeDefined();
        expect(result.publicInputs.min).toBe(2);
        expect(result.publicInputs.max).toBe(8);
        expect(result.publicInputs.commitment).toBeDefined();
      });

      it('should throw error when value below range', () => {
        expect(() => {
          generateRangeProof({
            value: 1,
            min: 2,
            max: 8,
          });
        }).toThrow('Invalid proof: value not in range');
      });

      it('should throw error when value above range', () => {
        expect(() => {
          generateRangeProof({
            value: 9,
            min: 2,
            max: 8,
          });
        }).toThrow('Invalid proof: value not in range');
      });

      it('should handle edge cases at boundaries', () => {
        // Value at min boundary
        const result1 = generateRangeProof({
          value: 2,
          min: 2,
          max: 8,
        });
        expect(result1.proof).toBeDefined();

        // Value at max boundary
        const result2 = generateRangeProof({
          value: 8,
          min: 2,
          max: 8,
        });
        expect(result2.proof).toBeDefined();
      });
    });

    describe('verifyRangeProof', () => {
      it('should verify valid range proof', () => {
        const { proof, publicInputs } = generateRangeProof({
          value: 5,
          min: 2,
          max: 8,
        });

        const isValid = verifyRangeProof(proof, publicInputs);
        expect(isValid).toBe(true);
      });

      it('should reject proof with tampered public inputs', () => {
        const { proof, publicInputs } = generateRangeProof({
          value: 5,
          min: 2,
          max: 8,
        });

        const isValid = verifyRangeProof(proof, {
          ...publicInputs,
          min: 3,
        });
        expect(isValid).toBe(false);
      });

      it('should reject invalid proof format', () => {
        const isValid = verifyRangeProof('invalid', {
          min: 2,
          max: 8,
          commitment: 'abc',
        });
        expect(isValid).toBe(false);
      });
    });
  });

  describe('Set Membership Proofs', () => {
    describe('generateSetMembershipProof', () => {
      it('should generate valid proof when value in set', () => {
        const result = generateSetMembershipProof({
          value: 'Supplier-B',
          set: ['Supplier-A', 'Supplier-B', 'Supplier-C'],
        });

        expect(result.proof).toBeDefined();
        expect(result.publicInputs).toBeDefined();
        expect(result.publicInputs.setHash).toBeDefined();
        expect(result.publicInputs.commitment).toBeDefined();
        expect(result.publicInputs.setSize).toBe(3);
      });

      it('should throw error when value not in set', () => {
        expect(() => {
          generateSetMembershipProof({
            value: 'Supplier-D',
            set: ['Supplier-A', 'Supplier-B', 'Supplier-C'],
          });
        }).toThrow('Invalid proof: value not in set');
      });

      it('should handle complex objects in set', () => {
        const result = generateSetMembershipProof({
          value: { id: 2, name: 'Item-B' },
          set: [
            { id: 1, name: 'Item-A' },
            { id: 2, name: 'Item-B' },
            { id: 3, name: 'Item-C' },
          ],
        });

        expect(result.proof).toBeDefined();
        expect(result.publicInputs.setSize).toBe(3);
      });

      it('should handle numbers in set', () => {
        const result = generateSetMembershipProof({
          value: 42,
          set: [10, 20, 42, 50],
        });

        expect(result.proof).toBeDefined();
      });
    });

    describe('verifySetMembershipProof', () => {
      it('should verify valid set membership proof', () => {
        const { proof, publicInputs } = generateSetMembershipProof({
          value: 'Supplier-B',
          set: ['Supplier-A', 'Supplier-B', 'Supplier-C'],
        });

        const isValid = verifySetMembershipProof(proof, publicInputs);
        expect(isValid).toBe(true);
      });

      it('should reject proof with wrong set hash', () => {
        const { proof, publicInputs } = generateSetMembershipProof({
          value: 'Supplier-B',
          set: ['Supplier-A', 'Supplier-B', 'Supplier-C'],
        });

        const isValid = verifySetMembershipProof(proof, {
          ...publicInputs,
          setHash: 'different-hash',
        });
        expect(isValid).toBe(false);
      });

      it('should reject invalid proof format', () => {
        const isValid = verifySetMembershipProof('invalid', {
          setHash: 'abc',
          commitment: 'def',
          setSize: 3,
        });
        expect(isValid).toBe(false);
      });
    });
  });

  describe('Generic verifyProof', () => {
    it('should dispatch to correct verifier for threshold', () => {
      const { proof, publicInputs } = generateThresholdProof({
        value: 95,
        threshold: 90,
      });

      const isValid = verifyProof('threshold', proof, publicInputs);
      expect(isValid).toBe(true);
    });

    it('should dispatch to correct verifier for range', () => {
      const { proof, publicInputs } = generateRangeProof({
        value: 5,
        min: 2,
        max: 8,
      });

      const isValid = verifyProof('range', proof, publicInputs);
      expect(isValid).toBe(true);
    });

    it('should dispatch to correct verifier for set_membership', () => {
      const { proof, publicInputs } = generateSetMembershipProof({
        value: 'B',
        set: ['A', 'B', 'C'],
      });

      const isValid = verifyProof('set_membership', proof, publicInputs);
      expect(isValid).toBe(true);
    });

    it('should return false for unknown circuit type', () => {
      const isValid = verifyProof('unknown' as any, '{}', {});
      expect(isValid).toBe(false);
    });
  });
});

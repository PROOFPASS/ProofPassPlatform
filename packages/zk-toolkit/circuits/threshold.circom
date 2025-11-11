pragma circom 2.0.0;

include "circomlib/circuits/comparators.circom";
include "circomlib/circuits/poseidon.circom";

/*
 * ThresholdProof Circuit
 *
 * Proves that a private value is greater than or equal to a threshold
 * without revealing the actual value.
 *
 * Public Inputs:
 *   - threshold: The minimum value required
 *   - nullifierHash: Unique identifier to prevent reuse
 *
 * Private Inputs:
 *   - value: The actual value (kept secret)
 *   - nullifier: Random value for uniqueness
 *
 * Constraints:
 *   - value >= threshold
 *   - nullifierHash = Poseidon(value, nullifier)
 */
template ThresholdProof() {
    // Private inputs
    signal input value;
    signal input nullifier;

    // Public inputs
    signal input threshold;

    // Public outputs
    signal output nullifierHash;
    signal output valid;

    // Constraint 1: Check that value >= threshold
    component greaterEqThan = GreaterEqThan(64);
    greaterEqThan.in[0] <== value;
    greaterEqThan.in[1] <== threshold;

    // The comparison result must be 1 (true)
    greaterEqThan.out === 1;

    // Constraint 2: Generate nullifier hash to prevent reuse
    // Using Poseidon hash for efficiency in ZK circuits
    component poseidon = Poseidon(2);
    poseidon.inputs[0] <== value;
    poseidon.inputs[1] <== nullifier;
    nullifierHash <== poseidon.out;

    // Output valid signal
    valid <== 1;
}

// Main component
component main {public [threshold]} = ThresholdProof();

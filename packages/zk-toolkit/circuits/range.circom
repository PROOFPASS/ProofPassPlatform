pragma circom 2.0.0;

include "circomlib/circuits/comparators.circom";
include "circomlib/circuits/poseidon.circom";

/*
 * RangeProof Circuit
 *
 * Proves that a private value is within a specified range [min, max]
 * without revealing the actual value.
 *
 * Public Inputs:
 *   - minValue: Minimum allowed value (inclusive)
 *   - maxValue: Maximum allowed value (inclusive)
 *
 * Private Inputs:
 *   - value: The actual value (kept secret)
 *   - nullifier: Random value for uniqueness
 *
 * Outputs:
 *   - nullifierHash: Unique identifier
 *   - valid: 1 if value is in range, 0 otherwise
 *
 * Constraints:
 *   - value >= minValue
 *   - value <= maxValue
 */
template RangeProof() {
    // Private inputs
    signal input value;
    signal input nullifier;

    // Public inputs
    signal input minValue;
    signal input maxValue;

    // Public outputs
    signal output nullifierHash;
    signal output valid;

    // Constraint 1: Check that value >= minValue
    component greaterEqThanMin = GreaterEqThan(64);
    greaterEqThanMin.in[0] <== value;
    greaterEqThanMin.in[1] <== minValue;

    // Constraint 2: Check that value <= maxValue
    component lessEqThanMax = LessEqThan(64);
    lessEqThanMax.in[0] <== value;
    lessEqThanMax.in[1] <== maxValue;

    // Both constraints must be satisfied
    signal lowerBoundCheck <== greaterEqThanMin.out;
    signal upperBoundCheck <== lessEqThanMax.out;

    // Multiply checks: both must be 1
    signal rangeCheck <== lowerBoundCheck * upperBoundCheck;
    rangeCheck === 1;

    // Generate nullifier hash to prevent reuse
    component poseidon = Poseidon(2);
    poseidon.inputs[0] <== value;
    poseidon.inputs[1] <== nullifier;
    nullifierHash <== poseidon.out;

    // Output valid signal
    valid <== 1;
}

// Main component
component main {public [minValue, maxValue]} = RangeProof();

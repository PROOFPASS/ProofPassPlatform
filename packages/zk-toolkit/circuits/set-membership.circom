pragma circom 2.0.0;

include "circomlib/circuits/comparators.circom";
include "circomlib/circuits/poseidon.circom";

/*
 * SetMembershipProof Circuit
 *
 * Proves that a private value is a member of a predefined set
 * without revealing which specific member it is.
 *
 * Public Inputs:
 *   - setSize: Size of the set (max 10 for this implementation)
 *   - setHashes[10]: Hashes of the valid set members
 *
 * Private Inputs:
 *   - value: The actual value (kept secret)
 *   - nullifier: Random value for uniqueness
 *
 * Outputs:
 *   - nullifierHash: Unique identifier
 *   - valid: 1 if value is in set, 0 otherwise
 */
template SetMembershipProof(maxSetSize) {
    // Private inputs
    signal input value;
    signal input nullifier;

    // Public inputs
    signal input setHashes[maxSetSize];

    // Public outputs
    signal output nullifierHash;
    signal output valid;

    // Hash the input value
    component valueHasher = Poseidon(1);
    valueHasher.inputs[0] <== value;
    signal valueHash <== valueHasher.out;

    // Check membership: at least one hash must match
    signal matchResults[maxSetSize];
    signal accumulator[maxSetSize + 1];
    accumulator[0] <== 0;

    component comparators[maxSetSize];

    for (var i = 0; i < maxSetSize; i++) {
        // Check if valueHash equals setHashes[i]
        comparators[i] = IsEqual();
        comparators[i].in[0] <== valueHash;
        comparators[i].in[1] <== setHashes[i];
        matchResults[i] <== comparators[i].out;

        // Accumulate matches
        accumulator[i + 1] <== accumulator[i] + matchResults[i];
    }

    // At least one match must exist
    component isValid = GreaterThan(8);
    isValid.in[0] <== accumulator[maxSetSize];
    isValid.in[1] <== 0;

    // Output validity
    valid <== isValid.out;

    // Generate nullifier hash
    component nullifierHasher = Poseidon(2);
    nullifierHasher.inputs[0] <== value;
    nullifierHasher.inputs[1] <== nullifier;
    nullifierHash <== nullifierHasher.out;

    // Ensure the proof is valid
    valid === 1;
}

// Main component - supporting sets up to 10 elements
component main {public [setHashes]} = SetMembershipProof(10);

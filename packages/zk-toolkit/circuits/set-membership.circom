pragma circom 2.0.0;

include "circomlib/circuits/comparators.circom";
include "circomlib/circuits/poseidon.circom";

/*
 * SetMembershipProof Circuit (v2 - Pre-hashed)
 *
 * Proves that a private value hash is a member of a predefined set of hashes
 * without revealing which specific member it is.
 *
 * This version accepts pre-computed hashes, allowing flexibility in how
 * values are hashed outside the circuit (e.g., using SHA-256 to field element).
 *
 * Public Inputs:
 *   - setHashes[10]: Hashes of the valid set members
 *
 * Private Inputs:
 *   - valueHash: Hash of the actual value (kept secret)
 *   - nullifier: Random value for uniqueness
 *
 * Outputs:
 *   - nullifierHash: Unique identifier for the proof
 *   - valid: 1 if valueHash is in setHashes, 0 otherwise
 */
template SetMembershipProof(maxSetSize) {
    // Private inputs
    signal input valueHash;  // Pre-computed hash of the value
    signal input nullifier;

    // Public inputs - the set of valid hashes
    signal input setHashes[maxSetSize];

    // Public outputs
    signal output nullifierHash;
    signal output valid;

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

    // Generate nullifier hash using Poseidon
    component nullifierHasher = Poseidon(2);
    nullifierHasher.inputs[0] <== valueHash;
    nullifierHasher.inputs[1] <== nullifier;
    nullifierHash <== nullifierHasher.out;

    // Constraint: the proof must be valid
    valid === 1;
}

// Main component - supporting sets up to 10 elements
component main {public [setHashes]} = SetMembershipProof(10);

#!/bin/bash

# Trusted Setup Script for zk-SNARKs
# Performs Powers of Tau ceremony and generates proving/verification keys
# Usage: bash scripts/trusted-setup.sh

set -e  # Exit on error

echo "🔐 Starting Trusted Setup for zk-SNARKs..."
echo ""

# Define directories
BUILD_DIR="build"
KEYS_DIR="keys"

# Create keys directory if it doesn't exist
mkdir -p "$KEYS_DIR"

# Define circuits
CIRCUITS=("threshold" "range" "set-membership")

# ============================================================================
# PHASE 1: Powers of Tau (Universal Ceremony - can be reused)
# ============================================================================

echo "📜 Phase 1: Powers of Tau Ceremony"
echo "   This generates universal parameters that can be reused for all circuits."
echo ""

# Powers of Tau for circuits up to 2^12 = 4096 constraints
# Our circuits have ~600-1000 constraints, so 2^12 is sufficient
PTAU_FILE="$KEYS_DIR/powersOfTau28_hez_final_12.ptau"

# Check if Powers of Tau file already exists
if [ -f "$PTAU_FILE" ]; then
    echo "✅ Powers of Tau file already exists: $PTAU_FILE"
    echo "   Skipping Phase 1..."
else
    echo "⏳ Generating new Powers of Tau (this may take a few minutes)..."

    # Start new Powers of Tau ceremony
    snarkjs powersoftau new bn128 12 "$KEYS_DIR/pot12_0000.ptau" -v

    # Contribute to the ceremony (adds randomness)
    snarkjs powersoftau contribute \
        "$KEYS_DIR/pot12_0000.ptau" \
        "$KEYS_DIR/pot12_0001.ptau" \
        --name="First contribution" \
        -v -e="$(head -c 32 /dev/urandom | base64)"

    # Prepare phase 2
    snarkjs powersoftau prepare phase2 \
        "$KEYS_DIR/pot12_0001.ptau" \
        "$PTAU_FILE" \
        -v

    # Cleanup intermediate files
    rm -f "$KEYS_DIR/pot12_0000.ptau" "$KEYS_DIR/pot12_0001.ptau"

    echo "✅ Powers of Tau ceremony completed!"
fi

echo ""

# ============================================================================
# PHASE 2: Circuit-Specific Setup (per circuit)
# ============================================================================

echo "📜 Phase 2: Circuit-Specific Setup"
echo "   Generating proving and verification keys for each circuit..."
echo ""

for circuit in "${CIRCUITS[@]}"; do
    echo "🔑 Processing $circuit..."

    R1CS_FILE="$BUILD_DIR/${circuit}.r1cs"
    ZKEY_FILE="$KEYS_DIR/${circuit}_final.zkey"
    VKEY_FILE="$KEYS_DIR/${circuit}_verification_key.json"

    # Check if keys already exist
    if [ -f "$ZKEY_FILE" ] && [ -f "$VKEY_FILE" ]; then
        echo "   ✅ Keys already exist for $circuit"
        continue
    fi

    # Generate initial zkey
    echo "   📝 Generating initial zkey..."
    snarkjs groth16 setup \
        "$R1CS_FILE" \
        "$PTAU_FILE" \
        "$KEYS_DIR/${circuit}_0000.zkey"

    # Contribute to phase 2 (adds circuit-specific randomness)
    echo "   🎲 Adding randomness contribution..."
    snarkjs zkey contribute \
        "$KEYS_DIR/${circuit}_0000.zkey" \
        "$ZKEY_FILE" \
        --name="First contribution" \
        -v -e="$(head -c 32 /dev/urandom | base64)"

    # Export verification key
    echo "   📤 Exporting verification key..."
    snarkjs zkey export verificationkey \
        "$ZKEY_FILE" \
        "$VKEY_FILE"

    # Cleanup intermediate files
    rm -f "$KEYS_DIR/${circuit}_0000.zkey"

    echo "   ✅ Keys generated for $circuit"
    echo "      - Proving key: $ZKEY_FILE"
    echo "      - Verification key: $VKEY_FILE"
    echo ""
done

echo ""
echo "✨ Trusted Setup completed successfully!"
echo ""
echo "📊 Summary:"
echo "   - Powers of Tau: $PTAU_FILE"
for circuit in "${CIRCUITS[@]}"; do
    ZKEY_SIZE=$(du -h "$KEYS_DIR/${circuit}_final.zkey" | cut -f1)
    echo "   - $circuit: ${ZKEY_SIZE} (proving key)"
done
echo ""
echo "🎯 Next steps:"
echo "   1. Build the TypeScript package: npm run build"
echo "   2. Test the ZKP implementation: npm run circuits:test"
echo "   3. Update exports in src/index.ts to use SNARKs"
echo ""
echo "⚠️  SECURITY NOTE:"
echo "   This is a development setup with single contribution."
echo "   For production, use a multi-party computation (MPC) ceremony"
echo "   with multiple independent contributors for maximum security."

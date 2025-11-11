#!/bin/bash

# Script to compile Circom circuits to WASM and R1CS files
# Usage: bash scripts/compile-circuits.sh

set -e  # Exit on error

echo "🔨 Compiling Circom circuits..."

# Define directories
CIRCUITS_DIR="circuits"
BUILD_DIR="build"

# Create build directory if it doesn't exist
mkdir -p "$BUILD_DIR"

# Array of circuits to compile
CIRCUITS=("threshold" "range" "set-membership")

for circuit in "${CIRCUITS[@]}"; do
    echo ""
    echo "📐 Compiling $circuit.circom..."

    # Compile circuit to WASM + R1CS
    # --r1cs: Generate R1CS constraint system file
    # --wasm: Generate WASM for proof generation
    # --sym: Generate symbols file for debugging
    # -o: Output directory
    circom "$CIRCUITS_DIR/$circuit.circom" \
        --r1cs \
        --wasm \
        --sym \
        --c \
        -o "$BUILD_DIR" \
        -l "$CIRCUITS_DIR/node_modules"

    echo "✅ $circuit.circom compiled successfully"
    echo "   - WASM: $BUILD_DIR/${circuit}_js/${circuit}.wasm"
    echo "   - R1CS: $BUILD_DIR/${circuit}.r1cs"
    echo "   - Symbols: $BUILD_DIR/${circuit}.sym"
done

echo ""
echo "✨ All circuits compiled successfully!"
echo ""
echo "📊 Circuit Information:"
snarkjs r1cs info "$BUILD_DIR/threshold.r1cs"
echo ""
snarkjs r1cs info "$BUILD_DIR/range.r1cs"
echo ""
snarkjs r1cs info "$BUILD_DIR/set-membership.r1cs"
echo ""
echo "🎯 Next step: Run 'npm run circuits:setup' to perform trusted setup"

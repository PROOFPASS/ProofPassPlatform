#!/bin/bash

set -e

echo "🔧 Setting up zk-SNARK circuits..."
echo ""

# Create directories
mkdir -p build
mkdir -p keys

# Download Powers of Tau file if not exists
PTAU_FILE="keys/powersOfTau28_hez_final_12.ptau"
if [ ! -f "$PTAU_FILE" ]; then
    echo "📥 Downloading Powers of Tau file..."
    curl -L https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_12.ptau -o "$PTAU_FILE"
    echo "✅ Powers of Tau downloaded"
else
    echo "✅ Powers of Tau file already exists"
fi
echo ""

# Function to compile and setup a circuit
setup_circuit() {
    local circuit_name=$1
    echo "🔨 Setting up $circuit_name circuit..."

    # Step 1: Compile circuit
    echo "  1️⃣  Compiling circuit..."
    circom "circuits/${circuit_name}.circom" \
        --r1cs \
        --wasm \
        --sym \
        -l circuits \
        --output build

    # Step 2: Generate zkey (proving key)
    echo "  2️⃣  Generating proving key..."
    npx snarkjs groth16 setup \
        "build/${circuit_name}.r1cs" \
        "$PTAU_FILE" \
        "keys/${circuit_name}_0000.zkey"

    # Step 3: Contribute to ceremony (adds randomness)
    echo "  3️⃣  Contributing randomness..."
    npx snarkjs zkey contribute \
        "keys/${circuit_name}_0000.zkey" \
        "keys/${circuit_name}_final.zkey" \
        --name="First contribution" \
        -v \
        -e="random entropy $(date +%s)"

    # Step 4: Export verification key
    echo "  4️⃣  Exporting verification key..."
    npx snarkjs zkey export verificationkey \
        "keys/${circuit_name}_final.zkey" \
        "keys/${circuit_name}_verification_key.json"

    # Clean up intermediate files
    rm "keys/${circuit_name}_0000.zkey"

    echo "✅ $circuit_name circuit setup complete!"
    echo ""
}

# Setup all circuits
setup_circuit "threshold"
setup_circuit "set-membership"
setup_circuit "range"

echo ""
echo "🎉 All circuits compiled and keys generated successfully!"
echo ""
echo "📂 Generated files:"
echo "   - build/*.r1cs (constraint systems)"
echo "   - build/*.wasm (witness generators)"
echo "   - keys/*_final.zkey (proving keys)"
echo "   - keys/*_verification_key.json (verification keys)"
echo ""
echo "⚠️  SECURITY NOTE:"
echo "   The proving keys generated here are for development only."
echo "   For production, conduct a proper trusted setup ceremony with"
echo "   multiple independent participants."
echo ""

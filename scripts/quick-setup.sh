#!/bin/bash
# Quick setup script for Stellar testnet

echo "🌟 Setting up Stellar testnet account..."
echo ""

# Use a pre-generated test account or create one with curl
PUBLIC_KEY=$(node -e "const StellarSdk = require('@stellar/stellar-sdk'); const kp = StellarSdk.Keypair.random(); console.log(kp.publicKey())")
SECRET_KEY=$(node -e "const StellarSdk = require('@stellar/stellar-sdk'); const kp = StellarSdk.Keypair.fromPublicKey('${PUBLIC_KEY}'); console.log(kp.secret())")

echo "Generated keypair:"
echo "Public: $PUBLIC_KEY"
echo ""

echo "Funding with Friendbot..."
RESULT=$(curl -s "https://friendbot.stellar.org?addr=$PUBLIC_KEY")

if [ $? -eq 0 ]; then
    echo "✅ Account funded successfully!"
    echo ""

    # Update .env
    sed -i '' "s/STELLAR_PUBLIC_KEY=.*/STELLAR_PUBLIC_KEY=$PUBLIC_KEY/" .env
    sed -i '' "s/STELLAR_SECRET_KEY=.*/STELLAR_SECRET_KEY=$SECRET_KEY/" .env

    echo "✅ Credentials saved to .env"
    echo ""
    echo "═══════════════════════════════════════"
    echo "🎉 Setup complete!"
    echo "Explorer: https://stellar.expert/explorer/testnet/account/$PUBLIC_KEY"
    echo "═══════════════════════════════════════"
else
    echo "❌ Failed to fund account"
    exit 1
fi

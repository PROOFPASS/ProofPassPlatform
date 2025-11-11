#!/bin/bash
# Setup script for Stellar testnet

echo "🌟 Setting up Stellar testnet account..."
echo ""

# Generate keypair using Node.js
KEYS=$(node -e "
const StellarSdk = require('@stellar/stellar-sdk');
const kp = StellarSdk.Keypair.random();
console.log(JSON.stringify({
  public: kp.publicKey(),
  secret: kp.secret()
}));
")

PUBLIC_KEY=$(echo $KEYS | node -e "const data = JSON.parse(require('fs').readFileSync(0, 'utf-8')); console.log(data.public);")
SECRET_KEY=$(echo $KEYS | node -e "const data = JSON.parse(require('fs').readFileSync(0, 'utf-8')); console.log(data.secret);")

echo "Generated keypair:"
echo "Public: $PUBLIC_KEY"
echo ""

echo "Funding with Friendbot..."
RESULT=$(curl -s -w "%{http_code}" "https://friendbot.stellar.org?addr=$PUBLIC_KEY")
HTTP_CODE="${RESULT:(-3)}"

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Account funded successfully!"
    echo ""

    # Update .env
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s/STELLAR_PUBLIC_KEY=.*/STELLAR_PUBLIC_KEY=$PUBLIC_KEY/" .env
        sed -i '' "s/STELLAR_SECRET_KEY=.*/STELLAR_SECRET_KEY=$SECRET_KEY/" .env
    else
        sed -i "s/STELLAR_PUBLIC_KEY=.*/STELLAR_PUBLIC_KEY=$PUBLIC_KEY/" .env
        sed -i "s/STELLAR_SECRET_KEY=.*/STELLAR_SECRET_KEY=$SECRET_KEY/" .env
    fi

    echo "✅ Credentials saved to .env"
    echo ""
    echo "═══════════════════════════════════════"
    echo "🎉 Setup complete!"
    echo "Explorer: https://stellar.expert/explorer/testnet/account/$PUBLIC_KEY"
    echo "═══════════════════════════════════════"
else
    echo "❌ Failed to fund account (HTTP $HTTP_CODE)"
    exit 1
fi

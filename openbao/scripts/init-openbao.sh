#!/bin/bash

# OpenBao Initialization Script for ProofPass
# This script initializes OpenBao with the necessary secrets engines and policies

set -e

OPENBAO_ADDR=${OPENBAO_ADDR:-"http://localhost:8200"}
OPENBAO_TOKEN=${OPENBAO_TOKEN:-"dev-root-token-proofpass"}

echo "🔐 Initializing OpenBao for ProofPass..."

# Wait for OpenBao to be ready
echo "⏳ Waiting for OpenBao to be ready..."
until curl -sf ${OPENBAO_ADDR}/v1/sys/health > /dev/null 2>&1; do
    echo "   Waiting for OpenBao..."
    sleep 2
done
echo "✓ OpenBao is ready"

# Set OpenBao token
export OPENBAO_TOKEN=${OPENBAO_TOKEN}

# Enable KV v2 secrets engine
echo "📦 Enabling KV v2 secrets engine..."
bao secrets enable -version=2 -path=secret kv 2>/dev/null || echo "   KV engine already enabled"

# Enable Transit secrets engine (for encryption as a service)
echo "🔒 Enabling Transit secrets engine..."
bao secrets enable transit 2>/dev/null || echo "   Transit engine already enabled"

# Create encryption key for ProofPass
echo "🔑 Creating encryption key..."
bao write -f transit/keys/proofpass 2>/dev/null || echo "   Encryption key already exists"

# Enable PKI secrets engine
echo "📜 Enabling PKI secrets engine..."
bao secrets enable pki 2>/dev/null || echo "   PKI engine already enabled"

# Configure PKI
echo "⚙️  Configuring PKI..."
bao secrets tune -max-lease-ttl=87600h pki 2>/dev/null || true

# Create ProofPass root CA
bao write -field=certificate pki/root/generate/internal \
    common_name="ProofPass Root CA" \
    issuer_name="proofpass-root" \
    ttl=87600h 2>/dev/null || echo "   Root CA already exists"

# Configure PKI URLs
bao write pki/config/urls \
    issuing_certificates="${OPENBAO_ADDR}/v1/pki/ca" \
    crl_distribution_points="${OPENBAO_ADDR}/v1/pki/crl" 2>/dev/null || true

# Create PKI role
echo "📋 Creating PKI role..."
bao write pki/roles/proofpass-role \
    allowed_domains="proofpass.com,*.proofpass.com" \
    allow_subdomains=true \
    max_ttl=720h 2>/dev/null || echo "   PKI role already exists"

# Create policy for ProofPass application
echo "📄 Creating ProofPass application policy..."
bao policy write proofpass-app /openbao/policies/proofpass-app-policy.hcl 2>/dev/null || \
    echo "   Policy already exists"

# Create a token with the policy for the application
echo "🎫 Creating application token..."
APP_TOKEN=$(bao token create -policy=proofpass-app -period=24h -format=json 2>/dev/null | jq -r '.auth.client_token')

if [ ! -z "$APP_TOKEN" ]; then
    echo "✅ Application token created: ${APP_TOKEN}"
    echo "   Save this token in your .env file as OPENBAO_TOKEN"
else
    echo "⚠️  Failed to create application token"
fi

# Create initial structure for DID keys
echo "📁 Creating initial secret structure..."
bao kv put secret/did-keys/.keep value="placeholder" 2>/dev/null || true
bao kv put secret/organizations/.keep value="placeholder" 2>/dev/null || true
bao kv put secret/api-keys/.keep value="placeholder" 2>/dev/null || true

echo ""
echo "✅ OpenBao initialization complete!"
echo ""
echo "📝 Configuration Summary:"
echo "   - OpenBao Address: ${OPENBAO_ADDR}"
echo "   - Root Token: ${OPENBAO_TOKEN}"
echo "   - App Token: ${APP_TOKEN}"
echo ""
echo "🔗 OpenBao UI: ${OPENBAO_ADDR}/ui"
echo ""
echo "Next steps:"
echo "1. Add OPENBAO_TOKEN to your .env file"
echo "2. Start using OpenBao in your application"
echo "3. Rotate the root token for production use"

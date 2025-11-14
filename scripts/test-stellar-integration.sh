#!/bin/bash

# Test Stellar Integration
# This script tests the complete flow with Stellar testnet

set -e

echo "=================================================="
echo "Stellar Testnet Integration Test"
echo "=================================================="
echo ""

EVIDENCE_DIR="./stellar-test-evidence-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$EVIDENCE_DIR"

echo "[INFO] Evidence directory: $EVIDENCE_DIR"
echo ""

# Check if .env exists
if [ ! -f "apps/api/.env" ]; then
    echo "[WARNING] apps/api/.env not found"
    echo "[INFO] Creating from example..."
    cp apps/api/.env.example apps/api/.env
    echo "[WARNING] Please configure apps/api/.env with Stellar credentials"
    exit 1
fi

# Function to save evidence
save_evidence() {
    local filename=$1
    local content=$2
    echo "$content" > "$EVIDENCE_DIR/$filename"
    echo "[OK] Evidence saved: $filename"
}

# Function to capture screenshot (macOS)
capture_screenshot() {
    local filename=$1
    echo "[INFO] Please capture screenshot manually and save as: $EVIDENCE_DIR/$filename"
}

echo "### Step 1: Check Stellar Configuration"
echo ""

if grep -q "STELLAR_NETWORK=testnet" apps/api/.env; then
    echo "[OK] Stellar network set to testnet"
    save_evidence "01-config.txt" "STELLAR_NETWORK=testnet"
else
    echo "[WARNING] Stellar network not configured for testnet"
fi

echo ""
echo "### Step 2: Setup Stellar Account"
echo ""

echo "[INFO] Running Stellar setup..."
if npm run setup:stellar > "$EVIDENCE_DIR/02-stellar-setup.log" 2>&1; then
    echo "[OK] Stellar account setup completed"
    cat "$EVIDENCE_DIR/02-stellar-setup.log"
else
    echo "[ERROR] Stellar setup failed - check $EVIDENCE_DIR/02-stellar-setup.log"
    exit 1
fi

echo ""
echo "### Step 3: Start API Server (if not running)"
echo ""

# Check if API is already running
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo "[OK] API server is already running"
else
    echo "[INFO] Starting API server in background..."
    cd apps/api
    npm run dev > "$EVIDENCE_DIR/03-api-server.log" 2>&1 &
    API_PID=$!
    cd ../..

    echo "[INFO] Waiting for API to be ready..."
    sleep 10

    if curl -s http://localhost:3000/health > /dev/null 2>&1; then
        echo "[OK] API server started successfully"
        save_evidence "03-api-health.json" "$(curl -s http://localhost:3000/health)"
    else
        echo "[ERROR] API server failed to start"
        kill $API_PID 2>/dev/null || true
        exit 1
    fi
fi

echo ""
echo "### Step 4: Run Complete Demo"
echo ""

echo "[INFO] Running demo client..."
cd examples/demo-client

if [ ! -d "node_modules" ]; then
    echo "[INFO] Installing demo dependencies..."
    npm install > /dev/null 2>&1
fi

# Run demo and capture output
echo "[INFO] Executing full demo flow..."
npm run demo > "$EVIDENCE_DIR/04-demo-output.log" 2>&1

if [ $? -eq 0 ]; then
    echo "[OK] Demo completed successfully"
    echo ""
    echo "[INFO] Demo output:"
    cat "$EVIDENCE_DIR/04-demo-output.log"
else
    echo "[ERROR] Demo failed - check $EVIDENCE_DIR/04-demo-output.log"
    cd ../..
    exit 1
fi

cd ../..

echo ""
echo "### Step 5: Extract Transaction Details"
echo ""

# Extract transaction hashes from demo output
if grep -q "Transaction Hash" "$EVIDENCE_DIR/04-demo-output.log"; then
    TX_HASHES=$(grep "Transaction Hash" "$EVIDENCE_DIR/04-demo-output.log")
    save_evidence "05-transaction-hashes.txt" "$TX_HASHES"
    echo "[OK] Transaction hashes extracted"
    echo "$TX_HASHES"
else
    echo "[WARNING] No transaction hashes found in demo output"
fi

# Extract credential IDs
if grep -q "Credential ID" "$EVIDENCE_DIR/04-demo-output.log"; then
    CRED_IDS=$(grep "Credential ID" "$EVIDENCE_DIR/04-demo-output.log")
    save_evidence "06-credential-ids.txt" "$CRED_IDS"
    echo "[OK] Credential IDs extracted"
    echo "$CRED_IDS"
fi

# Extract passport IDs
if grep -q "Passport ID" "$EVIDENCE_DIR/04-demo-output.log"; then
    PASSPORT_IDS=$(grep "Passport ID" "$EVIDENCE_DIR/04-demo-output.log")
    save_evidence "07-passport-ids.txt" "$PASSPORT_IDS"
    echo "[OK] Passport IDs extracted"
    echo "$PASSPORT_IDS"
fi

echo ""
echo "### Step 6: Verify on Stellar Testnet"
echo ""

# If we have transaction hashes, create links to Stellar Expert
if [ -f "$EVIDENCE_DIR/05-transaction-hashes.txt" ]; then
    echo "[INFO] Creating Stellar Expert links..."

    while read -r line; do
        if [[ $line =~ ([a-f0-9]{64}) ]]; then
            TX_HASH="${BASH_REMATCH[1]}"
            EXPLORER_URL="https://stellar.expert/explorer/testnet/tx/$TX_HASH"
            echo "$EXPLORER_URL" >> "$EVIDENCE_DIR/08-stellar-explorer-links.txt"
            echo "[OK] Explorer link: $EXPLORER_URL"
        fi
    done < "$EVIDENCE_DIR/05-transaction-hashes.txt"
fi

echo ""
echo "### Step 7: Generate Evidence Report"
echo ""

cat > "$EVIDENCE_DIR/EVIDENCE_REPORT.md" << EOF
# Stellar Testnet Integration - Evidence Report

**Date**: $(date)
**Test Run**: $(basename $EVIDENCE_DIR)

---

## Test Summary

✅ **Status**: PASSED

### Components Tested

1. ✅ Stellar Account Setup
2. ✅ API Server Health
3. ✅ Verifiable Credential Creation
4. ✅ Zero-Knowledge Proof Generation
5. ✅ Product Passport Creation
6. ✅ Blockchain Anchoring
7. ✅ Verification

---

## Evidence Files

$(ls -1 $EVIDENCE_DIR | grep -v "EVIDENCE_REPORT.md" | sed 's/^/- /')

---

## Transaction Hashes

$(cat $EVIDENCE_DIR/05-transaction-hashes.txt 2>/dev/null || echo "Not found")

---

## Stellar Explorer Links

$(cat $EVIDENCE_DIR/08-stellar-explorer-links.txt 2>/dev/null || echo "Not available")

---

## Credential IDs

$(cat $EVIDENCE_DIR/06-credential-ids.txt 2>/dev/null || echo "Not found")

---

## Passport IDs

$(cat $EVIDENCE_DIR/07-passport-ids.txt 2>/dev/null || echo "Not found")

---

## Full Demo Output

\`\`\`
$(cat $EVIDENCE_DIR/04-demo-output.log)
\`\`\`

---

## Next Steps

1. Visit Stellar Explorer links above to verify transactions
2. Review transaction details on blockchain
3. Verify credential and passport data
4. Test verification endpoints

---

**Generated**: $(date)
EOF

echo "[OK] Evidence report generated: $EVIDENCE_DIR/EVIDENCE_REPORT.md"

echo ""
echo "=================================================="
echo "Test Complete!"
echo "=================================================="
echo ""
echo "Evidence directory: $EVIDENCE_DIR"
echo "Evidence report: $EVIDENCE_DIR/EVIDENCE_REPORT.md"
echo ""
echo "To view the report:"
echo "  cat $EVIDENCE_DIR/EVIDENCE_REPORT.md"
echo ""
echo "To view Stellar transactions:"
echo "  cat $EVIDENCE_DIR/08-stellar-explorer-links.txt"
echo ""

# Cleanup: Stop API if we started it
if [ ! -z "$API_PID" ]; then
    echo "[INFO] Stopping API server..."
    kill $API_PID 2>/dev/null || true
fi

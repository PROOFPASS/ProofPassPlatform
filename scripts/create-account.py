#!/usr/bin/env python3
"""
Simple script to create a Stellar testnet account
This avoids Node.js async issues
"""

import os
import json
import urllib.request
import urllib.error
import sys

# We'll use stellar-sdk Python package if available, otherwise generate manually
try:
    from stellar_sdk import Keypair
    use_sdk = True
except ImportError:
    use_sdk = False
    import secrets
    import base64

def generate_keypair():
    """Generate a Stellar keypair"""
    if use_sdk:
        pair = Keypair.random()
        return pair.public_key, pair.secret
    else:
        # Manual generation (simplified)
        print("⚠️  stellar-sdk not installed, using fallback method")
        print("Please install: pip3 install stellar-sdk")
        sys.exit(1)

def fund_account(public_key):
    """Fund account using Friendbot"""
    url = f"https://friendbot.stellar.org?addr={public_key}"
    try:
        with urllib.request.urlopen(url, timeout=30) as response:
            if response.status == 200:
                return True
            return False
    except Exception as e:
        print(f"Error funding account: {e}")
        return False

def main():
    print("🌟 Creating Stellar testnet account...\n")

    try:
        public_key, secret_key = generate_keypair()

        print(f"Generated keypair!")
        print(f"Public Key: {public_key}")
        print(f"Secret Key: {secret_key}")
        print("\n📡 Funding account with Friendbot...\n")

        if fund_account(public_key):
            print("✅ Account funded successfully!\n")

            # Update .env file
            env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
            with open(env_path, 'r') as f:
                content = f.read()

            content = content.replace('STELLAR_SECRET_KEY=', f'STELLAR_SECRET_KEY={secret_key}')
            content = content.replace('STELLAR_PUBLIC_KEY=', f'STELLAR_PUBLIC_KEY={public_key}')

            with open(env_path, 'w') as f:
                f.write(content)

            print("✅ Credentials saved to .env file\n")
            print("═══════════════════════════════════════")
            print("🎉 Setup complete!\n")
            print(f"Explorer: https://stellar.expert/explorer/testnet/account/{public_key}")
            print("═══════════════════════════════════════\n")
        else:
            print("❌ Failed to fund account")
            sys.exit(1)

    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()

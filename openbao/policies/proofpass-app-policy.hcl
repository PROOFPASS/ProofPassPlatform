# ProofPass Application Policy
# This policy grants permissions for the ProofPass API to manage secrets

# DID Keys - Full CRUD access
path "secret/data/did-keys/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

path "secret/metadata/did-keys/*" {
  capabilities = ["list", "read", "delete"]
}

# Organization Keys - Full CRUD access
path "secret/data/organizations/*/keys/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

path "secret/metadata/organizations/*/keys/*" {
  capabilities = ["list", "read", "delete"]
}

# API Keys and Credentials - Read-only for most, write for rotation
path "secret/data/api-keys/*" {
  capabilities = ["read", "list"]
}

# Encryption as a Service - Transit engine
path "transit/encrypt/proofpass" {
  capabilities = ["update"]
}

path "transit/decrypt/proofpass" {
  capabilities = ["update"]
}

path "transit/datakey/plaintext/proofpass" {
  capabilities = ["update"]
}

# PKI for certificate management
path "pki/issue/proofpass-role" {
  capabilities = ["create", "update"]
}

path "pki/cert/*" {
  capabilities = ["read", "list"]
}

# Token renewal for the app itself
path "auth/token/renew-self" {
  capabilities = ["update"]
}

path "auth/token/lookup-self" {
  capabilities = ["read"]
}

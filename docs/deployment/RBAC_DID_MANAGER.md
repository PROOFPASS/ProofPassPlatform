# RBAC and DID Manager Deployment Guide

This guide covers the deployment of Role-Based Access Control (RBAC) and DID Manager features added to ProofPass Platform.

## Overview

**Features Added:**
- **RBAC**: Three-tier role system (user, admin, superadmin) with hierarchical permissions
- **DID Manager**: Secure storage and reuse of user DIDs with AES-256-CBC encryption

**Migration:** `004_add_user_roles_and_dids.sql`

---

## Prerequisites

1. PostgreSQL database (existing ProofPass database)
2. Node.js 18+ environment
3. Access to server environment variables
4. Database backup (recommended before migration)

---

## Deployment Steps

### 1. Environment Configuration

Add the following environment variable to your `.env` file:

```bash
# DID Manager - Encryption for storing user DIDs
# Generate using: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
DID_ENCRYPTION_KEY=<your-64-character-hex-key>
```

**Example key generation:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Important:**
- Store this key securely (e.g., AWS Secrets Manager, HashiCorp Vault)
- Never commit this key to version control
- If you lose this key, encrypted DIDs cannot be recovered

---

### 2. Database Migration

**Option A: Using the migration script (recommended)**

```bash
# From project root
./scripts/run-migrations.sh
```

This script will:
- Check database connection
- Create `schema_migrations` table if needed
- Execute all pending migrations in order
- Track executed migrations to prevent duplicates

**Option B: Manual execution**

```bash
# From project root
psql -d proofpass -f apps/api/src/config/migrations/004_add_user_roles_and_dids.sql
```

**Migration adds:**
- `role` column to `users` table (default: 'user')
- `user_dids` table for DID storage
- Indexes for performance
- Constraints for data integrity

---

### 3. Create First Admin User

After migration, promote a user to admin:

```sql
-- Replace with your actual user email
UPDATE users
SET role = 'admin'
WHERE email = 'admin@example.com';
```

**Role hierarchy:**
- `user` (1) - Regular users
- `admin` (2) - Can access admin endpoints
- `superadmin` (3) - Full system access

---

### 4. Verification

#### Test RBAC

```bash
# Try accessing admin endpoint without auth (should return 401)
curl http://localhost:3000/api/v1/admin/organizations

# Try accessing with regular user token (should return 403)
curl -H "Authorization: Bearer <user-token>" \
     http://localhost:3000/api/v1/admin/organizations

# Access with admin token (should return 200)
curl -H "Authorization: Bearer <admin-token>" \
     http://localhost:3000/api/v1/admin/organizations
```

#### Test DID Manager

```bash
# Create two attestations for the same user
# Both should use the same DID (check issuer_did field)

# First attestation
curl -X POST http://localhost:3000/api/v1/attestations \
  -H "Authorization: Bearer <user-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK",
    "type": "EmailVerification",
    "claims": {"email": "test@example.com", "verified": true}
  }'

# Second attestation (should reuse same issuer_did)
curl -X POST http://localhost:3000/api/v1/attestations \
  -H "Authorization: Bearer <user-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK",
    "type": "PhoneVerification",
    "claims": {"phone": "+1234567890", "verified": true}
  }'
```

Check database:
```sql
-- Verify DID reuse
SELECT user_id, did, usage_count, last_used_at
FROM user_dids
WHERE user_id = '<user-uuid>';

-- Should show usage_count = 2
```

---

### 5. Monitoring

#### Check Logs

Look for these log messages:

**RBAC:**
```
Access denied - insufficient permissions
{
  userId: "uuid",
  userRole: "user",
  requiredRole: "admin",
  endpoint: "/api/v1/admin/..."
}
```

**DID Manager:**
```
✓ Created primary DID for user: <user-id>
✓ Reusing existing DID: <did-id>
```

#### Database Queries

```sql
-- Check user roles distribution
SELECT role, COUNT(*)
FROM users
GROUP BY role;

-- Check DID usage
SELECT
  u.email,
  ud.did,
  ud.usage_count,
  ud.last_used_at
FROM user_dids ud
JOIN users u ON u.id = ud.user_id
ORDER BY ud.usage_count DESC
LIMIT 10;

-- Check primary DIDs
SELECT user_id, did, created_at
FROM user_dids
WHERE is_primary = true
ORDER BY created_at DESC
LIMIT 10;
```

---

## Security Considerations

### RBAC

1. **Audit Logging**: All access denials are logged with user info
2. **JWT Validation**: All admin endpoints verify JWT before role check
3. **Role Hierarchy**: Higher roles automatically have lower role permissions

### DID Manager

1. **Encryption**: AES-256-CBC encryption for private keys
2. **Key Storage**: Encryption key must be stored securely (not in DB)
3. **Primary DID**: Users have one primary DID, preventing key sprawl
4. **Unique Constraint**: Database ensures one primary DID per user

---

## Rollback Plan

If issues occur, you can rollback the migration:

```sql
BEGIN;

-- Remove DID Manager table
DROP TABLE IF EXISTS user_dids;

-- Remove role column from users
ALTER TABLE users DROP COLUMN IF EXISTS role;

-- Remove from schema_migrations
DELETE FROM schema_migrations
WHERE migration_name = '004_add_user_roles_and_dids.sql';

COMMIT;
```

**Warning:** This will permanently delete all stored DIDs.

---

## Performance Impact

**Expected performance:**
- RBAC: Negligible (<1ms overhead per request)
- DID Manager: Initial DID creation ~50ms, reuse ~5ms
- Database: Minimal impact with proper indexes

**Indexes added:**
- `idx_users_role` on `users(role)`
- `idx_user_dids_one_primary` unique on `user_dids(user_id) WHERE is_primary`

---

## Troubleshooting

### Issue: "DID_ENCRYPTION_KEY not configured"

**Solution:** Add `DID_ENCRYPTION_KEY` to `.env` file

### Issue: "Access denied - insufficient permissions"

**Solutions:**
1. Verify user has correct role: `SELECT role FROM users WHERE id = '<user-id>'`
2. Check JWT token contains user info
3. Verify middleware order (jwtVerify before requireAdmin)

### Issue: Migration fails with "column already exists"

**Solution:** Migration may have partially run. Check:
```sql
SELECT * FROM schema_migrations
WHERE migration_name = '004_add_user_roles_and_dids.sql';
```

If exists but tables incomplete, manually fix and re-run.

---

## Next Steps

After successful deployment:

1. **Add Tests**: See `docs/testing/RBAC_TESTS.md` (to be created)
2. **Update API Docs**: Document admin-only endpoints
3. **Monitor Usage**: Track DID reuse metrics
4. **Security Audit**: Review audit logs for suspicious activity

---

## Support

For issues or questions:
- GitHub Issues: https://github.com/PROOFPASS/ProofPassPlatform/issues
- Email: support@proofpass.com

# Deployment Status - RBAC & DID Manager

**Date:** 2025-11-08
**Features:** RBAC + DID Manager

---

## Completed Steps

### 1. Code Implementation ✅
- **RBAC Middleware** (`apps/api/src/middleware/rbac.ts`): Three-tier role system implemented
- **DID Manager Service** (`apps/api/src/services/did-manager.ts`): Secure DID storage with AES-256-CBC encryption
- **Attestation Integration** (`apps/api/src/modules/attestations/service.ts`): Updated to use DID Manager
- **Database Migration** (`apps/api/src/config/migrations/004_add_user_roles_and_dids.sql`): Schema changes ready

### 2. Deployment Resources ✅
- **Environment Template** (`apps/api/.env.example`): DID_ENCRYPTION_KEY added with generation instructions
- **Migration Scripts**:
  - `scripts/run-migrations.sh`: Bash script for psql (requires PostgreSQL client tools)
  - `scripts/run-migration-node.js`: Node.js alternative using pg library
- **Deployment Guide** (`docs/deployment/RBAC_DID_MANAGER.md`): Complete step-by-step deployment instructions

### 3. Environment Configuration ✅
- **Encryption Key Generated**: 32-byte hex key for DID encryption
- **Local .env Updated**: `DID_ENCRYPTION_KEY` added to `apps/api/.env`

### 4. Git Commits ✅
All changes have been committed and pushed to GitHub:
- **Commit 209f913**: RBAC implementation
- **Commit 0d71a66**: DID Manager integration
- **Commit 12b6da7**: Deployment resources (scripts + documentation)

---

## Pending Steps

### 1. Database Migration ⏳

The database migration needs to be executed to add the required tables and columns:

**Migration File**: `apps/api/src/config/migrations/004_add_user_roles_and_dids.sql`

**Changes Applied by Migration:**
- Add `role` column to `users` table (default: 'user')
- Create `user_dids` table for encrypted DID storage
- Add indexes for performance
- Add constraints for data integrity
- Add `user_did_id` reference column to `attestations` table

**Migration Options:**

**Option A - Using psql (recommended if available):**
```bash
# Install PostgreSQL client tools first
brew install postgresql@14  # macOS
# or
apt-get install postgresql-client  # Linux

# Then run:
./scripts/run-migrations.sh
```

**Option B - Using Node.js script:**
```bash
node scripts/run-migration-node.js
```

**Option C - Manual execution (if database is accessible via another tool):**
Run the SQL commands from `apps/api/src/config/migrations/004_add_user_roles_and_dids.sql` directly in your database management tool (pgAdmin, DBeaver, etc.)

**Option D - Using Docker:**
If using Docker Compose database:
```bash
# Start database container
docker-compose up -d postgres

# Run migration via Docker exec
docker exec -i proofpass-db psql -U postgres -d proofpass < apps/api/src/config/migrations/004_add_user_roles_and_dids.sql
```

### 2. Create First Admin User

After migration, promote a user to admin:

```sql
UPDATE users
SET role = 'admin'
WHERE email = 'your-email@example.com';
```

### 3. Verification Testing

#### Test RBAC
```bash
# Try accessing admin endpoint without auth (should return 401)
curl http://localhost:3000/api/v1/admin/organizations

# Try with regular user token (should return 403)
curl -H "Authorization: Bearer <user-token>" \
     http://localhost:3000/api/v1/admin/organizations

# Access with admin token (should return 200)
curl -H "Authorization: Bearer <admin-token>" \
     http://localhost:3000/api/v1/admin/organizations
```

#### Test DID Manager
Create two attestations for the same user and verify they reuse the same DID:

```bash
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
SELECT user_id, did, usage_count, last_used_at
FROM user_dids
WHERE user_id = '<user-uuid>';
-- Should show usage_count = 2
```

### 4. Monitor and Verify

Check application logs for:
- RBAC access denials
- DID creation/reuse messages
- Any errors during DID encryption/decryption

---

## Database Connection Status

**Current Configuration** (from `apps/api/.env`):
- Host: `localhost`
- Port: `5432`
- Database: `proofpass_dev`
- User: `postgres`

**Connection Test Results:**
- ✅ Port 5432 is accessible
- ⏳ Database migration pending execution

---

## Next Actions

1. **Choose migration method** based on your environment setup
2. **Run the database migration** using your preferred option
3. **Create first admin user** in the database
4. **Start the API server** and test RBAC endpoints
5. **Test DID Manager** by creating attestations
6. **Review logs** for any issues

---

## Support Resources

- **Full Deployment Guide**: `docs/deployment/RBAC_DID_MANAGER.md`
- **Migration File**: `apps/api/src/config/migrations/004_add_user_roles_and_dids.sql`
- **GitHub Commits**:
  - RBAC: `209f913`
  - DID Manager: `0d71a66`
  - Deployment: `12b6da7`

---

## Notes

- The encryption key has been generated and added to the local `.env` file
- All code changes have been committed and pushed to GitHub
- The migration is idempotent (safe to run multiple times)
- The deployment guide includes rollback instructions if needed

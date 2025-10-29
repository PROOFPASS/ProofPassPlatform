# ⚡ Quick Start - 5 Minutes to Running ProofPass

Get ProofPass running locally in 5 minutes!

---

## Prerequisites

- ✅ Docker & Docker Compose installed
- ✅ 2GB RAM available
- ✅ Ports 3000, 5432, 6379 free

---

## 🚀 Steps

### 1. Clone & Navigate

```bash
git clone https://github.com/PROOFPASS/ProofPassPlatform.git
cd ProofPassPlatform
```

### 2. Start Everything

```bash
docker-compose up -d
```

**Wait 60 seconds** for services to start and migrations to run.

### 3. Verify

```bash
curl http://localhost:3000/health
```

**Expected:**
```json
{
  "status": "ok",
  "timestamp": "2024-10-28T10:00:00Z",
  "version": "0.1.0"
}
```

### 4. Test API

```bash
# Register user
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123456!",
    "name": "Test User"
  }'
```

### 5. Explore

- **API Docs:** http://localhost:3000/docs
- **Health:** http://localhost:3000/health
- **Readiness:** http://localhost:3000/ready

---

## ✅ Done!

You now have:
- ✅ ProofPass API running on port 3000
- ✅ PostgreSQL database with auto-migrations
- ✅ Redis cache
- ✅ Interactive API documentation

---

## 🔧 Common Commands

```bash
# View logs
docker-compose logs -f

# Stop everything
docker-compose down

# Restart
docker-compose restart

# Check status
docker-compose ps

# Remove everything (including data)
docker-compose down -v
```

---

## 📚 Next Steps

1. **Read Full Guide:** [docs/deployment/DEVOPS_GUIDE.md](docs/deployment/DEVOPS_GUIDE.md)
2. **Production Deploy:** [docs/deployment/DEPLOY_PORTABLE.md](docs/deployment/DEPLOY_PORTABLE.md)
3. **API Documentation:** [docs/API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md)
4. **Troubleshooting:** [docs/deployment/TROUBLESHOOTING.md](docs/deployment/TROUBLESHOOTING.md)

---

## 🆘 Problems?

```bash
# Check what's wrong
docker-compose ps
docker-compose logs

# Common fix: restart everything
docker-compose down
docker-compose up -d
```

**Still stuck?** See [Troubleshooting Guide](docs/deployment/TROUBLESHOOTING.md)

---

**That's it! Start building with ProofPass! 🎉**

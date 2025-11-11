# 🚀 Deployment Guide - ProofPass Platform

Quick start guide for deploying ProofPass to production.

**Last Updated:** October 29, 2024

---

## 🎯 Quick Links

- **Local Testing:** [Test Locally](#-test-locally)
- **AWS Deployment:** [Deploy to AWS](#-deploy-to-aws)
- **Full AWS Guide:** [docs/deployment/AWS_DEPLOYMENT.md](docs/deployment/AWS_DEPLOYMENT.md)
- **DevOps Guide:** [docs/deployment/DEVOPS_GUIDE.md](docs/deployment/DEVOPS_GUIDE.md)
- **Troubleshooting:** [docs/deployment/TROUBLESHOOTING.md](docs/deployment/TROUBLESHOOTING.md)

---

## 🧪 Test Locally

Before deploying, test everything locally:

```bash
# Run complete test suite
./scripts/test-local.sh
```

**This will:**
- ✅ Check all dependencies
- ✅ Build all packages
- ✅ Run unit tests
- ✅ Test Docker build
- ✅ Start services with Docker Compose
- ✅ Verify API health endpoints
- ✅ Check security (no exposed secrets)
- ✅ Verify documentation

**Expected output:**
```
🧪 ProofPass Platform - Local Testing Suite
==========================================

Phase 1: Dependencies Check
----------------------------
Testing: Node.js installed... ✓ PASS
Testing: npm installed... ✓ PASS
Testing: Docker installed... ✓ PASS
Testing: Docker running... ✓ PASS

...

Test Results
========================================
Tests Passed:  15
Tests Failed:  0

🎉 All tests passed! Ready for deployment.
```

---

## 🚀 Deploy to AWS

### Prerequisites

1. **AWS Account** with credentials configured
2. **Terraform** installed
3. **Docker** installed and running
4. **Environment variables** set

### Quick Deployment

```bash
# 1. Configure AWS
export AWS_REGION=us-east-1
export AWS_ACCOUNT_ID=your-account-id

# 2. Run deployment script
./scripts/deploy-aws.sh
```

**The script will:**
1. ✅ Check prerequisites
2. ✅ Run local tests
3. ✅ Build Docker image
4. ✅ Push to ECR
5. ✅ Update ECS service
6. ✅ Wait for deployment
7. ✅ Verify health checks

### Manual Deployment Steps

If you prefer manual control:

```bash
# 1. Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# 2. Build and push
docker build -t proofpass-api:latest .
docker tag proofpass-api:latest $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/proofpass-api:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/proofpass-api:latest

# 3. Update ECS
aws ecs update-service \
  --cluster proofpass-cluster \
  --service proofpass-api \
  --force-new-deployment
```

---

## 🏗️ Infrastructure Setup (First Time)

### Using Terraform (Recommended)

```bash
cd terraform

# Initialize
terraform init

# Plan
terraform plan -out=tfplan

# Apply
terraform apply tfplan
```

This creates:
- VPC with public/private subnets
- RDS PostgreSQL database
- ElastiCache Redis
- ECS cluster and service
- Application Load Balancer
- Auto-scaling policies
- CloudWatch monitoring

**Time:** ~15 minutes

### Manual Setup via AWS Console

See [docs/deployment/AWS_DEPLOYMENT.md](docs/deployment/AWS_DEPLOYMENT.md#manual-setup) for detailed instructions.

---

## 🔐 Secrets Management

### Store Secrets in AWS Secrets Manager

```bash
# Database URL
aws secretsmanager create-secret \
  --name proofpass/DATABASE_URL \
  --secret-string "postgresql://user:pass@rds-endpoint:5432/proofpass"

# Redis URL
aws secretsmanager create-secret \
  --name proofpass/REDIS_URL \
  --secret-string "redis://elasticache-endpoint:6379"

# JWT Secret
aws secretsmanager create-secret \
  --name proofpass/JWT_SECRET \
  --secret-string "$(openssl rand -base64 64)"

# Stellar Keys
aws secretsmanager create-secret \
  --name proofpass/STELLAR_SECRET_KEY \
  --secret-string "YOUR_STELLAR_SECRET_KEY"
```

---

## 🗄️ Database Migration

### Option 1: Run via ECS Task

```bash
aws ecs run-task \
  --cluster proofpass-cluster \
  --task-definition proofpass-migration \
  --launch-type FARGATE
```

### Option 2: Run via Bastion Host

```bash
# Connect to bastion
ssh -i your-key.pem ec2-user@bastion-ip

# Run migrations
psql $DATABASE_URL -f migrations/*.sql
```

---

## 📊 Monitoring

### View Logs

```bash
# Real-time logs
aws logs tail /ecs/proofpass-api --follow --region us-east-1

# Recent errors
aws logs filter-pattern /ecs/proofpass-api --filter-pattern "ERROR" --start-time 1h
```

### CloudWatch Dashboard

Access at: https://console.aws.amazon.com/cloudwatch/

Metrics to monitor:
- CPU utilization (target: <70%)
- Memory utilization (target: <80%)
- Request count
- Response time (target: <500ms)
- Error rate (target: <1%)
- Database connections

---

## 🔄 CI/CD Setup

### GitHub Actions (Automated)

Already configured in `.github/workflows/deploy-aws.yml`

**Triggers:**
- Push to `main` branch
- Manual workflow dispatch

**Steps:**
1. Run tests
2. Build Docker image
3. Push to ECR
4. Deploy to ECS
5. Run smoke tests

### Manual Deploy from CI/CD

```bash
# Trigger deployment
gh workflow run deploy-aws.yml
```

---

## ✅ Post-Deployment Checklist

After deploying:

- [ ] Verify API health: `curl https://api.proofpass.io/health`
- [ ] Check Swagger docs: `https://api.proofpass.io/docs`
- [ ] Run smoke tests
- [ ] Check CloudWatch logs for errors
- [ ] Verify database migrations
- [ ] Test authentication endpoints
- [ ] Verify rate limiting works
- [ ] Check SSL certificate
- [ ] Update DNS if needed
- [ ] Monitor for 24 hours

---

## 🆘 Troubleshooting

### Service Won't Start

```bash
# Check logs
aws logs tail /ecs/proofpass-api --follow

# Check task status
aws ecs describe-tasks \
  --cluster proofpass-cluster \
  --tasks $(aws ecs list-tasks --cluster proofpass-cluster --service-name proofpass-api --query 'taskArns[0]' --output text)
```

### Database Connection Failed

```bash
# Test from ECS task
aws ecs execute-command \
  --cluster proofpass-cluster \
  --task TASK_ID \
  --container api \
  --command "/bin/sh" \
  --interactive

# Inside container:
psql $DATABASE_URL -c "SELECT 1"
```

### High CPU/Memory

```bash
# Check metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization \
  --dimensions Name=ServiceName,Value=proofpass-api \
  --statistics Average \
  --start-time 2024-10-29T00:00:00Z \
  --end-time 2024-10-29T23:59:59Z \
  --period 3600
```

---

## 🔄 Rollback

If deployment fails:

```bash
# Get previous task definition
PREV_TASK_DEF=$(aws ecs describe-services \
  --cluster proofpass-cluster \
  --services proofpass-api \
  --query 'services[0].deployments[1].taskDefinition' \
  --output text)

# Rollback
aws ecs update-service \
  --cluster proofpass-cluster \
  --service proofpass-api \
  --task-definition $PREV_TASK_DEF
```

---

## 💰 Cost Optimization

### Development Environment

Reduce costs by:
- Using `db.t3.micro` for RDS (~$13/month)
- Using `cache.t3.micro` for Redis (~$12/month)
- Running 1 ECS task instead of 2
- **Estimated: ~$50/month**

### Production Environment

Full setup as described:
- **Estimated: ~$355/month**

See [docs/deployment/AWS_DEPLOYMENT.md](docs/deployment/AWS_DEPLOYMENT.md#cost-estimation) for detailed breakdown.

---

## 🔒 Security

### Pre-Deployment Security Checklist

- [ ] All secrets in AWS Secrets Manager (not hardcoded)
- [ ] Security groups properly configured (least privilege)
- [ ] RDS encryption at rest enabled
- [ ] VPC Flow Logs enabled
- [ ] CloudTrail enabled for audit logs
- [ ] WAF rules configured on ALB
- [ ] SSL/TLS certificate installed
- [ ] Regular backup policy configured
- [ ] MFA enabled on AWS account

---

## 📚 Additional Resources

- **Full AWS Guide:** [docs/deployment/AWS_DEPLOYMENT.md](docs/deployment/AWS_DEPLOYMENT.md)
- **Terraform Modules:** [terraform/](terraform/)
- **Docker Compose:** [docker-compose.yml](docker-compose.yml)
- **Security Status:** [SECURITY_STATUS.md](SECURITY_STATUS.md)
- **Migration Guide:** [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md)

---

## 🤝 Support

Need help?
- **Email:** fboiero@frvm.utn.edu.ar
- **Issues:** https://github.com/PROOFPASS/ProofPassPlatform/issues
- **Docs:** [docs/](docs/)

---

**Last Updated:** October 29, 2024
**Platform Version:** 2.0.0 (Production-Ready)

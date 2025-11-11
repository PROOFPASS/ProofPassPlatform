# 🚀 AWS Deployment Guide - ProofPass Platform

Complete guide for deploying ProofPass Platform to Amazon Web Services.

**Last Updated:** October 29, 2024
**Target Environment:** AWS (ECS, RDS, ElastiCache, S3)

---

## 📋 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        AWS Cloud                            │
│                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌─────────────┐ │
│  │   Route 53   │───▶│ CloudFront   │───▶│     S3      │ │
│  │    (DNS)     │    │    (CDN)     │    │  (Static)   │ │
│  └──────────────┘    └──────────────┘    └─────────────┘ │
│         │                                                  │
│         │             ┌──────────────┐                    │
│         └────────────▶│     ALB      │                    │
│                       │ (Load Bal.)  │                    │
│                       └──────┬───────┘                    │
│                              │                             │
│              ┌───────────────┴───────────────┐            │
│              │                                │            │
│       ┌──────▼──────┐              ┌─────────▼────────┐  │
│       │  ECS Task 1 │              │  ECS Task 2      │  │
│       │  (API)      │              │  (API)           │  │
│       └──────┬──────┘              └─────────┬────────┘  │
│              │                                │            │
│              └────────────┬───────────────────┘            │
│                           │                                │
│              ┌────────────▼────────────┐                  │
│              │                          │                  │
│       ┌──────▼──────┐          ┌───────▼────────┐        │
│       │   RDS       │          │  ElastiCache   │        │
│       │ PostgreSQL  │          │     Redis      │        │
│       └─────────────┘          └────────────────┘        │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Prerequisites

### AWS Account Setup
- AWS Account with admin access
- AWS CLI installed and configured
- Terraform installed (v1.5+)
- Docker installed locally

### Required AWS Services
- ✅ **ECS (Elastic Container Service)** - Container orchestration
- ✅ **RDS (PostgreSQL 15)** - Database
- ✅ **ElastiCache (Redis 7)** - Caching & rate limiting
- ✅ **ALB (Application Load Balancer)** - Load balancing
- ✅ **ECR (Container Registry)** - Docker images
- ✅ **S3** - Static assets & backups
- ✅ **CloudFront** - CDN
- ✅ **Route 53** - DNS
- ✅ **Secrets Manager** - Secret management
- ✅ **CloudWatch** - Monitoring & logs

---

## 📦 Step 1: Prepare Docker Images

### Build Production Images

```bash
# Build all packages first
npm install
npm run build

# Build Docker image
docker build -t proofpass-api:latest .

# Test locally
docker-compose up -d
curl http://localhost:3000/health
```

### Push to ECR

```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com

# Create repository
aws ecr create-repository --repository-name proofpass-api --region us-east-1

# Tag image
docker tag proofpass-api:latest YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/proofpass-api:latest

# Push
docker push YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/proofpass-api:latest
```

---

## 🏗️ Step 2: Infrastructure as Code (Terraform)

### Create `terraform/main.tf`

```hcl
terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket = "proofpass-terraform-state"
    key    = "prod/terraform.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  region = var.aws_region
}

# VPC
module "vpc" {
  source = "terraform-aws-modules/vpc/aws"

  name = "proofpass-vpc"
  cidr = "10.0.0.0/16"

  azs             = ["us-east-1a", "us-east-1b", "us-east-1c"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]

  enable_nat_gateway = true
  single_nat_gateway = false  # High availability

  tags = {
    Environment = "production"
    Project     = "ProofPass"
  }
}

# RDS PostgreSQL
resource "aws_db_instance" "postgres" {
  identifier           = "proofpass-db"
  engine              = "postgres"
  engine_version      = "15.4"
  instance_class      = "db.t3.medium"
  allocated_storage   = 100
  storage_encrypted   = true

  db_name  = "proofpass"
  username = "proofpass_admin"
  password = random_password.db_password.result

  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "mon:04:00-mon:05:00"

  multi_az               = true
  skip_final_snapshot    = false
  final_snapshot_identifier = "proofpass-final-snapshot"

  tags = {
    Name = "ProofPass PostgreSQL"
  }
}

# ElastiCache Redis
resource "aws_elasticache_cluster" "redis" {
  cluster_id           = "proofpass-redis"
  engine              = "redis"
  engine_version      = "7.0"
  node_type           = "cache.t3.medium"
  num_cache_nodes     = 1
  parameter_group_name = "default.redis7"

  subnet_group_name    = aws_elasticache_subnet_group.main.name
  security_group_ids   = [aws_security_group.redis.id]

  tags = {
    Name = "ProofPass Redis"
  }
}

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "proofpass-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

# ECS Task Definition
resource "aws_ecs_task_definition" "api" {
  family                   = "proofpass-api"
  requires_compatibilities = ["FARGATE"]
  network_mode            = "awsvpc"
  cpu                     = "1024"  # 1 vCPU
  memory                  = "2048"  # 2 GB

  execution_role_arn = aws_iam_role.ecs_execution.arn
  task_role_arn      = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([{
    name  = "api"
    image = "${aws_ecr_repository.api.repository_url}:latest"

    portMappings = [{
      containerPort = 3000
      protocol      = "tcp"
    }]

    environment = [
      {
        name  = "NODE_ENV"
        value = "production"
      },
      {
        name  = "PORT"
        value = "3000"
      }
    ]

    secrets = [
      {
        name      = "DATABASE_URL"
        valueFrom = aws_secretsmanager_secret.db_url.arn
      },
      {
        name      = "REDIS_URL"
        valueFrom = aws_secretsmanager_secret.redis_url.arn
      },
      {
        name      = "JWT_SECRET"
        valueFrom = aws_secretsmanager_secret.jwt_secret.arn
      },
      {
        name      = "STELLAR_SECRET_KEY"
        valueFrom = aws_secretsmanager_secret.stellar_key.arn
      }
    ]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.api.name
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "api"
      }
    }

    healthCheck = {
      command     = ["CMD-SHELL", "curl -f http://localhost:3000/health || exit 1"]
      interval    = 30
      timeout     = 5
      retries     = 3
      startPeriod = 60
    }
  }])
}

# ECS Service
resource "aws_ecs_service" "api" {
  name            = "proofpass-api"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.api.arn
  desired_count   = 2  # Min 2 for high availability

  launch_type = "FARGATE"

  network_configuration {
    subnets          = module.vpc.private_subnets
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.api.arn
    container_name   = "api"
    container_port   = 3000
  }

  depends_on = [aws_lb_listener.https]
}

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "proofpass-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = module.vpc.public_subnets

  enable_deletion_protection = true

  tags = {
    Name = "ProofPass ALB"
  }
}

# HTTPS Listener
resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.main.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS-1-2-2017-01"
  certificate_arn   = aws_acm_certificate.main.arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api.arn
  }
}

# Auto Scaling
resource "aws_appautoscaling_target" "ecs" {
  max_capacity       = 10
  min_capacity       = 2
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.api.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "ecs_cpu" {
  name               = "cpu-autoscaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value = 70.0
  }
}
```

### Deploy with Terraform

```bash
cd terraform

# Initialize
terraform init

# Plan
terraform plan -out=tfplan

# Apply
terraform apply tfplan
```

---

## 🔐 Step 3: Secrets Management

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

## 🗄️ Step 4: Database Migration

### Run Migrations via ECS Task

```bash
# Create one-time migration task
aws ecs run-task \
  --cluster proofpass-cluster \
  --task-definition proofpass-migration \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx]}"
```

### Migration Task Definition

```json
{
  "family": "proofpass-migration",
  "containerDefinitions": [{
    "name": "migration",
    "image": "proofpass-api:latest",
    "command": ["node", "dist/config/migrations/run-migrations.js"],
    "environment": [...],
    "secrets": [...]
  }]
}
```

---

## 📊 Step 5: Monitoring & Logging

### CloudWatch Dashboards

```bash
# Create custom dashboard
aws cloudwatch put-dashboard \
  --dashboard-name ProofPass \
  --dashboard-body file://cloudwatch-dashboard.json
```

### Alarms

```hcl
# High CPU
resource "aws_cloudwatch_metric_alarm" "cpu_high" {
  alarm_name          = "proofpass-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = "60"
  statistic           = "Average"
  threshold           = "80"

  dimensions = {
    ClusterName = aws_ecs_cluster.main.name
    ServiceName = aws_ecs_service.api.name
  }

  alarm_actions = [aws_sns_topic.alerts.arn]
}

# Database connections
resource "aws_cloudwatch_metric_alarm" "db_connections" {
  alarm_name          = "proofpass-db-connections-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = "60"
  statistic           = "Average"
  threshold           = "80"

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.postgres.id
  }

  alarm_actions = [aws_sns_topic.alerts.arn]
}
```

---

## 🔄 Step 6: CI/CD Pipeline (GitHub Actions)

### `.github/workflows/deploy-aws.yml`

```yaml
name: Deploy to AWS

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - name: Login to ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1

      - name: Build and push image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          ECR_REPOSITORY: proofpass-api
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
          docker tag $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG $ECR_REGISTRY/$ECR_REPOSITORY:latest
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:latest

      - name: Update ECS service
        run: |
          aws ecs update-service \
            --cluster proofpass-cluster \
            --service proofpass-api \
            --force-new-deployment
```

---

## 💰 Cost Estimation

| Service | Configuration | Monthly Cost (USD) |
|---------|--------------|-------------------|
| **ECS Fargate** | 2 tasks x 1vCPU, 2GB | ~$60 |
| **RDS PostgreSQL** | db.t3.medium, 100GB | ~$120 |
| **ElastiCache Redis** | cache.t3.medium | ~$50 |
| **ALB** | Standard | ~$25 |
| **Data Transfer** | ~1TB | ~$90 |
| **CloudWatch** | Logs & Metrics | ~$10 |
| **Total** | | **~$355/month** |

---

## 🔒 Security Checklist

- [ ] Enable VPC Flow Logs
- [ ] Configure Security Groups (least privilege)
- [ ] Enable RDS encryption at rest
- [ ] Enable S3 bucket encryption
- [ ] Configure WAF rules on ALB
- [ ] Enable CloudTrail for audit logs
- [ ] Set up AWS Config for compliance
- [ ] Enable GuardDuty for threat detection
- [ ] Rotate secrets regularly (90 days)
- [ ] Enable MFA for AWS console access

---

## 📝 Post-Deployment

### Verify Deployment

```bash
# Check ECS service
aws ecs describe-services \
  --cluster proofpass-cluster \
  --services proofpass-api

# Check health
curl https://api.proofpass.io/health

# Check logs
aws logs tail /ecs/proofpass-api --follow
```

### Performance Testing

```bash
# Load test
npm install -g artillery
artillery quick --count 100 --num 10 https://api.proofpass.io/health
```

---

## 🆘 Troubleshooting

### Service Won't Start

```bash
# Check logs
aws logs tail /ecs/proofpass-api --follow

# Check task status
aws ecs list-tasks --cluster proofpass-cluster --service-name proofpass-api
```

### Database Connection Issues

```bash
# Test from ECS task
aws ecs execute-command \
  --cluster proofpass-cluster \
  --task TASK_ID \
  --container api \
  --command "/bin/sh" \
  --interactive
```

---

## 📚 Additional Resources

- [AWS ECS Best Practices](https://docs.aws.amazon.com/AmazonECS/latest/bestpracticesguide/)
- [RDS Security Guide](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/UsingWithRDS.html)
- [Terraform AWS Modules](https://registry.terraform.io/namespaces/terraform-aws-modules)

---

**Last Updated:** October 29, 2024
**Maintained By:** ProofPass Team

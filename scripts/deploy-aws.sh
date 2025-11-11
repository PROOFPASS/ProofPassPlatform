#!/bin/bash

set -e

echo "🚀 ProofPass Platform - AWS Deployment"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
AWS_REGION="${AWS_REGION:-us-east-1}"
ECR_REPOSITORY="${ECR_REPOSITORY:-proofpass-api}"
ECS_CLUSTER="${ECS_CLUSTER:-proofpass-cluster}"
ECS_SERVICE="${ECS_SERVICE:-proofpass-api}"
IMAGE_TAG="${IMAGE_TAG:-latest}"

echo -e "${BLUE}Configuration:${NC}"
echo "  AWS Region: $AWS_REGION"
echo "  ECR Repository: $ECR_REPOSITORY"
echo "  ECS Cluster: $ECS_CLUSTER"
echo "  ECS Service: $ECS_SERVICE"
echo "  Image Tag: $IMAGE_TAG"
echo ""

# Step 1: Pre-deployment checks
echo -e "${YELLOW}Step 1: Pre-deployment checks${NC}"
echo "------------------------------"

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo -e "${RED}✗ AWS CLI not found. Please install it first.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ AWS CLI installed${NC}"

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}✗ Docker not found. Please install it first.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker installed${NC}"

# Check AWS credentials
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo -e "${RED}✗ AWS credentials not configured${NC}"
    exit 1
fi
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo -e "${GREEN}✓ AWS credentials configured (Account: $AWS_ACCOUNT_ID)${NC}"

echo ""

# Step 2: Build and test locally
echo -e "${YELLOW}Step 2: Build and test locally${NC}"
echo "------------------------------"

# Run tests
if [ -f "./scripts/test-local.sh" ]; then
    echo "Running local tests..."
    bash ./scripts/test-local.sh
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Local tests passed${NC}"
    else
        echo -e "${RED}✗ Local tests failed. Fix issues before deploying.${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠ test-local.sh not found, skipping tests${NC}"
fi

echo ""

# Step 3: Build Docker image
echo -e "${YELLOW}Step 3: Build Docker image${NC}"
echo "--------------------------"

echo "Building Docker image..."
if docker build -t $ECR_REPOSITORY:$IMAGE_TAG .; then
    echo -e "${GREEN}✓ Docker image built successfully${NC}"
else
    echo -e "${RED}✗ Docker build failed${NC}"
    exit 1
fi

echo ""

# Step 4: Push to ECR
echo -e "${YELLOW}Step 4: Push to ECR${NC}"
echo "-------------------"

# Login to ECR
echo "Logging in to ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Check if repository exists
if ! aws ecr describe-repositories --repository-names $ECR_REPOSITORY --region $AWS_REGION > /dev/null 2>&1; then
    echo "Creating ECR repository..."
    aws ecr create-repository --repository-name $ECR_REPOSITORY --region $AWS_REGION
fi

# Tag image
ECR_IMAGE="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:$IMAGE_TAG"
docker tag $ECR_REPOSITORY:$IMAGE_TAG $ECR_IMAGE

# Push image
echo "Pushing image to ECR..."
if docker push $ECR_IMAGE; then
    echo -e "${GREEN}✓ Image pushed to ECR: $ECR_IMAGE${NC}"
else
    echo -e "${RED}✗ Failed to push image to ECR${NC}"
    exit 1
fi

echo ""

# Step 5: Update ECS service
echo -e "${YELLOW}Step 5: Update ECS service${NC}"
echo "--------------------------"

# Check if cluster exists
if ! aws ecs describe-clusters --clusters $ECS_CLUSTER --region $AWS_REGION | grep -q "ACTIVE"; then
    echo -e "${RED}✗ ECS cluster '$ECS_CLUSTER' not found or not active${NC}"
    echo "Please create the cluster first using Terraform or AWS Console"
    exit 1
fi

# Check if service exists
if ! aws ecs describe-services --cluster $ECS_CLUSTER --services $ECS_SERVICE --region $AWS_REGION | grep -q "ACTIVE"; then
    echo -e "${RED}✗ ECS service '$ECS_SERVICE' not found or not active${NC}"
    echo "Please create the service first using Terraform or AWS Console"
    exit 1
fi

# Force new deployment
echo "Triggering ECS service update..."
aws ecs update-service \
    --cluster $ECS_CLUSTER \
    --service $ECS_SERVICE \
    --force-new-deployment \
    --region $AWS_REGION > /dev/null

echo -e "${GREEN}✓ ECS service update triggered${NC}"

echo ""

# Step 6: Wait for deployment
echo -e "${YELLOW}Step 6: Wait for deployment${NC}"
echo "---------------------------"

echo "Waiting for deployment to complete (this may take 3-5 minutes)..."

MAX_WAIT=300  # 5 minutes
WAIT_INTERVAL=10
ELAPSED=0

while [ $ELAPSED -lt $MAX_WAIT ]; do
    DEPLOYMENT_STATUS=$(aws ecs describe-services \
        --cluster $ECS_CLUSTER \
        --services $ECS_SERVICE \
        --region $AWS_REGION \
        --query 'services[0].deployments[0].rolloutState' \
        --output text)

    if [ "$DEPLOYMENT_STATUS" == "COMPLETED" ]; then
        echo -e "${GREEN}✓ Deployment completed successfully!${NC}"
        break
    elif [ "$DEPLOYMENT_STATUS" == "FAILED" ]; then
        echo -e "${RED}✗ Deployment failed${NC}"
        exit 1
    else
        echo "Deployment status: $DEPLOYMENT_STATUS (waited ${ELAPSED}s)"
        sleep $WAIT_INTERVAL
        ELAPSED=$((ELAPSED + WAIT_INTERVAL))
    fi
done

if [ $ELAPSED -ge $MAX_WAIT ]; then
    echo -e "${YELLOW}⚠ Deployment timed out. Check AWS Console for status.${NC}"
fi

echo ""

# Step 7: Verify deployment
echo -e "${YELLOW}Step 7: Verify deployment${NC}"
echo "------------------------"

# Get ALB DNS
ALB_DNS=$(aws elbv2 describe-load-balancers \
    --region $AWS_REGION \
    --query 'LoadBalancers[?contains(LoadBalancerName, `proofpass`)].DNSName' \
    --output text | head -1)

if [ -n "$ALB_DNS" ]; then
    echo "Testing health endpoint..."
    sleep 5  # Give it a moment

    if curl -f -m 10 "http://$ALB_DNS/health" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Health check passed${NC}"
        echo "API URL: http://$ALB_DNS"
    else
        echo -e "${YELLOW}⚠ Health check failed. Service may still be starting.${NC}"
        echo "Check logs: aws logs tail /ecs/$ECS_SERVICE --follow --region $AWS_REGION"
    fi
else
    echo -e "${YELLOW}⚠ Load balancer not found. Check manually in AWS Console.${NC}"
fi

echo ""
echo "======================================"
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo "======================================"
echo ""
echo "Next steps:"
echo "  1. Verify the deployment in AWS Console"
echo "  2. Check CloudWatch logs if needed"
echo "  3. Run smoke tests against production"
echo "  4. Update DNS if needed"
echo ""
echo "Useful commands:"
echo "  - View logs: aws logs tail /ecs/$ECS_SERVICE --follow --region $AWS_REGION"
echo "  - Check service: aws ecs describe-services --cluster $ECS_CLUSTER --services $ECS_SERVICE --region $AWS_REGION"
echo "  - Rollback: aws ecs update-service --cluster $ECS_CLUSTER --service $ECS_SERVICE --task-definition <PREVIOUS_TASK_DEF> --region $AWS_REGION"
echo ""

# CI/CD Pipeline Guide - ProofPass Platform

Complete guide for setting up Continuous Integration and Continuous Deployment pipelines for ProofPass Platform.

**Last Updated:** 2025-11-03
**Platform Version:** 2.0.0

---

## 📋 Overview

This guide provides production-ready CI/CD pipeline configurations for:
- **GitHub Actions** (recommended for GitHub repositories)
- **GitLab CI** (for GitLab repositories)
- **Generic Docker-based CI/CD** (adaptable to any platform)

Each pipeline includes:
- Automated testing
- Docker image building
- Container registry push
- Deployment to production
- Health check verification

---

## 🚀 GitHub Actions

### Complete Workflow (`.github/workflows/deploy.yml`)

```yaml
name: Deploy ProofPass Platform

on:
  push:
    branches: [main, production]
  pull_request:
    branches: [main]
  workflow_dispatch:  # Manual trigger

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  test:
    name: Run Tests
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:14-alpine
        env:
          POSTGRES_USER: proofpass
          POSTGRES_PASSWORD: test_password
          POSTGRES_DB: proofpass_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint --if-present

      - name: Run type check
        run: npm run type-check --if-present

      - name: Run unit tests
        run: npm test --if-present
        env:
          DATABASE_URL: postgresql://proofpass:test_password@localhost:5432/proofpass_test
          REDIS_URL: redis://localhost:6379
          JWT_SECRET: test-jwt-secret-min-32-characters-long
          API_KEY_SALT: test-api-key-salt-min-32-characters

      - name: Build packages
        run: npm run build:packages --if-present

      - name: Build API
        run: cd apps/api && npm run build

  build-and-push:
    name: Build and Push Docker Image
    runs-on: ubuntu-latest
    needs: test
    if: github.event_name == 'push' && (github.ref == 'refs/heads/main' || github.ref == 'refs/heads/production')

    permissions:
      contents: read
      packages: write

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=sha,prefix={{branch}}-
            type=raw,value=latest,enable={{is_default_branch}}

      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: build-and-push
    if: github.ref == 'refs/heads/main'

    environment:
      name: production
      url: https://api.proofpass.io

    steps:
      - name: Deploy to server
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.DEPLOY_HOST }}
          username: ${{ secrets.DEPLOY_USER }}
          key: ${{ secrets.DEPLOY_SSH_KEY }}
          script: |
            cd /opt/ProofPassPlatform

            # Pull latest code
            git pull origin main

            # Pull new Docker images
            docker compose -f docker-compose.prod.yml pull

            # Restart services
            docker compose -f docker-compose.prod.yml up -d

            # Wait for services to be healthy
            sleep 30

            # Verify deployment
            curl -f http://localhost:3000/health || exit 1

            echo "Deployment successful!"

      - name: Verify deployment
        run: |
          sleep 10
          curl -f https://api.proofpass.io/health || exit 1
          echo "Health check passed!"

  notify:
    name: Send Notifications
    runs-on: ubuntu-latest
    needs: [deploy]
    if: always()

    steps:
      - name: Send Slack notification
        if: success()
        uses: slackapi/slack-github-action@v1.24.0
        with:
          payload: |
            {
              "text": "✅ ProofPass Platform deployed successfully to production",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "✅ *Deployment Successful*\n<${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}|View workflow run>"
                  }
                }
              ]
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}

      - name: Send Slack notification on failure
        if: failure()
        uses: slackapi/slack-github-action@v1.24.0
        with:
          payload: |
            {
              "text": "❌ ProofPass Platform deployment failed",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "❌ *Deployment Failed*\n<${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}|View workflow run>"
                  }
                }
              ]
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

### Required GitHub Secrets

Configure these secrets in your repository settings (`Settings → Secrets and variables → Actions`):

```bash
# Deployment server access
DEPLOY_HOST=your-server-ip-or-domain
DEPLOY_USER=deployment-user
DEPLOY_SSH_KEY=<private-ssh-key>

# Notifications (optional)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# Environment variables (if using external deployment)
POSTGRES_PASSWORD=<production-db-password>
REDIS_PASSWORD=<production-redis-password>
JWT_SECRET=<production-jwt-secret>
API_KEY_SALT=<production-api-key-salt>
STELLAR_SECRET_KEY=<production-stellar-secret>
STELLAR_PUBLIC_KEY=<production-stellar-public>
```

### Testing the Workflow Locally

Use [act](https://github.com/nektos/act) to test GitHub Actions locally:

```bash
# Install act
brew install act  # macOS
# or
curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash  # Linux

# Run workflow
act push --secret-file .secrets

# Run specific job
act push -j test

# Dry run
act push -n
```

---

## 🦊 GitLab CI

### Complete Pipeline (`.gitlab-ci.yml`)

```yaml
stages:
  - test
  - build
  - deploy
  - verify

variables:
  DOCKER_DRIVER: overlay2
  DOCKER_TLS_CERTDIR: "/certs"
  REGISTRY: $CI_REGISTRY
  IMAGE: $CI_REGISTRY_IMAGE
  POSTGRES_VERSION: "14-alpine"
  REDIS_VERSION: "7-alpine"

# Test stage
test:unit:
  stage: test
  image: node:18-alpine
  services:
    - name: postgres:14-alpine
      alias: postgres
      variables:
        POSTGRES_USER: proofpass
        POSTGRES_PASSWORD: test_password
        POSTGRES_DB: proofpass_test
    - name: redis:7-alpine
      alias: redis
  variables:
    DATABASE_URL: postgresql://proofpass:test_password@postgres:5432/proofpass_test
    REDIS_URL: redis://redis:6379
    JWT_SECRET: test-jwt-secret-min-32-characters-long
    API_KEY_SALT: test-api-key-salt-min-32-characters
  before_script:
    - npm ci
  script:
    - npm run lint --if-present
    - npm run type-check --if-present
    - npm test --if-present
    - npm run build:packages --if-present
    - cd apps/api && npm run build
  cache:
    key: ${CI_COMMIT_REF_SLUG}
    paths:
      - node_modules/
      - apps/*/node_modules/
      - packages/*/node_modules/
  only:
    - merge_requests
    - main
    - production

# Build stage
build:docker:
  stage: build
  image: docker:24-dind
  services:
    - docker:24-dind
  before_script:
    - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY
  script:
    - docker build -t $IMAGE:$CI_COMMIT_SHA .
    - docker tag $IMAGE:$CI_COMMIT_SHA $IMAGE:$CI_COMMIT_REF_SLUG
    - |
      if [ "$CI_COMMIT_BRANCH" == "main" ]; then
        docker tag $IMAGE:$CI_COMMIT_SHA $IMAGE:latest
      fi
    - docker push $IMAGE:$CI_COMMIT_SHA
    - docker push $IMAGE:$CI_COMMIT_REF_SLUG
    - |
      if [ "$CI_COMMIT_BRANCH" == "main" ]; then
        docker push $IMAGE:latest
      fi
  only:
    - main
    - production
  tags:
    - docker

# Deploy to staging
deploy:staging:
  stage: deploy
  image: alpine:latest
  before_script:
    - apk add --no-cache openssh-client
    - eval $(ssh-agent -s)
    - echo "$STAGING_SSH_KEY" | tr -d '\r' | ssh-add -
    - mkdir -p ~/.ssh
    - chmod 700 ~/.ssh
    - ssh-keyscan -H $STAGING_HOST >> ~/.ssh/known_hosts
  script:
    - |
      ssh $STAGING_USER@$STAGING_HOST << 'EOF'
        cd /opt/ProofPassPlatform
        git pull origin $CI_COMMIT_BRANCH
        docker compose -f docker-compose.prod.yml pull
        docker compose -f docker-compose.prod.yml up -d
        sleep 30
        curl -f http://localhost:3000/health || exit 1
        echo "Staging deployment successful!"
      EOF
  environment:
    name: staging
    url: https://staging.proofpass.io
  only:
    - main
  tags:
    - staging

# Deploy to production
deploy:production:
  stage: deploy
  image: alpine:latest
  before_script:
    - apk add --no-cache openssh-client
    - eval $(ssh-agent -s)
    - echo "$PRODUCTION_SSH_KEY" | tr -d '\r' | ssh-add -
    - mkdir -p ~/.ssh
    - chmod 700 ~/.ssh
    - ssh-keyscan -H $PRODUCTION_HOST >> ~/.ssh/known_hosts
  script:
    - |
      ssh $PRODUCTION_USER@$PRODUCTION_HOST << 'EOF'
        cd /opt/ProofPassPlatform
        git pull origin production
        docker compose -f docker-compose.prod.yml pull
        docker compose -f docker-compose.prod.yml up -d
        sleep 30
        curl -f http://localhost:3000/health || exit 1
        echo "Production deployment successful!"
      EOF
  environment:
    name: production
    url: https://api.proofpass.io
  when: manual  # Require manual approval
  only:
    - production
  tags:
    - production

# Verify deployment
verify:health:
  stage: verify
  image: curlimages/curl:latest
  script:
    - |
      if [ "$CI_COMMIT_BRANCH" == "main" ]; then
        URL="https://staging.proofpass.io"
      elif [ "$CI_COMMIT_BRANCH" == "production" ]; then
        URL="https://api.proofpass.io"
      else
        echo "Skipping verification for branch $CI_COMMIT_BRANCH"
        exit 0
      fi
    - echo "Verifying deployment at $URL"
    - sleep 10
    - curl -f $URL/health || exit 1
    - curl -f $URL/ready || exit 1
    - echo "Health checks passed!"
  only:
    - main
    - production
  needs:
    - job: deploy:staging
      optional: true
    - job: deploy:production
      optional: true
```

### Required GitLab CI/CD Variables

Configure these in your GitLab project (`Settings → CI/CD → Variables`):

```bash
# Staging environment
STAGING_HOST=staging-server-ip
STAGING_USER=deployment-user
STAGING_SSH_KEY=<private-ssh-key>  # Type: File, Protected: No

# Production environment
PRODUCTION_HOST=production-server-ip
PRODUCTION_USER=deployment-user
PRODUCTION_SSH_KEY=<private-ssh-key>  # Type: File, Protected: Yes

# Application secrets (for production deployment)
POSTGRES_PASSWORD=<production-db-password>  # Protected: Yes, Masked: Yes
REDIS_PASSWORD=<production-redis-password>  # Protected: Yes, Masked: Yes
JWT_SECRET=<production-jwt-secret>  # Protected: Yes, Masked: Yes
API_KEY_SALT=<production-api-key-salt>  # Protected: Yes, Masked: Yes
STELLAR_SECRET_KEY=<production-stellar-secret>  # Protected: Yes, Masked: Yes
STELLAR_PUBLIC_KEY=<production-stellar-public>  # Protected: Yes, Masked: Yes
```

---

## 🐳 Generic Docker CI/CD

For platforms like Jenkins, CircleCI, Travis CI, or custom solutions:

### Dockerfile Build & Test Script

```bash
#!/bin/bash
set -e

# CI/CD script for ProofPass Platform
# Usage: ./ci-cd.sh [test|build|deploy]

COMMAND=${1:-test}
IMAGE_NAME="proofpass-api"
REGISTRY="your-registry.com"

echo "🚀 ProofPass CI/CD - Stage: $COMMAND"

case $COMMAND in
  test)
    echo "📋 Running tests..."

    # Start test services
    docker compose -f docker-compose.test.yml up -d postgres redis

    # Wait for services
    sleep 10

    # Run tests
    docker compose -f docker-compose.test.yml run --rm api npm test

    # Cleanup
    docker compose -f docker-compose.test.yml down -v

    echo "✅ Tests passed!"
    ;;

  build)
    echo "🔨 Building Docker image..."

    # Build image
    docker build -t $IMAGE_NAME:latest .

    # Tag with commit SHA
    GIT_SHA=$(git rev-parse --short HEAD)
    docker tag $IMAGE_NAME:latest $IMAGE_NAME:$GIT_SHA

    # Tag with branch name
    GIT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
    docker tag $IMAGE_NAME:latest $IMAGE_NAME:$GIT_BRANCH

    echo "✅ Build complete!"
    echo "   - $IMAGE_NAME:latest"
    echo "   - $IMAGE_NAME:$GIT_SHA"
    echo "   - $IMAGE_NAME:$GIT_BRANCH"
    ;;

  push)
    echo "📤 Pushing to registry..."

    # Login to registry
    echo "$REGISTRY_PASSWORD" | docker login $REGISTRY -u $REGISTRY_USER --password-stdin

    # Tag for registry
    docker tag $IMAGE_NAME:latest $REGISTRY/$IMAGE_NAME:latest
    GIT_SHA=$(git rev-parse --short HEAD)
    docker tag $IMAGE_NAME:latest $REGISTRY/$IMAGE_NAME:$GIT_SHA

    # Push
    docker push $REGISTRY/$IMAGE_NAME:latest
    docker push $REGISTRY/$IMAGE_NAME:$GIT_SHA

    echo "✅ Push complete!"
    ;;

  deploy)
    echo "🚢 Deploying to production..."

    # SSH to production server
    ssh $DEPLOY_USER@$DEPLOY_HOST << 'EOF'
      cd /opt/ProofPassPlatform
      git pull origin main
      docker compose -f docker-compose.prod.yml pull
      docker compose -f docker-compose.prod.yml up -d

      # Wait for health check
      sleep 30
      curl -f http://localhost:3000/health || exit 1

      echo "✅ Deployment successful!"
EOF

    # Verify external health
    sleep 10
    curl -f https://api.proofpass.io/health || exit 1

    echo "✅ Deployment verified!"
    ;;

  *)
    echo "❌ Unknown command: $COMMAND"
    echo "Usage: $0 [test|build|push|deploy]"
    exit 1
    ;;
esac
```

### Docker Compose for Testing (`docker-compose.test.yml`)

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_USER: proofpass
      POSTGRES_PASSWORD: test_password
      POSTGRES_DB: proofpass_test
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U proofpass"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

  api:
    build: .
    environment:
      NODE_ENV: test
      DATABASE_URL: postgresql://proofpass:test_password@postgres:5432/proofpass_test
      REDIS_URL: redis://redis:6379
      JWT_SECRET: test-jwt-secret-min-32-characters-long
      API_KEY_SALT: test-api-key-salt-min-32-characters
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
```

---

## 🔧 Advanced Configuration

### Blue-Green Deployment

```yaml
# GitHub Actions example
deploy-blue-green:
  runs-on: ubuntu-latest
  steps:
    - name: Deploy to blue environment
      run: |
        ssh ${{ secrets.DEPLOY_USER }}@${{ secrets.DEPLOY_HOST }} << 'EOF'
          # Deploy to blue slot
          docker compose -f docker-compose.blue.yml pull
          docker compose -f docker-compose.blue.yml up -d

          # Wait and verify
          sleep 30
          curl -f http://localhost:3001/health || exit 1

          # Switch traffic to blue
          docker compose -f docker-compose.proxy.yml restart

          # Stop green environment
          docker compose -f docker-compose.green.yml down
        EOF
```

### Canary Deployment

```yaml
# GitLab CI example
deploy:canary:
  stage: deploy
  script:
    - |
      # Deploy 10% of traffic to new version
      kubectl set image deployment/proofpass-api api=$IMAGE:$CI_COMMIT_SHA
      kubectl scale deployment/proofpass-api-canary --replicas=1

      # Monitor for 5 minutes
      sleep 300

      # Check error rate
      ERROR_RATE=$(curl -s https://metrics.proofpass.io/error-rate)
      if [ "$ERROR_RATE" -gt "1" ]; then
        echo "High error rate detected, rolling back"
        kubectl rollout undo deployment/proofpass-api
        exit 1
      fi

      # Full rollout
      kubectl set image deployment/proofpass-api api=$IMAGE:$CI_COMMIT_SHA
  when: manual
```

### Rollback Strategy

```bash
#!/bin/bash
# rollback.sh - Rollback to previous version

DEPLOY_USER=${1:-ubuntu}
DEPLOY_HOST=${2:-your-server-ip}

echo "🔄 Rolling back ProofPass deployment..."

ssh $DEPLOY_USER@$DEPLOY_HOST << 'EOF'
  cd /opt/ProofPassPlatform

  # Get previous commit
  PREVIOUS_COMMIT=$(git rev-parse HEAD~1)

  # Checkout previous version
  git checkout $PREVIOUS_COMMIT

  # Rebuild and restart
  docker compose -f docker-compose.prod.yml build
  docker compose -f docker-compose.prod.yml up -d

  # Verify
  sleep 30
  curl -f http://localhost:3000/health || exit 1

  echo "✅ Rollback complete to commit $PREVIOUS_COMMIT"
EOF

echo "✅ Rollback successful!"
```

---

## 📊 Monitoring & Notifications

### Slack Integration

```bash
# Send deployment notification to Slack
send_slack_notification() {
  WEBHOOK_URL=$1
  MESSAGE=$2
  STATUS=$3  # success or failure

  if [ "$STATUS" == "success" ]; then
    COLOR="good"
    EMOJI=":white_check_mark:"
  else
    COLOR="danger"
    EMOJI=":x:"
  fi

  curl -X POST $WEBHOOK_URL \
    -H 'Content-Type: application/json' \
    -d "{
      \"attachments\": [{
        \"color\": \"$COLOR\",
        \"title\": \"$EMOJI ProofPass Deployment\",
        \"text\": \"$MESSAGE\",
        \"footer\": \"ProofPass CI/CD\",
        \"ts\": $(date +%s)
      }]
    }"
}

# Usage
send_slack_notification "$SLACK_WEBHOOK_URL" "Deployment to production successful!" "success"
```

### Email Notifications

```bash
# Send email notification
send_email_notification() {
  RECIPIENT=$1
  SUBJECT=$2
  BODY=$3

  echo "$BODY" | mail -s "$SUBJECT" $RECIPIENT
}

# Usage
send_email_notification "devops@proofpass.io" "Deployment Success" "ProofPass deployed to production successfully"
```

---

## 🆘 Troubleshooting CI/CD

### Common Issues

**1. Docker build fails:**
```bash
# Check Dockerfile syntax
docker build --no-cache -t proofpass-test .

# View build logs
docker build --progress=plain -t proofpass-test .
```

**2. Tests fail in CI but pass locally:**
```bash
# Ensure environment variables match
env | grep -E "(DATABASE|REDIS|JWT)"

# Check service health
docker compose ps
```

**3. Deployment times out:**
```bash
# Increase timeout in CI config
timeout: 300  # 5 minutes

# Check server resources
ssh user@server 'df -h && free -h'
```

**4. SSH connection fails:**
```bash
# Test SSH connection
ssh -v user@server

# Verify SSH key is correct
ssh-keygen -l -f ~/.ssh/id_rsa.pub
```

---

## 📚 Additional Resources

- **Docker Quick Start:** [DOCKER_QUICK_START.md](./DOCKER_QUICK_START.md)
- **Deployment Guide:** [DEPLOYMENT.md](./DEPLOYMENT.md)
- **DevOps Guide:** [DEVOPS_GUIDE.md](./DEVOPS_GUIDE.md)
- **GitHub Actions Docs:** https://docs.github.com/en/actions
- **GitLab CI Docs:** https://docs.gitlab.com/ee/ci/

---

## 🤝 Support

- **Documentation:** [docs/](../)
- **Issues:** https://github.com/PROOFPASS/ProofPassPlatform/issues
- **Email:** fboiero@frvm.utn.edu.ar

---

**Last Updated:** 2025-11-03
**Platform Version:** 2.0.0

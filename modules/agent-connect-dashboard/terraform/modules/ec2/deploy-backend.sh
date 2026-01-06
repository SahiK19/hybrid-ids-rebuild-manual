#!/bin/bash
set -e

AWS_REGION="ap-southeast-1"
DB_SECRET_NAME="hybrid-ids-rds-credentials"
ECR_REPO="908103136245.dkr.ecr.ap-southeast-1.amazonaws.com/hybrid-ids-backend"

# Login to ECR
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REPO

# Pull latest image
docker pull $ECR_REPO:latest

# Stop Apache service if running on host
systemctl stop apache2 2>/dev/null || true
systemctl disable apache2 2>/dev/null || true

# Stop and remove old container
docker stop backend 2>/dev/null || true
docker rm -f backend 2>/dev/null || true

# Kill any remaining process using port 80
fuser -k 80/tcp 2>/dev/null || true
sleep 2

# Run new container with environment variables
docker run -d -p 80:80 \
  --restart unless-stopped \
  -e AWS_REGION=$AWS_REGION \
  -e DB_SECRET_NAME=$DB_SECRET_NAME \
  -e APP_ENV=production \
  --name backend $ECR_REPO:latest

# Remove old images (keep only latest)
docker images $ECR_REPO --format "{{.ID}} {{.Tag}}" | grep '<none>' | awk '{print $1}' | xargs -r docker rmi -f 2>/dev/null || true

# Remove dangling images
docker image prune -f

echo "Backend deployed successfully"

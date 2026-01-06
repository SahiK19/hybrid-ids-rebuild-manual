#!/bin/bash
apt-get update -y
apt-get install -y docker.io mysql-client unzip curl
systemctl start docker
systemctl enable docker
usermod -a -G docker ubuntu

# Install AWS CLI v2
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
./aws/install
rm -rf aws awscliv2.zip

aws ecr get-login-password --region ${aws_region} | docker login --username AWS --password-stdin ${ecr_repository_url}

docker pull ${ecr_repository_url}:latest
docker run -d -p 80:80 \
  --restart unless-stopped \
  -e AWS_REGION=${aws_region} \
  -e DB_SECRET_NAME=${secret_name} \
  -e APP_ENV=production \
  --name backend ${ecr_repository_url}:latest

cat > /usr/local/bin/docker-cleanup.sh << 'EOF'
#!/bin/bash
IMAGE_COUNT=$(docker images -q | wc -l)
if [ $IMAGE_COUNT -gt 5 ]; then
  docker images --format "{{.ID}} {{.CreatedAt}}" | sort -rk 2 | tail -n +6 | awk '{print $1}' | xargs -r docker rmi -f
fi
EOF

chmod +x /usr/local/bin/docker-cleanup.sh
echo "0 2 * * * /usr/local/bin/docker-cleanup.sh" | crontab -

# Create deployment script
cat > /usr/local/bin/deploy-backend.sh << 'DEPLOY_EOF'
#!/bin/bash
set -e

AWS_REGION="${aws_region}"
DB_SECRET_NAME="${secret_name}"
ECR_REPO="${ecr_repository_url}"

aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REPO

docker pull $ECR_REPO:latest

docker stop backend 2>/dev/null || true
docker rm backend 2>/dev/null || true

docker run -d -p 80:80 \
  --restart unless-stopped \
  -e AWS_REGION=$AWS_REGION \
  -e DB_SECRET_NAME=$DB_SECRET_NAME \
  -e APP_ENV=production \
  --name backend $ECR_REPO:latest

echo "Backend deployed successfully"
DEPLOY_EOF

chmod +x /usr/local/bin/deploy-backend.sh

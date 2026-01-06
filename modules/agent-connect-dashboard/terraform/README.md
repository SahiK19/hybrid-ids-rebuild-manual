# Hybrid IDS Infrastructure

Terraform configuration for deploying Hybrid IDS to AWS.

## Architecture

- **Frontend**: ReactJS app hosted on S3 with static website hosting
- **Backend**: PHP app running in Docker on EC2, images stored in ECR
- **Database**: MySQL RDS (accessible only from EC2)
- **Secrets**: RDS credentials stored in AWS Secrets Manager
- **Access**: EC2 accessible via AWS Systems Manager (no SSH)

## Prerequisites

- AWS CLI configured
- Terraform >= 1.0
- AWS account with appropriate permissions

## Deployment Steps

### 1. Bootstrap Remote State (First Time Only)

```bash
cd bootstrap
terraform init
terraform apply
cd ..
```

### 2. Deploy Infrastructure

```bash
# Copy and customize variables
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values (especially bucket names - must be globally unique)

# Initialize with remote state backend
terraform init

# Plan and apply
terraform plan
terraform apply
```

### 3. Deploy Frontend

Build and upload your React app to the S3 bucket:
```bash
cd ../frontend
npm run build
aws s3 sync dist/ s3://hybrid-ids-frontend --delete
```

### 4. Deploy Backend

Your GitHub Actions workflow will handle this, but manually:
```bash
cd ../backend
aws ecr get-login-password --region ap-southeast-1 | docker login --username AWS --password-stdin <ECR_URL>
docker build -t hybrid-ids-backend .
docker tag hybrid-ids-backend:latest <ECR_URL>:latest
docker push <ECR_URL>:latest
```

### 5. Access EC2 via SSM

```bash
aws ssm start-session --target <INSTANCE_ID>
```

## Outputs

After deployment, Terraform will output:
- Frontend S3 bucket name and website endpoint
- ECR repository URL
- EC2 instance ID and public IP
- RDS endpoint
- Secrets Manager secret name

## Docker Image Cleanup

EC2 automatically cleans up old Docker images, keeping only the 5 most recent images. The cleanup script runs daily at 2 AM.

## Remote State

State is stored in S3 with DynamoDB locking, allowing you to work from multiple machines (home PC and laptop) without conflicts.

## Modules

- `vpc`: VPC with public/private subnets
- `ec2`: EC2 instance with Docker
- `rds`: MySQL RDS database
- `s3`: Frontend hosting bucket
- `ecr`: Docker image repository
- `iam`: IAM roles and policies
- `secrets`: Secrets Manager for DB credentials

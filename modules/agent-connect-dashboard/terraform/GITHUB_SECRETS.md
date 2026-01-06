# GitHub Actions Secrets

After running `terraform apply`, add these secrets to your GitHub repository:

**Settings → Secrets and variables → Actions → New repository secret**

## Required Secrets

1. **AWS_ACCESS_KEY_ID**
   - Get from: `terraform output -raw github_actions_access_key_id`

2. **AWS_SECRET_ACCESS_KEY**
   - Get from: `terraform output -raw github_actions_secret_access_key`

3. **ECR_REPOSITORY_NAME**
   - Value: `hybrid-ids-backend`
   - Get from terraform output: `terraform output ecr_repository_url` (use only the repository name part)

4. **EC2_INSTANCE_ID**
   - Get from terraform output: `terraform output ec2_instance_id`
   - Example: `i-0123456789abcdef0`

5. **S3_BUCKET_NAME**
   - Get from terraform output: `terraform output frontend_bucket_name`
   - Example: `hybrid-ids-frontend`

## How to Get Values

```bash
cd terraform

# Get AWS credentials (sensitive outputs)
terraform output -raw github_actions_access_key_id
terraform output -raw github_actions_secret_access_key

# Get other values
terraform output ec2_instance_id
terraform output frontend_bucket_name
```

Copy the output values to GitHub secrets.

## Region

Region is hardcoded to `ap-southeast-1` in workflows (no secret needed).

## Note

Terraform automatically creates a dedicated IAM user (`hybrid-ids-github-actions`) with minimal required permissions for GitHub Actions.

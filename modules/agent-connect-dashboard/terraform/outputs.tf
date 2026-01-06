output "frontend_bucket_name" {
  description = "S3 bucket name for frontend"
  value       = module.s3.bucket_name
}

output "frontend_website_endpoint" {
  description = "S3 website endpoint"
  value       = module.s3.website_endpoint
}

output "ecr_repository_url" {
  description = "ECR repository URL"
  value       = module.ecr.repository_url
}

output "ec2_instance_id" {
  description = "EC2 instance ID"
  value       = module.ec2.instance_id
}

output "ec2_public_ip" {
  description = "EC2 public IP"
  value       = module.ec2.public_ip
}

output "rds_endpoint" {
  description = "RDS endpoint"
  value       = module.rds.db_endpoint
}

output "secrets_manager_name" {
  description = "Secrets Manager secret name"
  value       = module.secrets.secret_name
}

output "github_actions_access_key_id" {
  description = "GitHub Actions IAM user access key ID"
  value       = module.iam.github_actions_access_key_id
  sensitive   = true
}

output "github_actions_secret_access_key" {
  description = "GitHub Actions IAM user secret access key"
  value       = module.iam.github_actions_secret_access_key
  sensitive   = true
}

output "wazuh_instance_id" {
  description = "Wazuh Manager EC2 instance ID"
  value       = module.ec2.wazuh_instance_id
}

output "wazuh_public_ip" {
  description = "Wazuh Manager Elastic IP"
  value       = module.ec2.wazuh_public_ip
}

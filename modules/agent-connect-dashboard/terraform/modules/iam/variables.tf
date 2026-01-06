variable "project_name" {
  description = "Project name"
  type        = string
}

variable "secrets_manager_arn" {
  description = "ARN of the Secrets Manager secret"
  type        = string
}

variable "s3_bucket_arn" {
  description = "ARN of the S3 bucket for frontend"
  type        = string
}

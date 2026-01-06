terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

module "vpc" {
  source = "./modules/vpc"

  project_name         = var.project_name
  vpc_cidr             = var.vpc_cidr
  public_subnet_cidrs  = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
  availability_zones   = var.availability_zones
}

module "ecr" {
  source = "./modules/ecr"

  project_name    = var.project_name
  repository_name = "${var.project_name}-backend"
}

module "s3" {
  source = "./modules/s3"

  project_name = var.project_name
  bucket_name  = var.frontend_bucket_name
}

module "secrets" {
  source = "./modules/secrets"

  project_name = var.project_name
  db_host      = module.rds.db_host
  db_name      = module.rds.db_name
  db_username  = module.rds.db_username
  db_password  = module.rds.db_password
}

module "iam" {
  source = "./modules/iam"

  project_name         = var.project_name
  secrets_manager_arn  = module.secrets.secret_arn
  s3_bucket_arn        = module.s3.bucket_arn
}

module "ec2" {
  source = "./modules/ec2"

  project_name         = var.project_name
  vpc_id               = module.vpc.vpc_id
  subnet_id            = module.vpc.public_subnet_ids[0]
  iam_instance_profile = module.iam.ec2_instance_profile_name
  ecr_repository_url   = module.ecr.repository_url
  aws_region           = var.aws_region
  secret_name          = module.secrets.secret_name
  instance_type        = var.ec2_instance_type
}

module "rds" {
  source = "./modules/rds"

  project_name           = var.project_name
  vpc_id                 = module.vpc.vpc_id
  db_subnet_group_name   = module.vpc.db_subnet_group_name
  ec2_security_group_id  = module.ec2.security_group_id
  db_name                = var.db_name
  db_username            = var.db_username
  instance_class         = var.rds_instance_class
  allocated_storage      = var.rds_allocated_storage
  engine_version         = var.rds_engine_version
}

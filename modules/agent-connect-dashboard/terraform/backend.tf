terraform {
  backend "s3" {
    bucket         = "hybrid-ids-terraform-state"
    key            = "hybrid-ids/terraform.tfstate"
    region         = "ap-southeast-1"
    dynamodb_table = "hybrid-ids-terraform-locks"
    encrypt        = true
  }
}

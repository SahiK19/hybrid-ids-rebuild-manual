# Bootstrap Terraform Remote State

Run this FIRST before deploying main infrastructure.

## Steps

1. Update variables in `variables.tf` if needed (bucket name must be globally unique)

2. Initialize and apply:
```bash
cd bootstrap
terraform init
terraform apply
```

3. Note the outputs (S3 bucket and DynamoDB table names)

4. Update `../backend.tf` with the bucket and table names if you changed them

5. Go back to main terraform directory and initialize with remote state:
```bash
cd ..
terraform init
```

You only need to run bootstrap once. After that, your state will be stored in S3.


# Hybrid IDS – Agent Connect Dashboard

## Overview
This repository acts as the **control plane** for the Hybrid Intrusion Detection System (HIDS + NIDS).  
It brings together **Wazuh (HIDS)**, **Snort (NIDS)**, and a **custom correlation engine**, and provides a web dashboard to monitor events, correlated alerts, and agent status.

> **Important:** After redeploying, EC2 public IPs will change. If your frontend or agent configs contain hardcoded IPs/endpoints, you must update them accordingly.

---

## Repository Structure
- `backend/` — Dashboard backend API services (receives logs, provides dashboard APIs)
- `frontend/` — Web-based monitoring dashboard (React/Vite)
- `terraform/` — AWS infrastructure provisioning (VPC, EC2, RDS, S3/CloudFront, IAM, etc.)
- `collect-logs.php` — Log ingestion endpoint (legacy/optional depending on deployment)

---

## Prerequisites
Before deploying, ensure you have:
- An **AWS account**
- **AWS CLI** installed and configured
- **Terraform** installed
- Git installed

Verify installs:
```bash
aws --version
terraform -version
git --version
````

Confirm AWS login:

```bash
aws sts get-caller-identity
```

---

## Deployment Flow (High Level)

1. Provision AWS infrastructure using Terraform
2. Install and configure Wazuh Manager (separate module/repo)
3. Deploy the backend API onto the backend EC2
4. Deploy agents on endpoints/VMs and configure them to push logs to the backend API

---

## Terraform Deployment (Exact Commands)

### 1) Navigate to the Terraform directory

```bash
cd terraform
```

### 2) Configure AWS region (example: Singapore)

```bash
export AWS_REGION=ap-southeast-1
```

If you use an AWS named profile (recommended):

```bash
export AWS_PROFILE=hybrid-ids
```

Confirm identity:

```bash
aws sts get-caller-identity
```

### 3) Create your Terraform variables file

```bash
cp terraform.tfvars.example terraform.tfvars
nano terraform.tfvars
```

### 4) Initialize Terraform

```bash
terraform init
```

### 5) Format + validate

```bash
terraform fmt -recursive
terraform validate
```

### 6) Plan

```bash
terraform plan -out tfplan
```

### 7) Apply

```bash
terraform apply tfplan
```

### 8) Capture outputs (IPs, endpoints, URLs)

```bash
terraform output
```

> Save these values. You will need them to configure:
>
> * Frontend API endpoint
> * Wazuh Manager push destination
> * Agent VM endpoints
> * Database endpoint (RDS)

---

## Related Modules / Repositories

Depending on how you are deploying, the full Hybrid IDS environment also includes:

* `hybrid-ids-backend-api` — Backend API service (runs on Backend EC2 host)
* `hybrid-ids-wazuh-manager` — Wazuh manager setup (custom rules + alerts HTTP + push)
* `ids-agent` — Agent setup (Wazuh agent + Snort + correlator + push services)

> In the master rebuild repository, these may appear as modules inside a single repository rather than separate repos.

---

## Notes


* Ensure security group rules allow the required traffic (e.g., backend API ports, Wazuh ports, MySQL 3306 from backend to RDS).


---

## Tear Down (Optional)

To remove all resources:

```bash
terraform destroy
```

```
```

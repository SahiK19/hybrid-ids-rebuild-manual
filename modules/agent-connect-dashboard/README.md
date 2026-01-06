# Hybrid IDS – Agent Connect Dashboard

## Overview
This repository represents the main control plane of the Hybrid Intrusion Detection System (HIDS + NIDS), integrating Wazuh, Snort, and a custom correlation engine.

## Repository Structure
- backend/        → Backend API services
- frontend/       → Web-based monitoring dashboard
- terraform/      → AWS infrastructure provisioning
- collect-logs.php→ Log ingestion endpoint

## Related Repositories
- hybrid-ids-backend-api
- hybrid-ids-wazuh-manager
- ids-agent

## Deployment Flow
1. Provision infrastructure using Terraform
2. Install Wazuh Manager using hybrid-ids-wazuh-manager
3. Deploy backend API
4. Deploy agents on endpoints

# Database Rebuild (Hybrid IDS)

Terraform provisions the RDS infrastructure, but it **does not** automatically create tables/data.
To recreate the database (schema + tables + data), restore the provided dump into the RDS endpoint.

## Restore
1) Install MySQL client (if needed):
```bash
sudo apt-get update && sudo apt-get install -y mysql-client



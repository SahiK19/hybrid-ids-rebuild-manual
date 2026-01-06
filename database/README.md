Yep — your `database/README.md` should explicitly say **“run this on the backend EC2 (or any host that can reach RDS)”** and include the exact steps.

Here’s a clean, copy-paste **updated `database/README.md`** you can use (replaces your current one):

````md
# Database Rebuild (Hybrid IDS)

Terraform provisions the **RDS infrastructure** (DB instance, networking, security groups), but it **does not automatically create your tables or data**.

To recreate the database **schema + tables + data**, restore the provided dump into the RDS endpoint.

---

## What this folder contains

- `dumps/hybrididsdb.sql.gz`  
  Full database dump (schema + tables + data)

- `scripts/restore_db.sh`  
  Restore helper script (streams the dump into MySQL)

---

## Where to run the restore (IMPORTANT)

Run the restore from a machine that can connect to the RDS instance, typically:

✅ **Backend EC2 (recommended)** — inside AWS, easiest connectivity  
✅ Any EC2 in the same VPC/subnet that is allowed by the RDS security group  
⚠️ Your laptop only if RDS is public + your IP is allowed (usually not recommended)

---

## Network requirement (RDS Security Group)

Your RDS security group must allow inbound MySQL:

- Port: **3306**
- Source: **Backend EC2 security group** (recommended), or a specific IP/CIDR

If this is not allowed, restore will fail with “Can't connect to MySQL server”.

---

## Prerequisites (on the machine you run restore from)

### Install MySQL client
Ubuntu/Debian:
```bash
sudo apt-get update
sudo apt-get install -y mysql-client
````

---

## Restore steps (run on Backend EC2)

### 1) Get the repo

```bash
cd ~
git clone https://github.com/SahiK19/hybrid-ids-rebuild-manual.git
cd hybrid-ids-rebuild-manual
```

### 2) Set environment variables

Replace with real values:

```bash
export DB_HOST="YOUR_RDS_ENDPOINT"
export DB_USER="YOUR_DB_USERNAME"
export DB_NAME="hybrididsdb"
```

### 3) Run the restore

```bash
./database/scripts/restore_db.sh
```

You will be prompted for the DB password.

---

## Verification (optional)

List tables:

```bash
mysql -h "$DB_HOST" -u "$DB_USER" -p -e "USE hybrididsdb; SHOW TABLES;"
```

---




If you want, paste your `terraform output` (mask secrets) and I’ll tweak the README to say exactly how users should retrieve `DB_HOST/DB_USER/password` in *your* setup (outputs vs Secrets Manager).

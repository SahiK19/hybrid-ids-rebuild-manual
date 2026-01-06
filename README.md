
# Hybrid IDS System — Master Rebuild Manual (End User Guide)

NOTE: For all this you need to have an aws account setup .

This master repository contains a **full copy** of all modules required to recreate the Hybrid IDS environment end-to-end:

- Cloud Infrastructure + Dashboard Web App (Terraform + S3/CloudFront)
- Wazuh Manager on EC2 (custom rules + alerts.json HTTP + push service)
- Backend API on EC2 (**runs on host, not in Docker**)
- Database rebuild (RDS MySQL dump restore) — **required to recreate tables + data**
- Agent VM (Wazuh Agent + Snort + Correlator + push to backend API)

> ⚠️ Important: This system uses **hardcoded IPs** in some frontend files and **endpoint configs** in server/agent env files.  
> When you redeploy, your new EC2 public IPs will be different, so you MUST update the locations listed below.

---

## Repository Layout

All modules are included under `modules/`:

- `modules/agent-connect-dashboard/`
  - Terraform + dashboard frontend (S3/CloudFront)
  - **For exact setup steps:** `modules/agent-connect-dashboard/README.md`

- `modules/wazuh-manager-setup/`
  - Wazuh Manager setup (custom rules + alerts HTTP + push service)
  - **For exact setup steps:** `modules/wazuh-manager-setup/README.md`

- `modules/hybrid-ids-backend-api/`
  - Backend API source code (deploy onto Backend EC2)
  - On the Backend EC2, you will typically work inside: `hybrid-ids-backend-api/`
  - **For exact setup steps:** `modules/hybrid-ids-backend-api/README.md`

- `modules/agent-setup/`
  - Agent VM setup (Wazuh Agent + Snort + correlator + push)
  - **For exact setup steps:** `modules/agent-setup/README.md`

Additional folder at repo root:

- `database/`
  - Database dump + restore scripts (schema + tables + data)
  - **For exact restore steps:** `database/README.md`

---

# Setup Flow (Deploy in This Exact Order)

## Step 1 — Agent Connect Dashboard (Terraform + Frontend Deploy)

**Module:** `modules/agent-connect-dashboard/`  
📌 **Follow the exact instructions in:** `modules/agent-connect-dashboard/README.md`

1) Run Terraform according to the module README.
2) After `terraform apply`, record these values:

- ✅ **NEW Backend EC2 Public IP** (for API): `<NEW_BACKEND_EC2_IP>`
- ✅ **NEW Wazuh Manager EC2 Public IP**: `<NEW_WAZUH_MANAGER_IP>`
- ✅ Frontend URL (CloudFront/S3): `<FRONTEND_URL>`
- ✅ **NEW RDS Endpoint**: `<NEW_RDS_ENDPOINT>`

---

## Step 2 — Update Frontend Hardcoded IPs (REQUIRED)

The dashboard frontend contains **hardcoded IP addresses**. After redeployment, update them to your new EC2 IPs.

### 2A) Backend API Server IP (OLD: `18.142.200.244`)
Update to: `http://<NEW_BACKEND_EC2_IP>:5000`

Found in:
- `modules/agent-connect-dashboard/frontend/src/pages/HidsLogs.tsx`
  - Line 13:
    - `const API_URL = "http://18.142.200.244:5000/api/wazuh-logs";`

- `modules/agent-connect-dashboard/frontend/src/pages/ActiveAgents.tsx`
  - Line 21:
    - `fetch("http://18.142.200.244:5000/api/dashboard/active-correlated-agents"...`

✅ Action:
- Replace `18.142.200.244` with your **new backend EC2 public IP** in both files.

---

### 2B) Wazuh Manager IP (OLD: `47.130.204.203`)
Update to: `<NEW_WAZUH_MANAGER_IP>`

Found in:
- `modules/agent-connect-dashboard/frontend/src/pages/InstallAgent.tsx`
  - Line 37:
    - `const [wazuhManager] = useState("47.130.204.203");`
  - Line 158:
    - Display shows `47.130.204.203`

✅ Action:
- Replace `47.130.204.203` with your **new Wazuh Manager EC2 public IP** (both state value + UI display).

> Tip: Search the frontend folder for old IPs and replace all occurrences:
> - `18.142.200.244`
> - `47.130.204.203`

---

## Step 3 — Setup Wazuh Manager EC2

**Module:** `modules/wazuh-manager-setup/`  
📌 **Follow the exact instructions in:** `modules/wazuh-manager-setup/README.md`

After setup, confirm alerts.json exposure:

```bash
curl http://<NEW_WAZUH_MANAGER_IP>:8000/alerts.json
````

---

## Step 4 — Configure Wazuh Manager Push Destination (AFTER WAZUH SETUP)

This step must be done **after** the Wazuh Manager setup is complete, because the push service and folders are created during installation.

**On Wazuh Manager EC2**

* Edit:

  * `/opt/wazuh-push/.env`

Update:

* `DASHBOARD_URL=http://<NEW_BACKEND_EC2_IP>:5000/api/wazuh`
* `API_KEY=<your_api_key>`

Restart services:

```bash
sudo systemctl restart wazuh-http-server wazuh-push
sudo systemctl status wazuh-http-server wazuh-push --no-pager -l
```

---

## Step 5 — Deploy Backend API on Backend EC2 (Runs on Host)

**Module:** `modules/hybrid-ids-backend-api/`
📌 **Follow the exact instructions in:** `modules/hybrid-ids-backend-api/README.md`

**Folder name you will likely see on the Backend EC2 after copying/cloning:** `hybrid-ids-backend-api/`

This component runs the **Dashboard Backend API** directly on the Backend EC2 host (NOT inside Docker).
It provides the API endpoints that:

* the dashboard frontend calls, and
* the Wazuh Manager / Agent VM push logs into.

### Verify backend is reachable

```bash
curl -i http://<NEW_BACKEND_EC2_IP>:5000/ || true
```

Key endpoints used by the system:

* `GET /api/wazuh-logs`
* `GET /api/dashboard/active-correlated-agents`
* `POST /api/snort`
* `POST /api/wazuh`

---

## Step 6 — Setup Database (RDS MySQL) — Restore Tables + Data (REQUIRED)

Terraform provisions the **RDS infrastructure**, but it **does not automatically restore schema/tables/data**.

✅ To rebuild the database contents:
📌 **Follow the exact instructions in:** `database/README.md`

Summary:

* Restore should be run from **Backend EC2** (recommended) or another host that can reach RDS.
* Run: `./database/scripts/restore_db.sh`

---

Step 7 — Setup Agent VM (Wazuh Agent + Snort + Correlator + Push)

Before you follow the agent setup module README, you must register and install the Wazuh agent from the Wazuh Manager Dashboard.

✅ Current support note: This rebuild manual currently supports Ubuntu Server (DEB 64-bit / amd64) agents only.

Step 7A — Install the Wazuh Agent from the Wazuh Manager Dashboard (REQUIRED)

Open the Wazuh Dashboard in your browser (hosted on the Wazuh Manager EC2).

Log in to the dashboard.

Go to the Agents section (Agent management).

Click Add agent (or Deploy new agent, depending on UI version).

Choose:

Operating System: Linux

Distribution/Package: DEB amd64 (Ubuntu Server 64-bit)

The dashboard will generate an install command.

Copy the generated command exactly.

Paste and run it on the Agent VM terminal (your Ubuntu Server agent machine).

After installation, verify the agent shows as connected/active in the dashboard.

Step 7B — Complete the Agent VM setup (Snort + Correlator + Push)

Module: modules/agent-setup/
📌 Follow the exact instructions in: modules/agent-setup/README.md

This module completes the agent-side components:

Snort installation + rules

Correlator service

Push services (Snort push + correlator push)

Required configs and systemd services

Step 7C — Update Agent endpoints (AFTER backend + manager exist)

On the Agent VM, edit:

/etc/ids-agent/agent.env

Update these values:

DASHBOARD_API_BASE_URL=http://<NEW_BACKEND_EC2_IP>:5000
API_KEY=ids_vm_secret_key_123
WAZUH_ALERTS_URL=http://<NEW_WAZUH_MANAGER_IP>:8001/alerts.json
WAZUH_POLL_INTERVAL=5


Restart agent services after change:

sudo systemctl restart snort
sudo systemctl restart snort-push
sudo systemctl restart correlator


# Final Validation Checklist

✅ Terraform applied successfully
✅ Frontend IPs updated and redeployed to S3/CloudFront
✅ Wazuh Manager installed and dashboard accessible
✅ `alerts.json` reachable via HTTP (port 8000)
✅ Wazuh push service configured to send to backend API
✅ Backend API running and reachable on port 5000
✅ Database restored (tables + data exist in RDS)
✅ Agent VM configured (`agent.env`, Snort HOME_NET, interface)
✅ Snort + correlator services running and pushing events
✅ Dashboard displays logs + active agents

---
::contentReference[oaicite:0]{index=0}
```

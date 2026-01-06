
# IDS Agent Setup (Wazuh Agent + Snort + Correlator + Log Push)

This module sets up the **Agent VM** side of the Hybrid IDS system. It installs/configures:
- **Wazuh Agent** (connects to Wazuh Manager)
- **Snort** (network IDS)
- **Correlator** (combines Snort + Wazuh signals)
- **Log Push services** (pushes events to the Dashboard/Backend API)

> ⚠️ Important: When recreating the system, your **Backend API IP** and **Wazuh Manager IP** will change.  
> You MUST update `/etc/ids-agent/agent.env` on the Agent VM.

---

## Quick Install

```bash
git clone https://github.com/SahiK19/agent-setup.git
cd agent-setup
chmod +x install.sh
sudo ./install.sh
````

---

# 1) Configure Agent IDs + Dashboard API + Wazuh Manager (agent.env)

Both `snort_push.py` and `correlate.py` read settings from:

📌 **`/etc/ids-agent/agent.env`**

Use this template as reference:
📄 `config/agent.env.example`

### Edit the config file

```bash
sudo nano /etc/ids-agent/agent.env
```

---

## Required values (MUST be correct)

### A) Dashboard / API (MUST be changed after redeployment)

```env
DASHBOARD_API_BASE_URL=http://18.142.200.244:5000
API_KEY=ids_vm_secret_key_123
```

✅ Replace `18.142.200.244` with your **NEW Backend API EC2 public IP**.

**Example**

```env
DASHBOARD_API_BASE_URL=http://<NEW_BACKEND_EC2_IP>:5000
API_KEY=ids_vm_secret_key_123
```

---

### B) Identity (IMPORTANT — must be unique per machine)

```env
SNORT_AGENT_ID=vm-snort-01
CORRELATOR_AGENT_ID=vm-correlator-01
```

✅ Why this matters:

* The dashboard uses `agent_id` to label events.
* If you reuse IDs across machines, multiple machines will look identical on the dashboard.

---

### C) Snort Log Input

```env
SNORT_FAST_LOG=/var/log/snort/snort.alert.fast
```

---

### D) Wazuh Manager (MUST be changed after redeployment)

If correlator reads Wazuh alerts.json, set:

```env
WAZUH_ALERTS_URL=http://YOUR_WAZUH_MANAGER_IP:8001/alerts.json
WAZUH_POLL_INTERVAL=5
```

✅ Replace `YOUR_WAZUH_MANAGER_IP` with your **NEW Wazuh Manager EC2 public IP**.

**Example**

```env
WAZUH_ALERTS_URL=http://<NEW_WAZUH_MANAGER_IP>:8001/alerts.json
WAZUH_POLL_INTERVAL=5
```

---

# 2) Set Snort HOME_NET (Must match your VM IP/subnet)

Snort rules depend on `HOME_NET`. If it is wrong, you may miss alerts.

### Check your VM IP

```bash
ip -br a
```

Example:

```
eth0 UP 172.21.93.154/20
```

### Update HOME_NET in Snort config

📌 Usually here:

* `/etc/snort/snort.conf`

Edit:

```bash
sudo nano /etc/snort/snort.conf
```

Find:

```conf
ipvar HOME_NET any
```

Change to match your network (example):

```conf
ipvar HOME_NET 172.21.93.154/20
```

✅ Why this matters:

* Many rules only trigger when traffic matches `HOME_NET`.
* Wrong `HOME_NET` = no alerts / incomplete detection.

---

# 3) Ensure Snort Interface is Correct (eth0 vs others)

Snort must listen on the correct interface.

### Check the default interface

```bash
ip route | grep default
```

Example:

```
default via 172.21.80.1 dev eth0 proto kernel
```

### Update Snort interface config

📌 Usually here:

* `/etc/snort/snort.init.conf`

Edit:

```bash
sudo nano /etc/snort/snort.init.conf
```

Set:

```conf
DEBIAN_SNORT_INTERFACE="eth0"
```

✅ Why this matters:

* If Snort listens on the wrong interface, it captures nothing → nothing gets pushed.

---

# 4) Restart Services After Config Changes

After updating:

* `/etc/ids-agent/agent.env`
* `/etc/snort/snort.conf` (HOME_NET)
* `/etc/snort/snort.init.conf` (interface)

Restart:

```bash
sudo systemctl restart snort
sudo systemctl restart snort-push
sudo systemctl restart correlator
```

---

# 5) Verify Services + Logs

### Check service status

```bash
sudo systemctl status snort-push --no-pager -l
sudo systemctl status correlator --no-pager -l
```

### Follow logs live

```bash
sudo journalctl -u snort-push -f
sudo journalctl -u correlator -f
```

---

# 6) Quick Connectivity Test to Dashboard API

### Check port 5000 reachable (replace with NEW backend IP)

```bash
nc -vz -w 3 18.142.200.244 5000
```

### Manual Snort push test (replace with NEW backend IP + correct API key)

```bash
curl -m 5 -i -X POST http://18.142.200.244:5000/api/snort \
  -H "X-API-Key: ids_vm_secret_key_123" \
  -H "Content-Type: application/json" \
  -d '{"timestamp":"2026-01-04 00:00:00","agent_id":"manual-test-snort","msg":"manual test","priority":"1","src_ip":"1.1.1.1","dest_ip":"2.2.2.2"}'
```

✅ If it returns:

```json
{"status":"snort log stored"}
```

…the dashboard API is receiving Snort events.

---


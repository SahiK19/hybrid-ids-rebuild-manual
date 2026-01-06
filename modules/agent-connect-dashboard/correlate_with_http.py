#!/usr/bin/env python3

import time
import json
import re
import threading
from datetime import datetime, timedelta, timezone
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import requests

# ---------- CONFIG ----------

SNORT_FAST_LOG = "/var/log/snort/snort.alert.fast"
WAZUH_ALERTS_URL = "http://47.130.204.203:8001/alerts.json"

# Time windows for correlation
SCAN_TO_SUDO_WINDOW = timedelta(seconds=60)
SCAN_TO_SSH_WINDOW = timedelta(seconds=120)
SSH_FAIL_WINDOW = timedelta(seconds=120)
REVERSE_SHELL_WINDOW = timedelta(seconds=180)
PACKAGE_INSTALL_WINDOW = timedelta(seconds=90)

# How often to poll Wazuh alerts.json (seconds)
WAZUH_POLL_INTERVAL = 5

# Global list to store correlation alerts
correlation_alerts = []

# ---------- HTTP SERVER ----------

class CorrelationHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed_path = urlparse(self.path)
        
        if parsed_path.path == '/correlation-logs':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            # Get query parameters
            query_params = parse_qs(parsed_path.query)
            limit = int(query_params.get('limit', [100])[0])
            
            # Return last N correlation alerts
            recent_alerts = correlation_alerts[-limit:] if correlation_alerts else []
            self.wfile.write(json.dumps(recent_alerts).encode())
        else:
            self.send_response(404)
            self.end_headers()
    
    def log_message(self, format, *args):
        # Suppress HTTP server logs
        pass

def start_http_server():
    """Start HTTP server in background thread"""
    server = HTTPServer(('0.0.0.0', 8002), CorrelationHandler)
    print("[INFO] Correlation HTTP server started on port 8002")
    server.serve_forever()

def log_correlation_alert(alert_type, description, details):
    """Add correlation alert to global list"""
    alert = {
        'id': f"corr_{int(time.time())}_{len(correlation_alerts)}",
        'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'event_type': 'Correlation',
        'alert_type': alert_type,
        'severity': details.get('severity', 'high'),
        'description': description,
        'source_ip': details.get('source_ip', 'unknown'),
        'dest_ip': details.get('dest_ip', 'unknown'),
        'agent_name': details.get('agent_name', 'unknown'),
        'time_difference': details.get('time_diff', 0),
        'snort_events': details.get('snort_count', 0),
        'wazuh_events': details.get('wazuh_count', 0),
        'raw_details': details
    }
    
    correlation_alerts.append(alert)
    
    # Keep only last 1000 alerts
    if len(correlation_alerts) > 1000:
        correlation_alerts.pop(0)

# ---------- HELPERS ----------

def parse_wazuh_timestamp(ts: str) -> datetime:
    try:
        return datetime.strptime(ts, "%Y-%m-%dT%H:%M:%S.%f%z")
    except Exception:
        return datetime.fromisoformat(ts.replace("Z", "+00:00")).replace(tzinfo=timezone.utc)

def extract_first_ip(text: str) -> str | None:
    m = re.search(r"\b(?:\d{1,3}\.){3}\d{1,3}\b", text)
    return m.group(0) if m else None

# ---------- SNORT CLASSIFIERS ----------

def is_nmap_scan_snort(line: str) -> bool:
    up = line.upper()
    return "NMAP" in up or "PING SWEEP" in up

def is_port_scan_snort(line: str) -> bool:
    up = line.upper()
    return ("SYN SCAN" in up or "FIN SCAN" in up or
            "XMAS SCAN" in up or "SCAN DETECTED" in up)

def is_ssh_bruteforce_snort(line: str) -> bool:
    up = line.upper()
    return "SSH BRUTE FORCE" in up

def is_reverse_shell_snort(line: str) -> bool:
    up = line.upper()
    return "REVERSE SHELL" in up

# ---------- WAZUH CLASSIFIERS ----------

def is_sudo_or_priv_esc_wazuh(alert: dict) -> bool:
    rule_id = str(alert.get("rule", {}).get("id", ""))
    desc = alert.get("rule", {}).get("description", "").lower()
    return (
        rule_id in ["200001", "200004"] or
        "privilege escalation" in desc or
        ("sudo" in desc and "root" in desc) or
        "suspicious privileged modification" in desc
    )

def is_ssh_fail_wazuh(alert: dict) -> bool:
    rule_id = str(alert.get("rule", {}).get("id", ""))
    desc = alert.get("rule", {}).get("description", "").lower()
    return (
        rule_id in ["100001", "5716"] or
        ("authentication failed" in desc and "sshd" in desc) or
        "failed password" in desc
    )

def is_ssh_success_wazuh(alert: dict) -> bool:
    rule_id = str(alert.get("rule", {}).get("id", ""))
    desc = alert.get("rule", {}).get("description", "").lower()
    return (
        rule_id == "200003" or
        "successful ssh login" in desc or
        ("session opened" in desc and "sshd" in desc)
    )

def is_package_install_wazuh(alert: dict) -> bool:
    rule_id = str(alert.get("rule", {}).get("id", ""))
    desc = alert.get("rule", {}).get("description", "").lower()
    return (
        rule_id == "12002" or
        "package was installed" in desc or
        "dpkg" in desc
    )

def pretty_time(dt: datetime) -> str:
    return dt.astimezone(timezone.utc).strftime("%Y-%m-%d %H:%M:%S.%f UTC")

# ---------- MAIN CORRELATOR ----------

def main():
    print("[INFO] Starting Enhanced Correlation Engine with HTTP Server")
    print(f"       Watching Snort log : {SNORT_FAST_LOG}")
    print(f"       Reading Wazuh JSON: {WAZUH_ALERTS_URL}")
    print(f"       HTTP server on    : http://0.0.0.0:8002/correlation-logs")
    print()

    # Start HTTP server in background
    http_thread = threading.Thread(target=start_http_server, daemon=True)
    http_thread.start()

    # State for Snort
    snort_pos = 0
    recent_nmap_scans = []
    recent_port_scans = []
    recent_ssh_bruteforce = []
    recent_reverse_shells = []

    # State for Wazuh
    last_wazuh_ts = datetime.min.replace(tzinfo=timezone.utc)
    recent_ssh_fails = []
    recent_priv_esc = []
    last_wazuh_poll = 0

    while True:
        now = datetime.now(timezone.utc)

        # ----- 1) Read new Snort alerts (tail) -----
        try:
            with open(SNORT_FAST_LOG, "r", errors="ignore") as f:
                f.seek(snort_pos)
                new_lines = f.readlines()
                snort_pos = f.tell()
        except FileNotFoundError:
            new_lines = []

        for line in new_lines:
            line = line.strip()
            if not line:
                continue

            src_ip = extract_first_ip(line) or "unknown"
            event = {
                "time": now,
                "src_ip": src_ip,
                "raw": line,
            }

            # Classify Snort alerts
            if is_nmap_scan_snort(line):
                recent_nmap_scans.append(event)
                print(f"\n[SNORT] Detected Nmap/ICMP scan from {src_ip}")

            elif is_port_scan_snort(line):
                recent_port_scans.append(event)
                print(f"\n[SNORT] Detected port scan from {src_ip}")

            elif is_ssh_bruteforce_snort(line):
                recent_ssh_bruteforce.append(event)
                print(f"\n[SNORT] Detected SSH brute force from {src_ip}")

            elif is_reverse_shell_snort(line):
                recent_reverse_shells.append(event)
                print(f"\n[SNORT] Detected reverse shell attempt from {src_ip}")

        # Remove old Snort events
        max_window = max(SCAN_TO_SUDO_WINDOW, SCAN_TO_SSH_WINDOW,
                        REVERSE_SHELL_WINDOW, SSH_FAIL_WINDOW, PACKAGE_INSTALL_WINDOW)
        cutoff = now - max_window
        recent_nmap_scans = [e for e in recent_nmap_scans if e["time"] >= cutoff]
        recent_port_scans = [e for e in recent_port_scans if e["time"] >= cutoff]
        recent_ssh_bruteforce = [e for e in recent_ssh_bruteforce if e["time"] >= cutoff]
        recent_reverse_shells = [e for e in recent_reverse_shells if e["time"] >= cutoff]

        # ----- 2) Periodically pull new Wazuh alerts -----
        if (now - datetime.fromtimestamp(last_wazuh_poll, tz=timezone.utc)).total_seconds() >= WAZUH_POLL_INTERVAL:
            last_wazuh_poll = time.time()
            try:
                resp = requests.get(WAZUH_ALERTS_URL, timeout=3)
                resp.raise_for_status()
                body = resp.json()
            except Exception as e:
                print(f"[WARN] Could not fetch Wazuh alerts: {e}")
                body = []

            max_ts_seen = last_wazuh_ts

            for alert in body:
                ts_str = alert.get("timestamp")
                if not ts_str:
                    continue

                ts = parse_wazuh_timestamp(ts_str)

                if ts <= last_wazuh_ts:
                    continue

                if ts > max_ts_seen:
                    max_ts_seen = ts

                agent_name = alert.get("agent", {}).get("name", "unknown")
                rule_desc = alert.get("rule", {}).get("description", "")
                src_ip = alert.get("data", {}).get("srcip", "unknown")

                # --- CORRELATION LOGIC ---

                # CORRELATION 1: Nmap/Port Scan → Privilege Escalation
                if is_sudo_or_priv_esc_wazuh(alert):
                    recent_priv_esc.append({
                        "time": ts,
                        "agent": agent_name,
                        "desc": rule_desc
                    })

                    # Check for prior Nmap scan
                    for scan in recent_nmap_scans:
                        time_diff = abs((ts - scan["time"]).total_seconds())
                        if time_diff <= SCAN_TO_SUDO_WINDOW.total_seconds():
                            print("\n" + "="*60)
                            print("[CRITICAL] CORRELATED ATTACK: NMAP SCAN → PRIVILEGE ESCALATION")
                            print("="*60)
                            
                            log_correlation_alert(
                                "NMAP_TO_PRIVESC",
                                "Nmap scan followed by privilege escalation",
                                {
                                    'severity': 'critical',
                                    'source_ip': scan['src_ip'],
                                    'agent_name': agent_name,
                                    'time_diff': time_diff,
                                    'snort_count': 1,
                                    'wazuh_count': 1,
                                    'scan_time': pretty_time(scan['time']),
                                    'privesc_time': pretty_time(ts),
                                    'snort_alert': scan['raw'],
                                    'wazuh_alert': rule_desc
                                }
                            )
                            break

                    # Check for prior port scan
                    for scan in recent_port_scans:
                        time_diff = abs((ts - scan["time"]).total_seconds())
                        if time_diff <= SCAN_TO_SUDO_WINDOW.total_seconds():
                            print("\n" + "="*60)
                            print("[CRITICAL] CORRELATED ATTACK: PORT SCAN → PRIVILEGE ESCALATION")
                            print("="*60)
                            
                            log_correlation_alert(
                                "PORTSCAN_TO_PRIVESC",
                                "Port scan followed by privilege escalation",
                                {
                                    'severity': 'critical',
                                    'source_ip': scan['src_ip'],
                                    'agent_name': agent_name,
                                    'time_diff': time_diff,
                                    'snort_count': 1,
                                    'wazuh_count': 1,
                                    'scan_time': pretty_time(scan['time']),
                                    'privesc_time': pretty_time(ts),
                                    'snort_alert': scan['raw'],
                                    'wazuh_alert': rule_desc
                                }
                            )
                            break

                # CORRELATION 2: SSH Brute Force → Success
                if is_ssh_fail_wazuh(alert):
                    recent_ssh_fails.append({"time": ts, "src_ip": src_ip})

                if is_ssh_success_wazuh(alert):
                    recent_ssh_fails[:] = [
                        f for f in recent_ssh_fails
                        if (ts - f["time"]) <= SSH_FAIL_WINDOW
                    ]

                    snort_bruteforce = [
                        b for b in recent_ssh_bruteforce
                        if (ts - b["time"]) <= SCAN_TO_SSH_WINDOW
                    ]

                    if len(recent_ssh_fails) >= 3 or snort_bruteforce:
                        print("\n" + "="*60)
                        print("[CRITICAL] CORRELATED ATTACK: SSH BRUTE FORCE → SUCCESS")
                        print("="*60)
                        
                        log_correlation_alert(
                            "SSH_BRUTEFORCE_SUCCESS",
                            "SSH brute force attack succeeded",
                            {
                                'severity': 'critical',
                                'source_ip': src_ip,
                                'agent_name': agent_name,
                                'wazuh_count': len(recent_ssh_fails),
                                'snort_count': len(snort_bruteforce),
                                'success_time': pretty_time(ts),
                                'wazuh_alert': rule_desc
                            }
                        )
                        recent_ssh_fails.clear()

                # CORRELATION 3: Privilege Escalation → Package Install
                if is_package_install_wazuh(alert):
                    for priv in recent_priv_esc:
                        time_diff = abs((ts - priv["time"]).total_seconds())
                        if time_diff <= PACKAGE_INSTALL_WINDOW.total_seconds():
                            print("\n" + "="*60)
                            print("[WARNING] CORRELATED ACTIVITY: PRIV ESC → PACKAGE INSTALL")
                            print("="*60)
                            
                            log_correlation_alert(
                                "PRIVESC_TO_PACKAGE",
                                "Privilege escalation followed by package installation",
                                {
                                    'severity': 'medium',
                                    'agent_name': agent_name,
                                    'time_diff': time_diff,
                                    'wazuh_count': 2,
                                    'privesc_time': pretty_time(priv['time']),
                                    'package_time': pretty_time(ts),
                                    'privesc_alert': priv['desc'],
                                    'package_alert': rule_desc
                                }
                            )
                            break

            last_wazuh_ts = max_ts_seen

        time.sleep(1)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n[INFO] Correlator stopped by user")
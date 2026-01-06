from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime, timezone
from db import (
    insert_snort_log,
    insert_wazuh_log,
    fetch_correlated_logs,
    insert_correlation_log,
    fetch_logs,
    get_conn
)

API_KEY = "ids_vm_secret_key_123"
app = Flask(__name__)
CORS(app)



# ======================
# TIMESTAMP NORMALIZATION
# ======================
def normalize_ts(ts):
    try:
        s = str(ts).replace("Z", "+00:00")
        if s.endswith(" UTC"):
            s = s.replace(" UTC", "+00:00")
        if len(s) >= 5 and s[-5] in ["+", "-"] and s[-2:].isdigit():
            s = s[:-5] + s[-5:-2] + ":" + s[-2:]
        dt = datetime.fromisoformat(s)
        return dt.astimezone(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
    except Exception:
        return datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")

# ======================
# API KEY AUTH
# ======================
def authorize(req):
    return req.headers.get("X-API-Key") == API_KEY

# ======================
# SNORT ENDPOINT
# ======================
@app.route("/api/snort", methods=["POST"])
def snort_logs():
    if not authorize(request):
        return jsonify({"error": "unauthorized"}), 401
    event = request.json or {}
    normalized = {
        "timestamp": event.get("timestamp"),
        "agent_id": event.get("agent_id", "unknown-agent"),
        "message": event.get("msg") or event.get("message", ""),
        "severity": str(event.get("priority", "INFO")),
        "src_ip": event.get("src_ip"),
        "dest_ip": event.get("dest_ip"),
        "correlated": 0
    }
    insert_snort_log(normalized)
    return jsonify({"status": "snort log stored"}), 200

# ======================
# WAZUH ENDPOINT
# ======================
@app.route("/api/wazuh", methods=["POST"])
def wazuh_logs():
    raw = request.get_json(force=True)

    # ---- NORMALIZE WAZUH EVENT ----
    normalized = {
        "alert_id": raw.get("id"),
        "timestamp": raw.get("timestamp"),

        "agent_name": raw.get("agent", {}).get("name"),
        "agent_ip": raw.get("agent", {}).get("ip"),

        "rule_level": raw.get("rule", {}).get("level"),
        "rule_description": raw.get("rule", {}).get("description"),

        "source_ip": raw.get("data", {}).get("srcip"),
        "dest_ip": raw.get("data", {}).get("dstip"),

        "event_type": "wazuh_alert"
    }

    insert_wazuh_log(normalized)

    return jsonify({"status": "wazuh log stored"})


# ======================
# CORRELATION ENDPOINT
# ======================
@app.route("/api/correlation", methods=["POST"])
def correlation_logs():
    if not authorize(request):
        return jsonify({"error": "unauthorized"}), 401
    event = request.json or {}
    if not event.get("correlated", False):
        return jsonify({"ignored": "not correlated"}), 200
    normalized = {
        "timestamp": event.get("timestamp"),
        "agent_id": event.get("agent_id", "correlator-unknown"),
        "severity": event.get("severity", "medium"),
        "correlated": True,
        "raw": event
    }
    insert_correlation_log(normalized)
    return jsonify({"status": "correlation stored"}), 200

# ======================
# UNIFIED FETCH ENDPOINT
# ======================
@app.route("/api/logs", methods=["GET"])
def get_logs():
    rows = fetch_logs()
    logs = []
    for r in rows:
        logs.append({
            "id": r["id"],
            "timestamp": r["timestamp"],
            "agent_id": r.get("agent_id"),
            "source": r["source"],
            "message": r["message"],
            "severity": r["severity"],
            "correlated": r["correlated"]
        })
    return jsonify(logs), 200

# ======================
# SNORT LOGS ENDPOINT
# ======================
@app.route("/api/snort-logs", methods=["GET"])
def get_snort_logs():
    conn = get_conn()
    cur = conn.cursor()

    cur.execute("""
        SELECT
            id,
            timestamp,
            agent_id,
            source_ip,
            dest_ip,
            source_port,
            dest_port,
            protocol,
            signature AS message,
            severity
        FROM snort_logs
        ORDER BY timestamp DESC
        LIMIT 100
    """)

    rows = cur.fetchall()
    cur.close()
    conn.close()

    results = []
    for r in rows:
        results.append({
            "id": r["id"],
            "timestamp": r["timestamp"],
            "agent_id": r["agent_id"],
            "source": "snort",
            "source_ip": r["source_ip"],
            "dest_ip": r["dest_ip"],
            "source_port": r["source_port"],
            "dest_port": r["dest_port"],
            "protocol": r["protocol"],
            "message": r["message"],
            "severity": r["severity"],
            "correlated": False
        })

    return jsonify(results), 200

# ======================
# WAZUH LOGS ENDPOINT (HIDS)
# ======================
@app.route("/api/wazuh-logs", methods=["GET"])
def get_wazuh_logs():
    conn = get_conn()
    cur = conn.cursor()

    cur.execute("""
        SELECT
            id,
            timestamp,
            agent_name,
            agent_ip,
            rule_level,
            rule_description,
            source_ip,
            dest_ip,
            severity
        FROM wazuh_logs
        ORDER BY timestamp DESC
        LIMIT 100
    """)

    rows = cur.fetchall()
    cur.close()
    conn.close()

    logs = []
    for r in rows:
        logs.append({
            "id": r["id"],
            "timestamp": r["timestamp"],
            "source": "wazuh",
            "agent_name": r["agent_name"],
            "agent_ip": r["agent_ip"],
            "rule_level": r["rule_level"],
            "source_ip": r["source_ip"],
            "dest_ip": r["dest_ip"],
            "message": r["rule_description"],
            "severity": r["severity"],
            "correlated": False
        })

    return jsonify(logs), 200

# ======================
# SEVERITY DISTRIBUTION DASHBOARD
# ======================
@app.route("/api/severity-distribution", methods=["GET"])
def severity_distribution():
    conn = get_conn()
    cur = conn.cursor()

    cur.execute("""
        SELECT
            severity,
            COUNT(*) AS count
        FROM security_logs
        WHERE correlated = 1
          AND timestamp >= NOW() - INTERVAL 24 HOUR
        GROUP BY severity
        ORDER BY count DESC
    """)

    rows = cur.fetchall()
    cur.close()
    conn.close()

    total = sum(r["count"] for r in rows) or 1

    return jsonify([
        {
            "label": r["severity"].capitalize(),
            "count": r["count"],
            "percentage": round((r["count"] / total) * 100, 1)
        }
        for r in rows
    ])

# ======================
# ACTIVITY OVERVIEW DASHBOARD (24-HOUR TIMELINE)
# ======================
@app.route("/api/activity-overview", methods=["GET"])
def activity_overview():
    conn = get_conn()
    cur = conn.cursor()

    # 24 hourly buckets for Snort
    cur.execute("""
        SELECT HOUR(timestamp) as hour, COUNT(*) as count
        FROM snort_logs
        WHERE timestamp >= NOW() - INTERVAL 24 HOUR
        GROUP BY hour
        ORDER BY hour
    """)
    snort = cur.fetchall()

    # 24 hourly buckets for Wazuh
    cur.execute("""
        SELECT HOUR(timestamp) as hour, COUNT(*) as count
        FROM wazuh_logs
        WHERE timestamp >= NOW() - INTERVAL 24 HOUR
        GROUP BY hour
        ORDER BY hour
    """)
    wazuh = cur.fetchall()

    # 24 hourly buckets for Correlated events
    cur.execute("""
        SELECT HOUR(timestamp) as hour, COUNT(*) as count
        FROM security_logs
        WHERE correlated = 1
          AND timestamp >= NOW() - INTERVAL 24 HOUR
        GROUP BY hour
        ORDER BY hour
    """)
    correlated = cur.fetchall()

    cur.close()
    conn.close()

    return jsonify({
        "snort": snort,
        "wazuh": wazuh,
        "correlated": correlated
    }), 200

# ======================
# CRITICAL ALERT COUNT
# ======================
@app.route("/api/dashboard/critical-count", methods=["GET"])
def critical_alert_count():
    conn = get_conn()
    cur = conn.cursor()

    cur.execute("""
        SELECT COUNT(*) AS total
        FROM security_logs
        WHERE severity = 'critical'
    """)

    result = cur.fetchone()
    cur.close()
    conn.close()

    return jsonify({
        "critical": result["total"]
    }), 200

# ======================
# CORRELATED STATS
# ======================
@app.route("/api/dashboard/correlated-stats", methods=["GET"])
def correlated_stats():
    conn = get_conn()
    cur = conn.cursor()

    # Today (last 24 hours)
    cur.execute("""
        SELECT COUNT(*) AS total
        FROM security_logs
        WHERE timestamp >= NOW() - INTERVAL 1 DAY
    """)
    today = cur.fetchone()["total"]

    # Yesterday (24–48 hours ago)
    cur.execute("""
        SELECT COUNT(*) AS total
        FROM security_logs
        WHERE timestamp >= NOW() - INTERVAL 2 DAY
          AND timestamp < NOW() - INTERVAL 1 DAY
    """)
    yesterday = cur.fetchone()["total"]

    cur.close()
    conn.close()

    # Percentage change calculation
    if yesterday == 0:
        percentage = 100 if today > 0 else 0
    else:
        percentage = round(((today - yesterday) / yesterday) * 100)

    return jsonify({
        "today": today,
        "yesterday": yesterday,
        "percentage_change": percentage
    }), 200

# ======================
# ACTIVE CORRELATED AGENTS
# ======================
@app.route("/api/dashboard/active-correlated-agents", methods=["GET"])
def active_correlated_agents():
    conn = get_conn()
    cur = conn.cursor()

    cur.execute("""
        SELECT DISTINCT
            COALESCE(
                JSON_UNQUOTE(JSON_EXTRACT(raw_json, '$.raw.agent_id')),
                agent_id
            ) AS agent_id
        FROM security_logs
        WHERE correlated = 1
          AND timestamp >= NOW() - INTERVAL 24 HOUR
          AND (
                JSON_EXTRACT(raw_json, '$.raw.agent_id') IS NOT NULL
                OR agent_id IS NOT NULL
          )
    """)

    rows = cur.fetchall()
    cur.close()
    conn.close()

    agents = [r["agent_id"] for r in rows if r["agent_id"]]

    return jsonify({
        "active_agents": agents,
        "total": len(agents)
    }), 200

@app.route("/api/correlated-logs", methods=["GET"])
def get_correlated_logs():
    rows = fetch_correlated_logs()

    logs = []
    for r in rows:
        logs.append({
            "id": r["id"],
            "timestamp": r["timestamp"],
            "source": r["source"],
            "agent_id": r["agent_id"],
            "message": r["message"],
            "severity": r["severity"],
            "correlated": True
        })

    return jsonify(logs), 200


# ======================
# RUN SERVER
# ======================
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)

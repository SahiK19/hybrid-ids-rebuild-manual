# Add this endpoint to your app.py file after the existing endpoints

# ======================
# HIDS LOGS ENDPOINT (alias for wazuh-logs)
# ======================
@app.route("/api/hids-logs", methods=["GET"])
def get_hids_logs():
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
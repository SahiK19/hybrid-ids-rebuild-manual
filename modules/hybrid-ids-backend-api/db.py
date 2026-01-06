import json
import pymysql
from datetime import datetime

# ======================
# Database Configuration
# ======================
DB_HOST = "hybrid-ids-db.cng686oswnr1.ap-southeast-1.rds.amazonaws.com"
DB_USER = "admin"
DB_PASS = "ft##]O+7nlMprPKx"
DB_NAME = "hybrididsdb"

def get_conn():
    return pymysql.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASS,
        database=DB_NAME,
        cursorclass=pymysql.cursors.DictCursor,
        autocommit=True
    )

# ======================
# HELPER FUNCTIONS
# ======================
def map_severity(value):
    """
    Maps Snort priority or text severity to ENUM(low, medium, high, critical)
    """
    if value is None:
        return "medium"
    try:
        value = int(value)
        if value == 1:
            return "critical"
        elif value == 2:
            return "high"
        elif value == 3:
            return "medium"
        else:
            return "low"
    except:
        value = str(value).lower()
        if value in ("critical", "high", "medium", "low"):
            return value
        return "medium"

def map_wazuh_severity(level):
    """
    Maps Wazuh rule levels (0–15) to ENUM(low, medium, high, critical)
    """
    try:
        level = int(level)
        if level >= 12:
            return "critical"
        elif level >= 8:
            return "high"
        elif level >= 4:
            return "medium"
        else:
            return "low"
    except:
        return "medium"

def parse_wazuh_timestamp(ts):
    if not ts:
        return None

    # Case 1: Already MySQL format (YYYY-MM-DD HH:MM:SS)
    try:
        return datetime.strptime(
            ts,
            "%Y-%m-%d %H:%M:%S"
        ).strftime("%Y-%m-%d %H:%M:%S")
    except:
        pass

    # Case 2: Wazuh ISO-8601 format
    try:
        return datetime.strptime(
            ts,
            "%Y-%m-%dT%H:%M:%S.%f%z"
        ).strftime("%Y-%m-%d %H:%M:%S")
    except Exception as e:
        print("⚠️ TIMESTAMP PARSE FAILED:", ts, e)
        return None

# ======================
# SNORT LOG INSERT
# ======================
def insert_snort_log(event):
    conn = get_conn()
    cur = conn.cursor()

    sql = """
        INSERT INTO snort_logs
        (
            timestamp,
            agent_id,
            source_ip,
            dest_ip,
            source_port,
            dest_port,
            protocol,
            signature,
            severity,
            event_type,
            raw_data
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """

    cur.execute(sql, (
        event.get("timestamp") or datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
        event.get("agent_id"),
        event.get("src_ip"),
        event.get("dest_ip"),
        event.get("src_port"),        # can be NULL
        event.get("dest_port"),       # can be NULL
        event.get("protocol"),        # can be NULL
        event.get("message"),
        map_severity(event.get("severity")),
        event.get("event_type", "snort_alert"),
        json.dumps(event)
    ))

    conn.commit()
    cur.close()
    conn.close()

# ======================
# WAZUH LOG INSERT
# ======================
def insert_wazuh_log(event):
    print("🔥🔥🔥 insert_wazuh_log CALLED 🔥🔥🔥")
    print("🔥 EVENT:", event)

    conn = get_conn()
    cur = conn.cursor()

    try:
        # --- FIX TIMESTAMP ---
        ts = parse_wazuh_timestamp(event.get("timestamp"))
        if not ts or ts.startswith("0000"):
            ts = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")

        # --- FIX AGENT NAME ---
        agent_name = (
            event.get("agent_name")
            or event.get("agent", {}).get("name")
            or "unknown"
        )

        sql = """
            INSERT INTO wazuh_logs
            (
                alert_id,
                timestamp,
                agent_name,
                agent_ip,
                rule_level,
                rule_description,
                source_ip,
                dest_ip,
                event_type,
                severity,
                raw_data
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """

        cur.execute(sql, (
            event.get("alert_id"),
            ts,
            agent_name,
            event.get("agent_ip"),
            event.get("rule_level") or 0,
            event.get("rule_description") or "No description",
            event.get("source_ip"),
            event.get("dest_ip"),
            event.get("event_type", "wazuh_alert"),
            map_wazuh_severity(event.get("rule_level")),
            json.dumps(event)
        ))

        conn.commit()

    except Exception as e:
        print("❌ WAZUH DB INSERT FAILED:", e)
        print("❌ EVENT:", event)

    finally:
        cur.close()
        conn.close()

# ======================
# CORRELATION LOG INSERT
# ======================
def insert_correlation_log(event):
    conn = get_conn()
    cur = conn.cursor()
    sql = """
        INSERT INTO security_logs
        (timestamp, source, agent_id, severity, correlated, raw_json)
        VALUES (%s, %s, %s, %s, %s, %s)
    """
    cur.execute(sql, (
        event.get("timestamp"),
        "correlation",
        event.get("agent_id"),   # 👈 THIS IS THE KEY LINE
        event.get("severity"),
        1,
        json.dumps(event)
    ))
    conn.commit()
    cur.close()
    conn.close()

# ======================
# FETCH UNIFIED LOG VIEW
# ======================
def fetch_logs(limit=100):
    conn = get_conn()
    cur = conn.cursor()

    sql = """
        (
            SELECT
                id,
                timestamp,
                agent_id,
                'snort' AS source,
                signature AS message,
                severity,
                0 AS correlated
            FROM snort_logs
        )
        UNION ALL
        (
            SELECT
                id,
                timestamp,
                agent_id,
                'correlation' AS source,
                JSON_UNQUOTE(JSON_EXTRACT(raw_json, '$.correlation_type')) AS message,
                severity,
                1 AS correlated
            FROM security_logs
        )
        ORDER BY timestamp DESC
        LIMIT %s
    """

    cur.execute(sql, (limit,))
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return rows



def fetch_correlated_logs(limit=50):
    conn = get_conn()
    cur = conn.cursor()

    sql = """
        SELECT
            id,
            timestamp,
            agent_id,
            'correlation' AS source,
            COALESCE(
                JSON_UNQUOTE(JSON_EXTRACT(raw_json, '$.raw.correlation_type')),
                JSON_UNQUOTE(JSON_EXTRACT(raw_json, '$.correlation_type')),
                JSON_UNQUOTE(JSON_EXTRACT(raw_json, '$.message'))
            ) AS message,
            severity,
            correlated
        FROM security_logs
        WHERE correlated = 1
          AND timestamp IS NOT NULL
          AND timestamp != 'MANUAL_TEST'
        ORDER BY timestamp DESC
        LIMIT %s
    """

    cur.execute(sql, (limit,))
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return rows

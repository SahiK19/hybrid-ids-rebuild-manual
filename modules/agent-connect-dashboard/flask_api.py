#!/usr/bin/env python3

from flask import Flask, jsonify, request
from flask_cors import CORS
import mysql.connector
import json
from datetime import datetime
import os

app = Flask(__name__)
CORS(app)

# Database configuration - update with your actual credentials
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'your_password',  # Update this
    'database': 'security_logs'
}

@app.route('/api/hids-logs', methods=['GET'])
def get_hids_logs():
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(dictionary=True)
        
        query = """
        SELECT id, timestamp, agent_name, agent_ip, rule_level, source_ip, 
               dest_ip, severity, rule_description, created_at
        FROM wazuh_logs 
        ORDER BY created_at DESC 
        LIMIT 100
        """
        
        cursor.execute(query)
        results = cursor.fetchall()
        
        logs = []
        for r in results:
            log_entry = {
                "id": r["id"],
                "timestamp": r["timestamp"],
                "agent_name": r["agent_name"],
                "agent_ip": r["agent_ip"],
                "rule_level": r["rule_level"],
                "source_ip": r["source_ip"],
                "dest_ip": r["dest_ip"],
                "severity": r["severity"],
                "message": r["rule_description"]
            }
            logs.append(log_entry)
        
        cursor.close()
        conn.close()
        
        return jsonify(logs)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/wazuh-logs', methods=['GET'])
def get_wazuh_logs():
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(dictionary=True)
        
        query = """
        SELECT id, timestamp, agent_name, agent_ip, rule_level, source_ip, 
               dest_ip, severity, rule_description, created_at
        FROM wazuh_logs 
        ORDER BY created_at DESC 
        LIMIT 100
        """
        
        cursor.execute(query)
        results = cursor.fetchall()
        
        logs = []
        for r in results:
            log_entry = {
                "id": r["id"],
                "timestamp": r["timestamp"],
                "agent_name": r["agent_name"],
                "agent_ip": r["agent_ip"],
                "rule_level": r["rule_level"],
                "source_ip": r["source_ip"],
                "dest_ip": r["dest_ip"],
                "severity": r["severity"],
                "message": r["rule_description"]
            }
            logs.append(log_entry)
        
        cursor.close()
        conn.close()
        
        return jsonify(logs)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/snort-logs', methods=['GET'])
def get_snort_logs():
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(dictionary=True)
        
        query = """
        SELECT id, timestamp, source_ip, dest_ip, source_port, dest_port, 
               severity, signature, agent_id, created_at
        FROM snort_logs 
        ORDER BY created_at DESC 
        LIMIT 100
        """
        
        cursor.execute(query)
        results = cursor.fetchall()
        
        print(f"DEBUG: Found {len(results)} snort logs")  # Debug log
        if results:
            print(f"DEBUG: First result: {results[0]}")  # Debug log
        
        logs = []
        for r in results:
            log_entry = {
                "id": r["id"],
                "timestamp": r["timestamp"],
                "source": "snort",
                "agent_id": r.get("agent_id") or "Unknown",
                "source_ip": r["source_ip"],
                "dest_ip": r["dest_ip"],
                "source_port": r["source_port"],
                "dest_port": r["dest_port"],
                "severity": r["severity"],
                "signature": r["signature"]
            }
            print(f"DEBUG: Processing log {r['id']}, agent_id: {r.get('agent_id')}")  # Debug log
            logs.append(log_entry)
        
        cursor.close()
        conn.close()
        
        return jsonify(logs)
        
    except Exception as e:
        print(f"DEBUG: Error in snort-logs: {str(e)}")  # Debug log
        return jsonify({'error': str(e)}), 500

@app.route('/api/activity-overview', methods=['GET'])
def get_activity_overview():
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(dictionary=True)
        
        snort_query = """
        SELECT HOUR(created_at) as hour, COUNT(*) as count 
        FROM snort_logs 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
        GROUP BY HOUR(created_at)
        """
        
        wazuh_query = """
        SELECT HOUR(created_at) as hour, COUNT(*) as count 
        FROM wazuh_logs 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
        GROUP BY HOUR(created_at)
        """
        
        correlated_query = """
        SELECT HOUR(created_at) as hour, COUNT(*) as count 
        FROM security_logs 
        WHERE correlated = 1 AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
        GROUP BY HOUR(created_at)
        """
        
        cursor.execute(snort_query)
        snort_data = cursor.fetchall()
        
        cursor.execute(wazuh_query)
        wazuh_data = cursor.fetchall()
        
        cursor.execute(correlated_query)
        correlated_data = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return jsonify({
            "snort": snort_data,
            "wazuh": wazuh_data,
            "correlated": correlated_data
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/severity-distribution', methods=['GET'])
def get_severity_distribution():
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(dictionary=True)
        
        query = """
        SELECT severity, COUNT(*) as count 
        FROM security_logs 
        WHERE correlated = 1 
        GROUP BY severity
        """
        
        cursor.execute(query)
        data = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return jsonify(data)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/dashboard/critical-count', methods=['GET'])
def get_critical_count():
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(dictionary=True)
        
        query = """
        SELECT COUNT(*) as critical 
        FROM security_logs 
        WHERE correlated = 1 AND LOWER(severity) = 'critical'
        """
        
        cursor.execute(query)
        result = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        return jsonify({'critical': result['critical'] if result else 0})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/dashboard/correlated-stats', methods=['GET'])
def get_correlated_stats():
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(dictionary=True)
        
        # Get today's count (last 24 hours)
        today_query = """
        SELECT COUNT(*) as today 
        FROM security_logs 
        WHERE correlated = 1 AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
        """
        
        # Get yesterday's count (24-48 hours ago)
        yesterday_query = """
        SELECT COUNT(*) as yesterday 
        FROM security_logs 
        WHERE correlated = 1 
        AND created_at >= DATE_SUB(NOW(), INTERVAL 48 HOUR)
        AND created_at < DATE_SUB(NOW(), INTERVAL 24 HOUR)
        """
        
        cursor.execute(today_query)
        today_result = cursor.fetchone()
        today = today_result['today'] if today_result else 0
        
        cursor.execute(yesterday_query)
        yesterday_result = cursor.fetchone()
        yesterday = yesterday_result['yesterday'] if yesterday_result else 0
        
        # Calculate percentage change
        if yesterday > 0:
            percentage_change = round(((today - yesterday) / yesterday) * 100, 1)
        else:
            percentage_change = 100 if today > 0 else 0
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'today': today,
            'yesterday': yesterday,
            'percentage_change': percentage_change
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/dashboard/active-agents-count', methods=['GET'])
def get_active_agents_count():
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(dictionary=True)
        
        query = """
        SELECT COUNT(DISTINCT agent_id) as active_agents 
        FROM security_logs 
        WHERE correlated = 1 AND agent_id IS NOT NULL
        AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
        """
        
        cursor.execute(query)
        result = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        return jsonify({'active_agents': result['active_agents'] if result else 0})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/dashboard/active-correlated-agents', methods=['GET'])
def get_active_correlated_agents():
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(dictionary=True)
        
        # Get distinct agent IDs
        query = """
        SELECT DISTINCT agent_id 
        FROM security_logs 
        WHERE correlated = 1 AND agent_id IS NOT NULL
        AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
        """
        
        cursor.execute(query)
        results = cursor.fetchall()
        
        # Extract agent IDs into array
        active_agents = [row['agent_id'] for row in results] if results else []
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'active_agents': active_agents,
            'total': len(active_agents)
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/logs', methods=['GET'])
def get_logs():
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(dictionary=True)
        
        query = """
        SELECT id, timestamp, source, message, severity, raw_json, created_at, agent_id
        FROM security_logs 
        WHERE correlated = 1 
        ORDER BY created_at DESC 
        LIMIT 50
        """
        
        cursor.execute(query)
        logs = cursor.fetchall()
        
        processed_logs = []
        for log in logs:
            processed_log = dict(log)
            processed_log['correlated'] = True
            
            if not processed_log.get('message') and processed_log.get('raw_json'):
                try:
                    raw_data = json.loads(processed_log['raw_json'])
                    if raw_data.get('message'):
                        processed_log['message'] = raw_data['message']
                    elif raw_data.get('correlation_type'):
                        processed_log['message'] = raw_data['correlation_type']
                    elif raw_data.get('stage1') and raw_data.get('stage2'):
                        stage1 = raw_data['stage1'].get('wazuh_alert', 'Unknown event')
                        stage2 = raw_data['stage2'].get('wazuh_alert', 'Unknown event')
                        processed_log['message'] = f"Correlated events: {stage1} → {stage2}"
                except:
                    pass
            
            if not processed_log.get('message'):
                processed_log['message'] = 'No description available'
                
            processed_logs.append(processed_log)
        
        cursor.close()
        conn.close()
        
        return jsonify(processed_logs)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/correlated-logs', methods=['GET'])
def get_correlated_logs():
    try:
        # Connect to database
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(dictionary=True)
        
        # Get correlated logss
        query = """
        SELECT id, timestamp, source, message, severity, raw_json, created_at 
        FROM security_logs 
        WHERE correlated = 1 
        ORDER BY created_at DESC 
        LIMIT 50
        """
        
        cursor.execute(query)
        logs = cursor.fetchall()
        
        # Process logs to extract messages from raw_json if needed
        processed_logs = []
        for log in logs:
            processed_log = dict(log)
            
            # If message is empty, try to extract from raw_json
            if not processed_log.get('message') and processed_log.get('raw_json'):
                try:
                    raw_data = json.loads(processed_log['raw_json'])
                    if raw_data.get('message'):
                        processed_log['message'] = raw_data['message']
                    elif raw_data.get('correlation_type'):
                        processed_log['message'] = raw_data['correlation_type']
                    elif raw_data.get('stage1') and raw_data.get('stage2'):
                        stage1 = raw_data['stage1'].get('wazuh_alert', 'Unknown event')
                        stage2 = raw_data['stage2'].get('wazuh_alert', 'Unknown event')
                        processed_log['message'] = f"Correlated events: {stage1} → {stage2}"
                except:
                    pass
            
            # Ensure message has a value
            if not processed_log.get('message'):
                processed_log['message'] = 'No description available'
                
            processed_logs.append(processed_log)
        
        cursor.close()
        conn.close()
        
        return jsonify(processed_logs)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
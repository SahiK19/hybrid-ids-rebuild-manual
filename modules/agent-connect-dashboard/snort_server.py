#!/usr/bin/env python3

import json
import re
from datetime import datetime
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

SNORT_FAST_LOG = "/var/log/snort/snort.alert.fast"

class SnortHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed_path = urlparse(self.path)
        
        if parsed_path.path == '/snort-logs':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            # Get query parameters
            query_params = parse_qs(parsed_path.query)
            limit = int(query_params.get('limit', [100])[0])
            
            logs = self.get_snort_logs(limit)
            self.wfile.write(json.dumps(logs).encode())
        else:
            self.send_response(404)
            self.end_headers()
    
    def get_snort_logs(self, limit):
        logs = []
        try:
            with open(SNORT_FAST_LOG, 'r') as f:
                lines = f.readlines()
                
            # Parse last N lines
            for line in lines[-limit:]:
                line = line.strip()
                if not line:
                    continue
                    
                # Parse Snort fast log format
                # Example: 12/15-10:30:45.123456  [**] [1:2100498:7] GPL CHAT IRC privmsg command [**] [Classification: policy-violation] [Priority: 3] {TCP} 192.168.1.100:1234 -> 10.0.0.1:6667
                
                log_entry = self.parse_snort_line(line)
                if log_entry:
                    logs.append(log_entry)
                    
        except FileNotFoundError:
            pass
            
        return logs
    
    def parse_snort_line(self, line):
        # Extract timestamp, rule info, IPs
        timestamp_match = re.search(r'(\d{2}/\d{2}-\d{2}:\d{2}:\d{2}\.\d+)', line)
        rule_match = re.search(r'\[(\d+):(\d+):(\d+)\]', line)
        desc_match = re.search(r'\] ([^[]+) \[', line)
        ip_match = re.search(r'{(\w+)} ([^:]+):(\d+) -> ([^:]+):(\d+)', line)
        
        if not all([timestamp_match, rule_match, desc_match, ip_match]):
            return None
            
        return {
            'id': f"snort_{timestamp_match.group(1).replace('/', '').replace('-', '').replace(':', '').replace('.', '')}",
            'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'source_ip': ip_match.group(2),
            'dest_ip': ip_match.group(4),
            'source_port': ip_match.group(3),
            'dest_port': ip_match.group(5),
            'protocol': ip_match.group(1),
            'rule_id': f"{rule_match.group(1)}:{rule_match.group(2)}:{rule_match.group(3)}",
            'description': desc_match.group(1).strip(),
            'severity': self.determine_severity(line),
            'event_type': 'Snort IDS',
            'raw_log': line
        }
    
    def determine_severity(self, line):
        if 'Priority: 1' in line:
            return 'critical'
        elif 'Priority: 2' in line:
            return 'high'
        elif 'Priority: 3' in line:
            return 'medium'
        else:
            return 'low'

if __name__ == '__main__':
    server = HTTPServer(('0.0.0.0', 8001), SnortHandler)
    print("Snort HTTP server running on port 8001")
    server.serve_forever()
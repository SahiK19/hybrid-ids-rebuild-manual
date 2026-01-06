#!/usr/bin/env python3

import json
import os
from datetime import datetime
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

CORRELATION_LOG_FILE = "/var/log/correlation.log"

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
            
            logs = self.get_correlation_logs(limit)
            self.wfile.write(json.dumps(logs).encode())
        else:
            self.send_response(404)
            self.end_headers()
    
    def get_correlation_logs(self, limit):
        logs = []
        
        if not os.path.exists(CORRELATION_LOG_FILE):
            return logs
            
        try:
            with open(CORRELATION_LOG_FILE, 'r') as f:
                content = f.read()
                
            # Find correlation blocks (lines with [CRITICAL] or [WARNING])
            correlation_blocks = []
            lines = content.split('\n')
            
            current_block = []
            for line in lines:
                if '[CRITICAL]' in line or '[WARNING]' in line:
                    if current_block:
                        correlation_blocks.append('\n'.join(current_block))
                    current_block = [line]
                elif line.startswith('=') or line.startswith('[*]') or line.startswith('    '):
                    if current_block:
                        current_block.append(line)
                elif current_block and line.strip() == '':
                    correlation_blocks.append('\n'.join(current_block))
                    current_block = []
            
            if current_block:
                correlation_blocks.append('\n'.join(current_block))
            
            # Parse last N correlation blocks
            for block in correlation_blocks[-limit:]:
                log_entry = self.parse_correlation_block(block)
                if log_entry:
                    logs.append(log_entry)
                    
        except FileNotFoundError:
            pass
            
        return logs
    
    def parse_correlation_block(self, block):
        """Parse a correlation block into structured data"""
        lines = block.split('\n')
        
        if not lines:
            return None
            
        first_line = lines[0]
        
        # Extract alert type and severity
        if '[CRITICAL]' in first_line:
            severity = 'critical'
        elif '[WARNING]' in first_line:
            severity = 'medium'
        else:
            severity = 'low'
            
        # Extract description
        description = first_line.replace('[CRITICAL]', '').replace('[WARNING]', '').replace('CORRELATED ATTACK:', '').replace('CORRELATED ACTIVITY:', '').strip()
        
        # Extract IPs and other details from the block
        source_ip = 'unknown'
        agent_name = 'unknown'
        time_diff = 0
        
        for line in lines:
            if 'from' in line and '.' in line:
                # Try to extract IP
                import re
                ip_match = re.search(r'\b(?:\d{1,3}\.){3}\d{1,3}\b', line)
                if ip_match:
                    source_ip = ip_match.group(0)
            
            if 'on ' in line and 'agent' in line.lower():
                # Try to extract agent name
                parts = line.split('on ')
                if len(parts) > 1:
                    agent_name = parts[1].split()[0]
            
            if 'Time difference' in line:
                # Extract time difference
                import re
                time_match = re.search(r'(\d+\.?\d*) seconds', line)
                if time_match:
                    time_diff = float(time_match.group(1))
        
        return {
            'id': f"corr_{hash(block)}",
            'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'source_ip': source_ip,
            'dest_ip': 'unknown',
            'event_type': 'Correlation',
            'severity': severity,
            'description': description,
            'agent_name': agent_name,
            'time_difference': time_diff,
            'raw_data': block
        }
    
    def log_message(self, format, *args):
        # Suppress HTTP server logs
        pass

if __name__ == '__main__':
    server = HTTPServer(('0.0.0.0', 8002), CorrelationHandler)
    print("Correlation HTTP server running on port 8002")
    print(f"Reading logs from: {CORRELATION_LOG_FILE}")
    server.serve_forever()
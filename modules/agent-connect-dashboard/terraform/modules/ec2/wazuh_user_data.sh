#!/bin/bash
set -e

# Update system
apt-get update -y
apt-get upgrade -y

# Install dependencies
apt-get install -y curl apt-transport-https lsb-release gnupg python3

# Install Wazuh Manager
curl -s https://packages.wazuh.com/key/GPG-KEY-WAZUH | gpg --no-default-keyring --keyring gnupg-ring:/usr/share/keyrings/wazuh.gpg --import && chmod 644 /usr/share/keyrings/wazuh.gpg
echo "deb [signed-by=/usr/share/keyrings/wazuh.gpg] https://packages.wazuh.com/4.x/apt/ stable main" | tee -a /etc/apt/sources.list.d/wazuh.list
apt-get update -y
apt-get install -y wazuh-manager

# Enable and start Wazuh Manager
systemctl daemon-reload
systemctl enable wazuh-manager
systemctl start wazuh-manager

# Wait for Wazuh to generate alerts.json
sleep 30

# Create HTTP server service to serve alerts.json
cat > /etc/systemd/system/wazuh-http-server.service << 'EOF'
[Unit]
Description=Wazuh Alerts HTTP Server
After=network.target wazuh-manager.service

[Service]
Type=simple
User=root
WorkingDirectory=/var/ossec/logs/alerts
ExecStart=/usr/bin/python3 -m http.server 8000
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Enable and start HTTP server
systemctl daemon-reload
systemctl enable wazuh-http-server
systemctl start wazuh-http-server

echo "Wazuh Manager installation complete"

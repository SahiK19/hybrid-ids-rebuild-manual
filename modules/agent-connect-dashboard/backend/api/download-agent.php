<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/config.php';

header('Content-Type: application/octet-stream');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

$apiToken = $_GET['token'] ?? '';

if (!$apiToken) {
    http_response_code(400);
    echo json_encode(['error' => 'API token required']);
    exit();
}

try {
    $db = new Database();
    $conn = $db->getConnection();
    
    $stmt = $conn->prepare("SELECT id, username FROM users WHERE api_token = ?");
    $stmt->execute([$apiToken]);
    $user = $stmt->fetch();
    
    if (!$user) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid API token']);
        exit();
    }
    
    // Generate agent script with embedded API token
    $agentScript = generateAgentScript($apiToken, $user['username']);
    
    header('Content-Disposition: attachment; filename="install-agent.sh"');
    header('Content-Length: ' . strlen($agentScript));
    
    echo $agentScript;
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Download failed']);
}

function generateAgentScript($apiToken, $username) {
    return <<<SCRIPT
#!/bin/bash
# SecureWatch Agent Installer
# User: {$username}
# API Token: {$apiToken}

set -e

echo "Installing SecureWatch Agent..."

# Set environment variables
export SECUREWATCH_API_TOKEN="{$apiToken}"
export SECUREWATCH_USERNAME="{$username}"

# Install Wazuh agent
curl -s https://packages.wazuh.com/key/GPG-KEY-WAZUH | gpg --no-default-keyring --keyring gnupg-ring:/usr/share/keyrings/wazuh.gpg --import && chmod 644 /usr/share/keyrings/wazuh.gpg
echo "deb [signed-by=/usr/share/keyrings/wazuh.gpg] https://packages.wazuh.com/4.x/apt/ stable main" | tee -a /etc/apt/sources.list.d/wazuh.list
apt-get update -y
apt-get install -y wazuh-agent

# Configure agent
echo "WAZUH_MANAGER='WAZUH_MANAGER_IP'" >> /var/ossec/etc/ossec.conf
echo "WAZUH_AGENT_NAME='\$(hostname)'" >> /var/ossec/etc/ossec.conf

# Create environment file
echo "SECUREWATCH_API_TOKEN={$apiToken}" > /etc/securewatch/config
echo "SECUREWATCH_USERNAME={$username}" >> /etc/securewatch/config

# Start agent
systemctl enable wazuh-agent
systemctl start wazuh-agent

echo "SecureWatch Agent installed successfully!"
echo "API Token: {$apiToken}"
SCRIPT;
}
?>
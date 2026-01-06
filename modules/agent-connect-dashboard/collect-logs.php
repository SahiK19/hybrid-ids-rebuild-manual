#!/usr/bin/env php
<?php
require_once __DIR__ . '/backend/config/config.php';

try {
    $database = new Database();
    $pdo = $database->getConnection();

    $wazuhCount = collectWazuhLogs($pdo);
    $snortCount = collectSnortLogs($pdo);
    $correlationCount = collectCorrelationLogs($pdo);
    
    updateDailyStats($pdo, $wazuhCount, $snortCount, $correlationCount);
    updateAgentStatus($pdo);
    
    echo "[" . date('Y-m-d H:i:s') . "] Collected: Wazuh=$wazuhCount, Snort=$snortCount, Correlation=$correlationCount\n";
    
} catch (Exception $e) {
    echo "[" . date('Y-m-d H:i:s') . "] ERROR: " . $e->getMessage() . "\n";
}

function collectWazuhLogs($pdo) {
    $data = @file_get_contents('http://47.130.204.203:8000/alerts.json', false, 
        stream_context_create(['http' => ['timeout' => 10]]));
    if (!$data) return 0;
    
    $lines = explode("\n", trim($data));
    $count = 0;
    
    $stmt = $pdo->prepare("INSERT IGNORE INTO wazuh_logs 
        (alert_id, timestamp, agent_name, agent_ip, rule_level, rule_description, 
         source_ip, dest_ip, event_type, severity, raw_data) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    
    foreach ($lines as $line) {
        if (empty(trim($line))) continue;
        $alert = json_decode($line, true);
        if (!$alert) continue;
        
        $stmt->execute([
            $alert['id'] ?? uniqid(),
            $alert['timestamp'] ?? date('Y-m-d H:i:s'),
            $alert['agent']['name'] ?? 'unknown',
            $alert['agent']['ip'] ?? 'unknown',
            $alert['rule']['level'] ?? 0,
            $alert['rule']['description'] ?? 'Unknown event',
            $alert['data']['srcip'] ?? $alert['agent']['ip'] ?? 'unknown',
            $alert['data']['dstip'] ?? 'unknown',
            determineEventType($alert),
            determineSeverity($alert['rule']['level'] ?? 0),
            json_encode($alert)
        ]);
        $count++;
    }
    return $count;
}

function collectSnortLogs($pdo) {
    $data = @file_get_contents('http://192.168.100.197:8001/snort-logs?limit=100', false,
        stream_context_create(['http' => ['timeout' => 5]]));
    if (!$data) return 0;
    
    $logs = json_decode($data, true);
    if (!$logs) return 0;
    
    $stmt = $pdo->prepare("INSERT IGNORE INTO snort_logs 
        (timestamp, source_ip, dest_ip, source_port, dest_port, protocol, 
         signature, severity, event_type, raw_data) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    
    $count = 0;
    foreach ($logs as $log) {
        $stmt->execute([
            $log['timestamp'] ?? date('Y-m-d H:i:s'),
            $log['source_ip'] ?? 'unknown',
            $log['dest_ip'] ?? 'unknown',
            $log['source_port'] ?? 0,
            $log['dest_port'] ?? 0,
            $log['protocol'] ?? 'unknown',
            $log['signature'] ?? 'Unknown signature',
            $log['severity'] ?? 'low',
            $log['event_type'] ?? 'IDS Alert',
            json_encode($log)
        ]);
        $count++;
    }
    return $count;
}

function collectCorrelationLogs($pdo) {
    $data = @file_get_contents('http://192.168.100.197:8002/correlation-logs?limit=100', false,
        stream_context_create(['http' => ['timeout' => 5]]));
    if (!$data) return 0;
    
    $logs = json_decode($data, true);
    if (!$logs) return 0;
    
    $stmt = $pdo->prepare("INSERT IGNORE INTO correlation_logs 
        (correlation_id, timestamp, event_count, source_ips, dest_ips, 
         correlation_rule, risk_score, severity, description, raw_data) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    
    $count = 0;
    foreach ($logs as $log) {
        $stmt->execute([
            $log['correlation_id'] ?? uniqid(),
            $log['timestamp'] ?? date('Y-m-d H:i:s'),
            $log['event_count'] ?? 1,
            json_encode($log['source_ips'] ?? []),
            json_encode($log['dest_ips'] ?? []),
            $log['correlation_rule'] ?? 'Unknown rule',
            $log['risk_score'] ?? 0,
            $log['severity'] ?? 'low',
            $log['description'] ?? 'Correlation event',
            json_encode($log)
        ]);
        $count++;
    }
    return $count;
}

function updateDailyStats($pdo, $wazuh, $snort, $correlation) {
    $stmt = $pdo->prepare("INSERT INTO daily_stats (date, wazuh_logs, snort_logs, correlation_logs, total_logs)
        VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE
        wazuh_logs = wazuh_logs + VALUES(wazuh_logs),
        snort_logs = snort_logs + VALUES(snort_logs),
        correlation_logs = correlation_logs + VALUES(correlation_logs),
        total_logs = total_logs + VALUES(total_logs)");
    
    $total = $wazuh + $snort + $correlation;
    $stmt->execute([date('Y-m-d'), $wazuh, $snort, $correlation, $total]);
}

function updateAgentStatus($pdo) {
    $agents = [
        ['wazuh', '47.130.204.203', 'http://47.130.204.203:8000/alerts.json'],
        ['snort', '192.168.100.197', 'http://192.168.100.197:8001/snort-logs'],
        ['correlation', '192.168.100.197', 'http://192.168.100.197:8002/correlation-logs']
    ];
    
    $stmt = $pdo->prepare("INSERT INTO agents (agent_name, agent_ip, agent_type, status, last_seen)
        VALUES (?, ?, ?, ?, NOW()) ON DUPLICATE KEY UPDATE
        status = VALUES(status), last_seen = VALUES(last_seen)");
    
    foreach ($agents as [$type, $ip, $url]) {
        $status = @file_get_contents($url, false, stream_context_create(['http' => ['timeout' => 3]])) !== false ? 'online' : 'offline';
        $stmt->execute([$type, $ip, $type, $status]);
    }
}

function determineEventType($alert) {
    $description = strtolower($alert['rule']['description'] ?? '');
    if (strpos($description, 'snort') !== false) return 'Snort IDS';
    if (strpos($description, 'ssh') !== false) return 'SSH Activity';
    if (strpos($description, 'login') !== false) return 'Authentication';
    if (strpos($description, 'scan') !== false) return 'Port Scan';
    if (strpos($description, 'attack') !== false) return 'Attack';
    return 'Security Event';
}

function determineSeverity($level) {
    if ($level >= 12) return 'critical';
    if ($level >= 7) return 'high';
    if ($level >= 4) return 'medium';
    return 'low';
}
?>
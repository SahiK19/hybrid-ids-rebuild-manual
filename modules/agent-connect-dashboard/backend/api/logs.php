<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/config.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

$limit = min((int)($_GET['limit'] ?? 50), 1000);

try {
    $database = new Database();
    $pdo = $database->getConnection();
    
    // Fetch from database tables
    $wazuhLogs = fetchStoredWazuhLogs($pdo, $limit);
    $snortLogs = fetchStoredSnortLogs($pdo, $limit);
    $correlationLogs = fetchStoredCorrelationLogs($pdo, $limit);
    
    $response = [
        'wazuh_logs' => $wazuhLogs,
        'snort_logs' => $snortLogs,
        'correlation_logs' => $correlationLogs,
        'total_count' => count($wazuhLogs) + count($snortLogs) + count($correlationLogs),
        'timestamp' => date('c')
    ];
    
    echo json_encode($response);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Failed to fetch logs',
        'message' => $e->getMessage()
    ]);
}

function fetchStoredWazuhLogs($pdo, $limit) {
    $stmt = $pdo->prepare("SELECT * FROM wazuh_logs ORDER BY timestamp DESC LIMIT ?");
    $stmt->execute([$limit]);
    return $stmt->fetchAll();
}

function fetchStoredSnortLogs($pdo, $limit) {
    $stmt = $pdo->prepare("SELECT * FROM snort_logs ORDER BY timestamp DESC LIMIT ?");
    $stmt->execute([$limit]);
    return $stmt->fetchAll();
}

function fetchStoredCorrelationLogs($pdo, $limit) {
    $stmt = $pdo->prepare("SELECT * FROM correlation_logs ORDER BY timestamp DESC LIMIT ?");
    $stmt->execute([$limit]);
    return $stmt->fetchAll();
}

function determineEventType($alert) {
    $description = strtolower($alert['rule']['description'] ?? '');
    
    if (strpos($description, 'snort') !== false) return 'Snort IDS';
    if (strpos($description, 'correlation') !== false) return 'Correlation';
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
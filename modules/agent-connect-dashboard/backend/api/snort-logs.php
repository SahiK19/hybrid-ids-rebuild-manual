<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Max-Age: 3600');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../config/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

try {
    $db = new Database();
    $conn = $db->getConnection();
    
    $limit = min((int)($_GET['limit'] ?? 100), 1000);
    $offset = (int)($_GET['offset'] ?? 0);
    
    $sql = "SELECT id, timestamp, source_ip, dest_ip, source_port, dest_port, protocol, signature, severity, event_type, raw_data, created_at 
            FROM snort_logs 
            ORDER BY created_at DESC 
            LIMIT ? OFFSET ?";
    
    $stmt = $conn->prepare($sql);
    $stmt->execute([$limit, $offset]);
    $logs = $stmt->fetchAll();
    
    // Get total count
    $countStmt = $conn->prepare("SELECT COUNT(*) as total FROM snort_logs");
    $countStmt->execute();
    $total = $countStmt->fetch()['total'];
    
    echo json_encode([
        'logs' => $logs,
        'total' => $total,
        'limit' => $limit,
        'offset' => $offset,
        'debug' => [
            'sql' => $sql,
            'logs_count' => count($logs),
            'raw_logs' => $logs
        ]
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Failed to fetch Snort logs',
        'message' => APP_ENV === 'development' ? $e->getMessage() : 'Internal server error'
    ]);
}
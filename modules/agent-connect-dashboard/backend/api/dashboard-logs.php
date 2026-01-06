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
    
    // Get query parameters
    $source = $_GET['source'] ?? null;
    $limit = min((int)($_GET['limit'] ?? 100), 1000);
    $offset = (int)($_GET['offset'] ?? 0);
    
    // Build query based on source filter
    $whereClause = '';
    $params = [];
    
    if ($source) {
        if ($source === 'correlated') {
            $whereClause = 'WHERE correlated = 1';
        } else {
            $whereClause = 'WHERE source = ?';
            $params[] = $source;
        }
    }
    
    $sql = "SELECT id, timestamp, source, message, severity, raw_json, created_at, correlated, agent_id 
            FROM security_logs 
            $whereClause 
            ORDER BY created_at DESC 
            LIMIT ? OFFSET ?";
    
    $params[] = $limit;
    $params[] = $offset;
    
    $stmt = $conn->prepare($sql);
    $stmt->execute($params);
    $logs = $stmt->fetchAll();
    
    // Get total count
    $countSql = "SELECT COUNT(*) as total FROM security_logs $whereClause";
    $countStmt = $conn->prepare($countSql);
    $countStmt->execute(array_slice($params, 0, -2));
    $total = $countStmt->fetch()['total'];
    
    echo json_encode([
        'logs' => $logs,
        'total' => $total,
        'limit' => $limit,
        'offset' => $offset,
        'debug' => [
            'source_filter' => $source,
            'sql' => $sql,
            'params' => $params,
            'logs_count' => count($logs)
        ]
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Failed to fetch logs',
        'message' => APP_ENV === 'development' ? $e->getMessage() : 'Internal server error'
    ]);
}
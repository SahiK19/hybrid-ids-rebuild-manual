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
    
    // Get logs by hour for last 24 hours
    $hourlyStmt = $conn->prepare("
        SELECT 
            DATE_FORMAT(created_at, '%H:00') as hour,
            COUNT(*) as count,
            source
        FROM security_logs 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
        GROUP BY DATE_FORMAT(created_at, '%H:00'), source
        ORDER BY hour
    ");
    $hourlyStmt->execute();
    $hourlyData = $hourlyStmt->fetchAll();
    
    // Get severity distribution
    $severityStmt = $conn->prepare("
        SELECT severity, COUNT(*) as count 
        FROM security_logs 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
        GROUP BY severity
    ");
    $severityStmt->execute();
    $severityData = $severityStmt->fetchAll();
    
    // Get source distribution
    $sourceStmt = $conn->prepare("
        SELECT source, COUNT(*) as count 
        FROM security_logs 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
        GROUP BY source
    ");
    $sourceStmt->execute();
    $sourceData = $sourceStmt->fetchAll();
    
    // Get daily stats for last 7 days
    $dailyStmt = $conn->prepare("
        SELECT 
            DATE(created_at) as date,
            COUNT(*) as total_logs,
            SUM(CASE WHEN severity IN ('high', 'critical') THEN 1 ELSE 0 END) as threats,
            SUM(CASE WHEN correlated = 1 THEN 1 ELSE 0 END) as correlated_events
        FROM security_logs 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        GROUP BY DATE(created_at)
        ORDER BY date
    ");
    $dailyStmt->execute();
    $dailyData = $dailyStmt->fetchAll();
    
    // Get total counts
    $totalStmt = $conn->prepare("
        SELECT 
            COUNT(*) as total_logs,
            SUM(CASE WHEN severity IN ('high', 'critical') THEN 1 ELSE 0 END) as total_threats,
            SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) as critical_alerts,
            SUM(CASE WHEN correlated = 1 THEN 1 ELSE 0 END) as correlated_events
        FROM security_logs 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
    ");
    $totalStmt->execute();
    $totals = $totalStmt->fetch();
    
    echo json_encode([
        'hourly_data' => $hourlyData,
        'severity_distribution' => $severityData,
        'source_distribution' => $sourceData,
        'daily_trends' => $dailyData,
        'totals' => $totals,
        'timestamp' => date('Y-m-d H:i:s')
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Failed to fetch analytics',
        'message' => APP_ENV === 'development' ? $e->getMessage() : 'Internal server error'
    ]);
}
<?php
// Hybrid IDS Backend API v1.0
require_once __DIR__ . '/config/config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    $db = new Database();
    $conn = $db->getConnection();
    
    echo json_encode([
        'message' => 'Backend API running',
        'app' => APP_NAME,
        'database' => 'connected'
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Database connection failed',
        'message' => APP_ENV === 'development' ? $e->getMessage() : 'Internal server error'
    ]);
}

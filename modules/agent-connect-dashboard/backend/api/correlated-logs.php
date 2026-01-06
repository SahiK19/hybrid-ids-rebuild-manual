<?php
require_once '../config/cors.php';
require_once '../config/database.php';

header('Content-Type: application/json');

try {
    $database = new Database();
    $db = $database->getConnection();
    
    // Query to get correlated security logs
    $query = "SELECT id, timestamp, source, message, severity, raw_json, created_at 
              FROM security_logs 
              WHERE correlated = 1 
              ORDER BY created_at DESC 
              LIMIT 50";
    
    $stmt = $db->prepare($query);
    $stmt->execute();
    
    $logs = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $message = $row['message'];
        
        // If message is empty, try to extract from raw_json
        if (empty($message) && !empty($row['raw_json'])) {
            $rawData = json_decode($row['raw_json'], true);
            if ($rawData) {
                // Try different message fields from raw_json
                if (!empty($rawData['message'])) {
                    $message = $rawData['message'];
                } elseif (!empty($rawData['correlation_type'])) {
                    $message = $rawData['correlation_type'];
                } elseif (!empty($rawData['stage1']) && !empty($rawData['stage2'])) {
                    // For correlation events, create a descriptive message
                    $stage1 = $rawData['stage1']['wazuh_alert'] ?? 'Unknown event';
                    $stage2 = $rawData['stage2']['wazuh_alert'] ?? 'Unknown event';
                    $message = "Correlated events: {$stage1} → {$stage2}";
                }
            }
        }
        
        $logs[] = [
            'id' => $row['id'],
            'timestamp' => $row['timestamp'],
            'source' => $row['source'],
            'severity' => $row['severity'],
            'message' => $message ?: 'No description available',
            'created_at' => $row['created_at']
        ];
    }
    
    echo json_encode($logs);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to fetch correlated logs: ' . $e->getMessage()]);
}
?>
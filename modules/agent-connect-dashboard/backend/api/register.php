<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/config.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['username']) || !isset($data['email']) || !isset($data['password'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required fields']);
    exit();
}

$username = trim($data['username']);
$email = trim($data['email']);
$password = $data['password'];

if (strlen($username) < 3 || strlen($password) < 6) {
    http_response_code(400);
    echo json_encode(['error' => 'Username must be at least 3 characters and password at least 6 characters']);
    exit();
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid email format']);
    exit();
}

try {
    $db = new Database();
    $conn = $db->getConnection();
    
    $stmt = $conn->prepare("SELECT id FROM users WHERE username = ? OR email = ?");
    $stmt->execute([$username, $email]);
    
    if ($stmt->fetch()) {
        http_response_code(409);
        echo json_encode(['error' => 'Username or email already exists']);
        exit();
    }
    
    $hashedPassword = password_hash($password, PASSWORD_BCRYPT);
    $apiToken = bin2hex(random_bytes(32));
    
    $stmt = $conn->prepare("INSERT INTO users (username, email, password, api_token) VALUES (?, ?, ?, ?)");
    $stmt->execute([$username, $email, $hashedPassword, $apiToken]);
    
    echo json_encode([
        'message' => 'User registered successfully',
        'user' => [
            'id' => $conn->lastInsertId(),
            'username' => $username,
            'email' => $email
        ]
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Registration failed',
        'message' => APP_ENV === 'development' ? $e->getMessage() : 'Internal server error'
    ]);
}

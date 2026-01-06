<?php

class Database {
    private $conn;
    private $credentials;

    public function __construct() {
        $this->credentials = $this->getCredentialsFromSecretsManager();
    }

    private function getCredentialsFromSecretsManager() {
        $secretName = getenv('DB_SECRET_NAME') ?: 'hybrid-ids-db-credentials';
        $region = getenv('AWS_REGION') ?: 'us-east-1';

        $command = "aws secretsmanager get-secret-value --secret-id {$secretName} --region {$region} --query SecretString --output text";
        $output = shell_exec($command);

        if ($output) {
            return json_decode($output, true);
        }

        throw new Exception("Failed to retrieve database credentials from Secrets Manager");
    }

    public function getConnection() {
        if ($this->conn === null) {
            try {
                $dsn = "mysql:host={$this->credentials['host']};dbname={$this->credentials['dbname']};charset=utf8mb4";
                $this->conn = new PDO(
                    $dsn,
                    $this->credentials['username'],
                    $this->credentials['password'],
                    [
                        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                        PDO::ATTR_EMULATE_PREPARES => false
                    ]
                );
            } catch (PDOException $e) {
                throw new Exception("Database connection failed: " . $e->getMessage());
            }
        }

        return $this->conn;
    }

    public function closeConnection() {
        $this->conn = null;
    }
}

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    api_token VARCHAR(64) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_api_token (api_token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Wazuh logs table
CREATE TABLE IF NOT EXISTS wazuh_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    alert_id VARCHAR(100) UNIQUE,
    timestamp DATETIME NOT NULL,
    agent_name VARCHAR(100),
    agent_ip VARCHAR(45),
    rule_level INT,
    rule_description TEXT,
    source_ip VARCHAR(45),
    dest_ip VARCHAR(45),
    event_type VARCHAR(50),
    severity ENUM('low', 'medium', 'high', 'critical'),
    raw_data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_timestamp (timestamp),
    INDEX idx_severity (severity),
    INDEX idx_source_ip (source_ip)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Snort IDS logs table
CREATE TABLE IF NOT EXISTS snort_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    timestamp DATETIME NOT NULL,
    source_ip VARCHAR(45),
    dest_ip VARCHAR(45),
    source_port INT,
    dest_port INT,
    protocol VARCHAR(10),
    signature VARCHAR(255),
    severity ENUM('low', 'medium', 'high', 'critical'),
    event_type VARCHAR(50),
    raw_data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_timestamp (timestamp),
    INDEX idx_source_ip (source_ip),
    INDEX idx_severity (severity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Correlation engine logs table
CREATE TABLE IF NOT EXISTS correlation_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    correlation_id VARCHAR(100) UNIQUE,
    timestamp DATETIME NOT NULL,
    event_count INT DEFAULT 1,
    source_ips JSON,
    dest_ips JSON,
    correlation_rule VARCHAR(255),
    risk_score INT,
    severity ENUM('low', 'medium', 'high', 'critical'),
    description TEXT,
    raw_data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_timestamp (timestamp),
    INDEX idx_severity (severity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Agents status table
CREATE TABLE IF NOT EXISTS agents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    agent_name VARCHAR(100) UNIQUE NOT NULL,
    agent_ip VARCHAR(45),
    agent_type ENUM('wazuh', 'snort', 'correlation') NOT NULL,
    status ENUM('online', 'offline', 'error') DEFAULT 'offline',
    last_seen DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_agent_type (agent_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Daily statistics table
CREATE TABLE IF NOT EXISTS daily_stats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE UNIQUE NOT NULL,
    total_logs INT DEFAULT 0,
    wazuh_logs INT DEFAULT 0,
    snort_logs INT DEFAULT 0,
    correlation_logs INT DEFAULT 0,
    critical_alerts INT DEFAULT 0,
    high_alerts INT DEFAULT 0,
    medium_alerts INT DEFAULT 0,
    low_alerts INT DEFAULT 0,
    threats_blocked INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_date (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

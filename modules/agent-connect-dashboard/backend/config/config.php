<?php
// config.php fileeeee
define('APP_NAME', 'Hybrid IDS');
define('APP_ENV', getenv('APP_ENV') ?: 'production');
define('AWS_REGION', getenv('AWS_REGION') ?: 'us-east-1');
define('DB_SECRET_NAME', getenv('DB_SECRET_NAME'));

if (!DB_SECRET_NAME) {
    throw new Exception('DB_SECRET_NAME environment variable is required');
}

error_reporting(APP_ENV === 'development' ? E_ALL : 0);
ini_set('display_errors', APP_ENV === 'development' ? 1 : 0);

date_default_timezone_set('UTC');

require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/database.php';

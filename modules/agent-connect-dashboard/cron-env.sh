#!/bin/bash

# Environment variables for cron job
export AWS_REGION="ap-southeast-1"
export DB_SECRET_NAME="hybrid-ids-db-credentials"
export APP_ENV="production"

# Execute the PHP script
/usr/bin/php /home/sahi/agent-connect-dashboard/collect-logs.php

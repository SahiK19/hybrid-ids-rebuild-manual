#!/bin/bash

# Setup cron job for log collection
PROJECT_DIR="/home/sahi/agent-connect-dashboard"

# Set environment variables for AWS
export AWS_REGION="${AWS_REGION:-ap-southeast-1}"
export DB_SECRET_NAME="${DB_SECRET_NAME:-hybrid-ids-db-credentials}"

CRON_JOB="*/5 * * * * $PROJECT_DIR/cron-env.sh >> $PROJECT_DIR/logs/cron.log 2>&1"

# Create logs directory
mkdir -p $PROJECT_DIR/logs

# Make scripts executable
chmod +x $PROJECT_DIR/collect-logs.php
chmod +x $PROJECT_DIR/cron-env.sh

# Add cron job
(crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -

echo "Cron job setup complete!"
echo "Log collection will run every 5 minutes"
echo "Check logs at: $PROJECT_DIR/logs/cron.log"
echo ""
echo "To verify cron job:"
echo "crontab -l"
echo ""
echo "To remove cron job:"
echo "crontab -e"
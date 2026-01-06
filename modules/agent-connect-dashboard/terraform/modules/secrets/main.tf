resource "aws_secretsmanager_secret" "rds_credentials" {
  name                    = "${var.project_name}-rds-credentials"
  recovery_window_in_days = 7

  tags = {
    Name    = "${var.project_name}-rds-credentials"
    Project = var.project_name
  }
}

resource "aws_secretsmanager_secret_version" "rds_credentials" {
  secret_id = aws_secretsmanager_secret.rds_credentials.id
  secret_string = jsonencode({
    host     = var.db_host
    dbname   = var.db_name
    username = var.db_username
    password = var.db_password
  })
}

###############################################################################
# Module: secrets
# Creates two Secrets Manager secrets:
#   planify/staging/database-url  - built automatically from the RDS managed secret
#   planify/staging/jwt-secret    - auto-generated 64-char random string
###############################################################################

variable "rds_master_user_secret_arn" {
  description = "ARN of the RDS-managed master user secret."
  type        = string
}

variable "db_endpoint" {
  type = string
}

variable "db_port" {
  type = string
}

variable "db_name" {
  type    = string
  default = "planify"
}

# -- Read the RDS master user secret (username + password + host + port) -------
data "aws_secretsmanager_secret_version" "rds_master" {
  secret_id = var.rds_master_user_secret_arn
}

locals {
  rds_creds = jsondecode(data.aws_secretsmanager_secret_version.rds_master.secret_string)

  # The AWS-managed RDS secret JSON contains: username, password, host, port, dbname.
  # We use host and port from the secret directly so they always match and are
  # never malformed. The previous version passed db_port as a variable which
  # could carry type-conversion artifacts (e.g. "5432.0") causing Prisma P1013.
  db_host = lookup(local.rds_creds, "host", var.db_endpoint)
  db_port = tostring(lookup(local.rds_creds, "port", 5432))

  # RDS-managed passwords often include :, ?, ], etc. Must percent-encode userinfo or Prisma P1013.
  database_url = "postgresql://${urlencode(local.rds_creds.username)}:${urlencode(local.rds_creds.password)}@${local.db_host}:${local.db_port}/${var.db_name}?schema=public&sslmode=require"
}

# -- DATABASE_URL secret -------------------------------------------------------
resource "aws_secretsmanager_secret" "database_url" {
  name        = "planify/staging/database-url"
  description = "Full Prisma DATABASE_URL string (postgresql://...)"

  recovery_window_in_days = 0
}

resource "aws_secretsmanager_secret_version" "database_url" {
  secret_id     = aws_secretsmanager_secret.database_url.id
  secret_string = local.database_url
}

# -- JWT secret (auto-generated) ----------------------------------------------
resource "aws_secretsmanager_secret" "jwt" {
  name        = "planify/staging/jwt-secret"
  description = "JWT signing secret - auto-generated 64-char string"

  recovery_window_in_days = 0
}

resource "random_password" "jwt" {
  length  = 64
  special = false
}

resource "aws_secretsmanager_secret_version" "jwt" {
  secret_id     = aws_secretsmanager_secret.jwt.id
  secret_string = random_password.jwt.result
}

# -- Outputs ------------------------------------------------------------------
output "database_url_secret_arn" {
  value = aws_secretsmanager_secret.database_url.arn
}

output "jwt_secret_arn" {
  value = aws_secretsmanager_secret.jwt.arn
}

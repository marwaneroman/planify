###############################################################################
# Module: rds
# PostgreSQL RDS instance with:
#   - Dedicated subnet group
#   - Security group (TCP 5432 from ECS tasks only)
#   - AWS-managed master password in Secrets Manager
###############################################################################

variable "vpc_id"                   { type = string }
variable "database_subnet_ids"      { type = list(string) }
variable "ecs_tasks_security_group" { type = string }

variable "db_instance_identifier" {
  type    = string
  default = "planify-staging-postgres"
}
variable "db_name" {
  type    = string
  default = "planify"
}
variable "master_username" {
  type    = string
  default = "planify_admin"
}
variable "db_instance_class" {
  type    = string
  default = "db.t4g.micro"
}
variable "allocated_storage" {
  type    = number
  default = 20
}
variable "engine_version" {
  type    = string
  default = "16"
}
variable "publicly_accessible" {
  type    = bool
  default = false
}
variable "backup_retention_period" {
  type    = number
  default = 0
}

# ── DB Subnet Group ───────────────────────────────────────────────────────────
resource "aws_db_subnet_group" "this" {
  name        = "planify-staging"
  description = "Planify staging RDS subnets"
  subnet_ids  = var.database_subnet_ids

  tags = { Name = "planify-staging" }
}

# ── RDS Security Group ────────────────────────────────────────────────────────
resource "aws_security_group" "rds" {
  name        = "planify-staging-rds"
  description = "Staging Planify RDS - PostgreSQL from ECS tasks only"
  vpc_id      = var.vpc_id

  ingress {
    description     = "PostgreSQL from ECS Fargate tasks"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [var.ecs_tasks_security_group]
  }

  egress {
    description = "Allow all outbound (RDS engine and updates)"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "planify-staging-rds-db" }
}

# ── RDS Instance ──────────────────────────────────────────────────────────────
resource "aws_db_instance" "this" {
  identifier        = var.db_instance_identifier
  db_name           = var.db_name
  engine            = "postgres"
  engine_version    = var.engine_version
  instance_class    = var.db_instance_class
  allocated_storage = var.allocated_storage
  storage_type      = "gp3"
  storage_encrypted = true

  username                    = var.master_username
  manage_master_user_password = true   # AWS creates & rotates the password in Secrets Manager

  db_subnet_group_name   = aws_db_subnet_group.this.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = var.publicly_accessible

  backup_retention_period    = var.backup_retention_period
  maintenance_window         = "mon:04:00-mon:05:00"
  multi_az                   = false
  auto_minor_version_upgrade = true
  deletion_protection        = false

  # Mirrors CloudFormation DeletionPolicy/UpdateReplacePolicy: Snapshot
  skip_final_snapshot       = false
  final_snapshot_identifier = "${var.db_instance_identifier}-final-snapshot"

  tags = { Name = var.db_instance_identifier }
}

# ── Outputs ───────────────────────────────────────────────────────────────────
output "db_endpoint" {
  value = aws_db_instance.this.address
}

output "db_port" {
  value = aws_db_instance.this.port
}

output "master_user_secret_arn" {
  description = "ARN of the AWS-managed master user secret (username + password)."
  value       = aws_db_instance.this.master_user_secret[0].secret_arn
}

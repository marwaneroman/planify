###############################################################################
# Planify – Staging Infrastructure (Terraform)
# Mirrors: staging-rds-postgresql.yaml + staging-ecs-fargate.yaml
###############################################################################

# To store state in S3 (recommended for teams), add a backend block to versions.tf:
# backend "s3" {
#   bucket         = "your-tfstate-bucket"
#   key            = "planify/staging/terraform.tfstate"
#   region         = "us-east-1"
#   dynamodb_table = "terraform-locks"
#   encrypt        = true
# }

provider "aws" {
  region = var.aws_region
}

# ── ECR Repositories ─────────────────────────────────────────────────────────
module "ecr" {
  source = "./modules/ecr"

  create_repositories = var.create_ecr_repositories
}

# ── Networking (Security Groups) ─────────────────────────────────────────────
module "networking" {
  source = "./modules/networking"

  vpc_id = var.vpc_id
}

# ── RDS PostgreSQL ────────────────────────────────────────────────────────────
module "rds" {
  source = "./modules/rds"

  vpc_id                   = var.vpc_id
  database_subnet_ids      = var.database_subnet_ids
  ecs_tasks_security_group = module.networking.ecs_security_group_id

  db_instance_identifier  = var.db_instance_identifier
  db_name                 = var.db_name
  master_username         = var.master_username
  db_instance_class       = var.db_instance_class
  allocated_storage       = var.allocated_storage
  engine_version          = var.engine_version
  publicly_accessible     = var.db_publicly_accessible
  backup_retention_period = var.backup_retention_period
}

# ── Secrets Manager ───────────────────────────────────────────────────────────
module "secrets" {
  source = "./modules/secrets"

  rds_master_user_secret_arn = module.rds.master_user_secret_arn
  db_endpoint                = module.rds.db_endpoint
  db_port                    = module.rds.db_port
  db_name                    = var.db_name
}

# ── ECS Fargate (ALB + Cluster + Service) ────────────────────────────────────
module "ecs" {
  source = "./modules/ecs"

  vpc_id            = var.vpc_id
  public_subnet_ids = var.public_subnet_ids

  alb_security_group_id = module.networking.alb_security_group_id
  ecs_security_group_id = module.networking.ecs_security_group_id

  cluster_name = var.cluster_name
  service_name = var.service_name

  deploy_alarm_name    = var.deploy_alarm_name
  deploy_5xx_threshold = var.deploy_5xx_threshold

  production_alb_name          = var.production_alb_name
  production_target_group_name = var.production_target_group_name
  production_deploy_alarm_name = var.production_deploy_alarm_name

  database_url_secret_arn = module.secrets.database_url_secret_arn
  jwt_secret_arn          = module.secrets.jwt_secret_arn

  # Pass the RDS secret ARN so the task execution role can resolve
  # the dynamic DATABASE_URL at container start-up.
  rds_master_user_secret_arn = module.rds.master_user_secret_arn
}

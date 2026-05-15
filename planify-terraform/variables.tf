###############################################################################
# Root variables – edit terraform.tfvars (or pass via -var / env vars)
###############################################################################

# ── AWS ───────────────────────────────────────────────────────────────────────
variable "aws_region" {
  description = "AWS region to deploy into."
  type        = string
  default     = "us-east-1"
}

# ── Networking ────────────────────────────────────────────────────────────────
variable "vpc_id" {
  description = "VPC that contains your public + private subnets."
  type        = string
}

variable "public_subnet_ids" {
  description = "Two public subnets in different AZs (required for the internet-facing ALB)."
  type        = list(string)
}

variable "database_subnet_ids" {
  description = "Two private subnets in different AZs for the RDS subnet group."
  type        = list(string)
}

# ── ECR ───────────────────────────────────────────────────────────────────────
variable "create_ecr_repositories" {
  description = "Set to false if planify/backend and planify/frontend repos already exist."
  type        = bool
  default     = true
}

# ── ECS ───────────────────────────────────────────────────────────────────────
variable "cluster_name" {
  description = "ECS cluster name (matches GitHub secret ECS_CLUSTER_STAGING)."
  type        = string
  default     = "planify-staging"
}

variable "service_name" {
  description = "ECS service name (matches GitHub secret ECS_SERVICE_STAGING)."
  type        = string
  default     = "planify-staging-web"
}

# ── RDS ───────────────────────────────────────────────────────────────────────
variable "db_instance_identifier" {
  description = "Unique RDS instance name in this account/region."
  type        = string
  default     = "planify-staging-postgres"
}

variable "db_name" {
  description = "Initial database name (Prisma default)."
  type        = string
  default     = "planify"
}

variable "master_username" {
  description = "RDS master user name."
  type        = string
  default     = "planify_admin"
}

variable "db_instance_class" {
  description = "RDS instance class."
  type        = string
  default     = "db.t4g.micro"
}

variable "allocated_storage" {
  description = "Allocated storage in GB (minimum 20)."
  type        = number
  default     = 20
}

variable "engine_version" {
  description = "PostgreSQL major version."
  type        = string
  default     = "16"
}

variable "db_publicly_accessible" {
  description = "Whether the RDS instance is publicly accessible (false = private subnets)."
  type        = bool
  default     = false
}

variable "backup_retention_period" {
  description = "Automated backup retention in days (0 = disabled, free tier safe)."
  type        = number
  default     = 0
}

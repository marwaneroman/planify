###############################################################################
# terraform.tfvars  –  Fill these in before running `terraform apply`
# Copy this file or rename it; never commit real values to git.
###############################################################################

aws_region = "us-east-1"

# ── Networking ────────────────────────────────────────────────────────────────
# Find these in the AWS console → VPC → Your VPCs / Subnets
vpc_id = "vpc-0464b38e6f4f0effd"

# Two PUBLIC subnets (different AZs) for the ALB + ECS tasks
public_subnet_ids = [
  "subnet-0971cdf19779485d0", # AZ-a
  "subnet-036abd85eeaa38da9", # AZ-b
]

# Two PRIVATE subnets (different AZs) for RDS
# Can reuse public subnets for simplicity, but private is recommended.
database_subnet_ids = [
  "subnet-0971cdf19779485d0", # AZ-a
  "subnet-036abd85eeaa38da9", # AZ-b
]

# ── ECR ───────────────────────────────────────────────────────────────────────
# Set to false if planify/backend and planify/frontend repos already exist
create_ecr_repositories = false

# ── ECS ───────────────────────────────────────────────────────────────────────
cluster_name = "planify-staging"
service_name = "planify-staging-web"

# ── RDS ───────────────────────────────────────────────────────────────────────
db_instance_identifier  = "planify-staging-postgres"
db_name                 = "planify"
master_username         = "planify_admin"
db_instance_class       = "db.t4g.micro"
allocated_storage       = 20
engine_version          = "16"
db_publicly_accessible  = false
backup_retention_period = 0 # Increase after upgrading AWS plan
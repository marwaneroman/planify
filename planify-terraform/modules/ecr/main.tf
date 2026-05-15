###############################################################################
# Module: ecr
# Creates planify/backend and planify/frontend ECR repositories.
# Set create_repositories = false if they already exist (avoids conflict).
###############################################################################

variable "create_repositories" {
  type    = bool
  default = true
}

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

resource "aws_ecr_repository" "backend" {
  count = var.create_repositories ? 1 : 0

  name                 = "planify/backend"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_ecr_repository" "frontend" {
  count = var.create_repositories ? 1 : 0

  name                 = "planify/frontend"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }
}

# ── Outputs ───────────────────────────────────────────────────────────────────
output "backend_repository_uri" {
  value = var.create_repositories ? aws_ecr_repository.backend[0].repository_url : "${data.aws_caller_identity.current.account_id}.dkr.ecr.${data.aws_region.current.name}.amazonaws.com/planify/backend"
}

output "frontend_repository_uri" {
  value = var.create_repositories ? aws_ecr_repository.frontend[0].repository_url : "${data.aws_caller_identity.current.account_id}.dkr.ecr.${data.aws_region.current.name}.amazonaws.com/planify/frontend"
}

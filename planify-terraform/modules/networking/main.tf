###############################################################################
# Module: networking
# Security groups:
#   alb_security_group  – HTTP :80 from the internet
#   ecs_security_group  – port 3000 from ALB only
#
# The RDS security group lives in the rds module (depends on ecs_security_group_id).
###############################################################################

variable "vpc_id" {
  type = string
}

# ── ALB Security Group ────────────────────────────────────────────────────────
resource "aws_security_group" "alb" {
  name        = "planify-staging-alb"
  description = "Staging ALB - HTTP from the internet"
  vpc_id      = var.vpc_id

  ingress {
    description = "HTTP from everywhere"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "planify-staging-alb" }
}

# ── ECS Security Group ────────────────────────────────────────────────────────
resource "aws_security_group" "ecs" {
  name        = "planify-staging-ecs"
  description = "Staging ECS tasks - port 3000 from ALB only"
  vpc_id      = var.vpc_id

  ingress {
    description             = "Frontend port from ALB"
    from_port               = 3000
    to_port                 = 3000
    protocol                = "tcp"
    security_groups         = [aws_security_group.alb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "planify-staging-ecs" }
}

# ── Outputs ───────────────────────────────────────────────────────────────────
output "alb_security_group_id" {
  value = aws_security_group.alb.id
}

output "ecs_security_group_id" {
  value = aws_security_group.ecs.id
}

###############################################################################
# Module: ecs
# Creates:
#   - CloudWatch Log Groups (backend + frontend)
#   - IAM roles (task execution + task)
#   - Application Load Balancer (internet-facing, HTTP :80)
#   - Target Group + Listener
#   - ECS Cluster (Fargate)
#   - Task Definition (backend + frontend sidecar)
#   - ECS Service
###############################################################################

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# ── Variables ─────────────────────────────────────────────────────────────────
variable "vpc_id"            { type = string }
variable "public_subnet_ids" { type = list(string) }

variable "alb_security_group_id" { type = string }
variable "ecs_security_group_id" { type = string }

variable "cluster_name" {
  type    = string
  default = "planify-staging"
}

variable "service_name" {
  type    = string
  default = "planify-staging-web"
}

variable "database_url_secret_arn"    { type = string }
variable "jwt_secret_arn"             { type = string }
variable "rds_master_user_secret_arn" { type = string }

# ── CloudWatch Log Groups ─────────────────────────────────────────────────────
resource "aws_cloudwatch_log_group" "backend" {
  name              = "/ecs/planify/staging/backend"
  retention_in_days = 14
}

resource "aws_cloudwatch_log_group" "frontend" {
  name              = "/ecs/planify/staging/frontend"
  retention_in_days = 14
}

# ── IAM: Task Execution Role ──────────────────────────────────────────────────
resource "aws_iam_role" "task_execution" {
  name = "planify-staging-task-execution"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "task_execution_managed" {
  role       = aws_iam_role.task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role_policy" "read_secrets" {
  name = "ReadPlanifyStagingSecrets"
  role = aws_iam_role.task_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = concat(
      [{
        Effect = "Allow"
        Action = ["secretsmanager:GetSecretValue"]
        Resource = [
          "arn:aws:secretsmanager:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:secret:planify/staging/*",
        ]
      }],
      var.rds_master_user_secret_arn != "" ? [{
        Effect   = "Allow"
        Action   = ["secretsmanager:GetSecretValue"]
        Resource = [var.rds_master_user_secret_arn]
      }] : []
    )
  })
}

# ── IAM: Task Role ────────────────────────────────────────────────────────────
resource "aws_iam_role" "task" {
  name = "planify-staging-task"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

# ── Application Load Balancer ─────────────────────────────────────────────────
resource "aws_lb" "this" {
  name               = "planify-staging-alb"
  internal           = false
  load_balancer_type = "application"
  ip_address_type    = "ipv4"
  subnets            = var.public_subnet_ids
  security_groups    = [var.alb_security_group_id]

  tags = { Name = "planify-staging-alb" }
}

resource "aws_lb_target_group" "frontend" {
  name        = "planify-staging-frontend"
  target_type = "ip"
  protocol    = "HTTP"
  port        = 3000
  vpc_id      = var.vpc_id

  health_check {
    enabled             = true
    path                = "/health"
    protocol            = "HTTP"
    matcher             = "200-399"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 3
  }
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.this.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.frontend.arn
  }
}

# ── ECS Cluster ───────────────────────────────────────────────────────────────
resource "aws_ecs_cluster" "this" {
  name = var.cluster_name

  setting {
    name  = "containerInsights"
    value = "disabled"
  }
}

resource "aws_ecs_cluster_capacity_providers" "this" {
  cluster_name       = aws_ecs_cluster.this.name
  capacity_providers = ["FARGATE"]

  default_capacity_provider_strategy {
    capacity_provider = "FARGATE"
    weight            = 1
  }
}

# ── ECS Task Definition ───────────────────────────────────────────────────────
resource "aws_ecs_task_definition" "this" {
  family                   = "planify-staging"
  cpu                      = "1024"
  memory                   = "3072"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  execution_role_arn       = aws_iam_role.task_execution.arn
  task_role_arn            = aws_iam_role.task.arn

  container_definitions = jsonencode([
    {
      name      = "backend"
      essential = true
      image     = "${data.aws_caller_identity.current.account_id}.dkr.ecr.${data.aws_region.current.name}.amazonaws.com/planify/backend:latest"

      portMappings = [{ containerPort = 8000, protocol = "tcp" }]

      environment = [
        { name = "NODE_ENV",           value = "production" },
        { name = "PORT",               value = "8000" },
        { name = "SKIP_PRISMA_DB_PUSH", value = "0" },
        { name = "CORS_ORIGIN",        value = "http://${aws_lb.this.dns_name}" },
      ]

      secrets = [
        { name = "DATABASE_URL", valueFrom = var.database_url_secret_arn },
        { name = "JWT_SECRET",   valueFrom = var.jwt_secret_arn },
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.backend.name
          "awslogs-region"        = data.aws_region.current.name
          "awslogs-stream-prefix" = "backend"
        }
      }

      healthCheck = {
        command     = ["CMD-SHELL", "curl -fsS http://127.0.0.1:8000/health || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 90
      }
    },
    {
      name      = "frontend"
      essential = true
      image     = "${data.aws_caller_identity.current.account_id}.dkr.ecr.${data.aws_region.current.name}.amazonaws.com/planify/frontend:latest"

      portMappings = [{ containerPort = 3000, protocol = "tcp" }]

      environment = [
        { name = "BACKEND_HOST", value = "127.0.0.1" },
      ]

      dependsOn = [{ containerName = "backend", condition = "START" }]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.frontend.name
          "awslogs-region"        = data.aws_region.current.name
          "awslogs-stream-prefix" = "frontend"
        }
      }

      healthCheck = {
        command     = ["CMD-SHELL", "wget -qO- http://127.0.0.1:3000/health || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 30
      }
    }
  ])
}

# ── ECS Service ───────────────────────────────────────────────────────────────
resource "aws_ecs_service" "this" {
  name            = var.service_name
  cluster         = aws_ecs_cluster.this.id
  task_definition = aws_ecs_task_definition.this.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  # Wait for the load balancer to be ready before registering tasks
  depends_on = [aws_lb_listener.http]

  deployment_maximum_percent         = 200
  deployment_minimum_healthy_percent = 50
  health_check_grace_period_seconds  = 120

  load_balancer {
    target_group_arn = aws_lb_target_group.frontend.arn
    container_name   = "frontend"
    container_port   = 3000
  }

  network_configuration {
    subnets          = var.public_subnet_ids
    security_groups  = [var.ecs_security_group_id]
    assign_public_ip = true
  }

  # Ignore task definition changes so CI/CD image pushes don't cause drift
  lifecycle {
    ignore_changes = [task_definition]
  }
}

# ── Outputs ───────────────────────────────────────────────────────────────────
output "load_balancer_dns" {
  value = aws_lb.this.dns_name
}

output "cluster_name" {
  value = aws_ecs_cluster.this.name
}

output "service_name" {
  value = aws_ecs_service.this.name
}

###############################################################################
# Root Outputs
###############################################################################

output "load_balancer_dns" {
  description = "Point your browser / smoke tests here (HTTP)."
  value       = module.ecs.load_balancer_dns
}

output "ecr_backend_repository_uri" {
  description = "Push planify/backend images here."
  value       = module.ecr.backend_repository_uri
}

output "ecr_frontend_repository_uri" {
  description = "Push planify/frontend images here."
  value       = module.ecr.frontend_repository_uri
}

output "ecs_cluster_name" {
  description = "Set as GitHub secret ECS_CLUSTER_STAGING."
  value       = module.ecs.cluster_name
}

output "ecs_service_name" {
  description = "Set as GitHub secret ECS_SERVICE_STAGING."
  value       = module.ecs.service_name
}

output "database_url_secret_arn" {
  description = "Secrets Manager ARN for DATABASE_URL (auto-populated from RDS)."
  value       = module.secrets.database_url_secret_arn
}

output "jwt_secret_arn" {
  description = "Secrets Manager ARN for JWT_SECRET."
  value       = module.secrets.jwt_secret_arn
}

output "rds_endpoint" {
  description = "RDS hostname."
  value       = module.rds.db_endpoint
}

output "rds_master_user_secret_arn" {
  description = "RDS managed master user secret (username + password)."
  value       = module.rds.master_user_secret_arn
}

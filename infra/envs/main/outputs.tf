output "candle_load_ecr_repository_url" {
  description = "ECR repository URL for candle historical load"
  value       = module.candle_load.ecr_repository_url
}

output "news_load_ecr_repository_url" {
  description = "ECR repository URL for news historical load"
  value       = module.news_load.ecr_repository_url
}

output "ecs_cluster_name" {
  description = "ECS cluster name for service updates"
  value       = module.ecs_cluster.cluster_name
}

output "candle_load_service_name" {
  description = "ECS service name for candle load"
  value       = module.candle_load.service_name
}

output "news_load_service_name" {
  description = "ECS service name for news load"
  value       = module.news_load.service_name
}

output "api_gateway_endpoint" {
  description = "API Gateway endpoint URL"
  value       = module.api.api_gateway_endpoint
}

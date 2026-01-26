output "cluster_id" {
  description = "ECS cluster ID"
  value       = aws_ecs_cluster.candle_load_cluster.id
}

output "cluster_name" {
  description = "ECS cluster name"
  value       = aws_ecs_cluster.candle_load_cluster.name
}

output "task_definition_arn" {
  description = "ARN of the ECS task definition"
  value       = aws_ecs_task_definition.candle_load_task.arn
}

output "task_definition_family" {
  description = "Family of the ECS task definition"
  value       = aws_ecs_task_definition.candle_load_task.family
}

output "security_group_id" {
  description = "Security group ID for ECS tasks"
  value       = aws_security_group.candle_load_sg.id
}

output "ecr_repository_url" {
  description = "ECR repository URL"
  value       = aws_ecr_repository.candle_load_repo.repository_url
}

output "ecr_repository_arn" {
  description = "ECR repository ARN"
  value       = aws_ecr_repository.candle_load_repo.arn
}

output "service_name" {
  description = "ECS service name"
  value       = aws_ecs_service.candle_load_service.name
}

output "service_id" {
  description = "ECS service ID"
  value       = aws_ecs_service.candle_load_service.id
}

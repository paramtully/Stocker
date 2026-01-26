output "cluster_id" {
  description = "ECS cluster ID"
  value       = aws_ecs_cluster.batch_load_cluster.id
}

output "cluster_name" {
  description = "ECS cluster name"
  value       = aws_ecs_cluster.batch_load_cluster.name
}

output "cluster_arn" {
  description = "ECS cluster ARN"
  value       = aws_ecs_cluster.batch_load_cluster.arn
}


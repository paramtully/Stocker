output "database_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.database.endpoint
  // For cluster: aws_rds_cluster.database.endpoint
}

output "database_port" {
  description = "RDS instance port"
  value       = aws_db_instance.database.port
  // For cluster: aws_rds_cluster.database.port
}

output "database_name" {
  description = "Database name"
  value       = aws_db_instance.database.db_name
  // For cluster: aws_rds_cluster.database.database_name
}

output "database_url" {
  description = "Full database connection URL (for Lambda environment variable)"
  value       = "postgresql://${var.master_username}:${var.master_password}@${aws_db_instance.database.endpoint}:${aws_db_instance.database.port}/${var.database_name}"
  sensitive   = true
  // For cluster: use aws_rds_cluster.database.endpoint
}
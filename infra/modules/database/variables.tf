variable "name_prefix" {
  type        = string
  description = "Shared naming prefix"
}

variable "tags" {
  type        = map(string)
  description = "Base tags for all resources"
}

variable "vpc_id" {
  type        = string
  description = "VPC ID for RDS"
}

variable "subnet_ids" {
  type        = list(string)
  description = "List of subnet IDs for RDS subnet group"
}

variable "database_name" {
  type        = string
  description = "Name of the database"
  default     = "stocker"
}

variable "master_username" {
  type        = string
  description = "Master username for RDS"
  default     = "postgres"
}

variable "master_password" {
  type        = string
  description = "Master password for RDS (consider using AWS Secrets Manager)"
  sensitive   = true
}

variable "engine_version" {
  type        = string
  description = "PostgreSQL engine version"
  default     = "16.1"
}

variable "instance_class" {
  type        = string
  description = "RDS instance class"
  default     = "db.t3.micro"  // Start small, can scale up
}

variable "lambda_security_group_id" {
  type        = string
  description = "Security group ID of Lambda function (for RDS ingress rule)"
}
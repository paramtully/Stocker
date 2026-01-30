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
  description = "VPC ID for Lambda function"
}

variable "subnet_ids" {
  type        = list(string)
  description = "List of private subnet IDs for Lambda function"
}

variable "database_url" {
  type        = string
  description = "Database connection URL"
  sensitive   = true
}

variable "cognito_user_pool_id" {
  type        = string
  description = "Cognito User Pool ID"
}

variable "cognito_user_pool_arn" {
  type        = string
  description = "Cognito User Pool ARN"
}

variable "aws_region" {
  type        = string
  description = "AWS region"
}

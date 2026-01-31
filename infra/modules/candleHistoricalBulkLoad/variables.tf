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

variable "s3_bucket_name" {
  type        = string
  description = "S3 bucket name for reading candle data"
}

variable "aws_region" {
  type        = string
  description = "AWS region"
}

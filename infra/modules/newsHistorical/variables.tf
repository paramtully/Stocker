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
  description = "VPC ID for ECS tasks"
}

variable "subnet_ids" {
  type        = list(string)
  description = "List of public subnet IDs for ECS tasks"
}

variable "s3_bucket_name" {
  type        = string
  description = "S3 bucket name for storing news data"
}

variable "aws_region" {
  type        = string
  description = "AWS region"
}

variable "ecr_repository_url" {
  type        = string
  description = "ECR repository URL for the Docker image"
  default     = "" # Optional - can use public image or external registry
}

variable "run_on_deploy" {
  type        = bool
  description = "Whether to run the ECS task on deploy (set to true to run once, false to keep at 0)"
  default     = true
}

variable "cluster_id" {
  type        = string
  description = "ECS cluster ID to use for the service"
}

variable "cluster_name" {
  type        = string
  description = "ECS cluster name to use for the service"
}

variable "cluster_arn" {
  type        = string
  description = "ECS cluster ARN to use for EventBridge rules"
}


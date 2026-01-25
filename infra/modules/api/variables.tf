variable "name_prefix" {
  type        = string
  description = "Shared naming prefix"
}

variable "tags" {
  type        = map(string)
  description = "Base tags for all resources"
}

variable "domain_name" {
  type        = string
  description = "Domain name for JWT issuer"
}

variable "cognito_app_client_id" {
  type        = string
  description = "Cognito app client ID for JWT audience"
}

variable "vpc_id" {
  type        = string
  description = "VPC ID for Lambda"
}

variable "subnet_ids" {
  type        = list(string)
  description = "List of subnet IDs for Lambda VPC configuration"
}

variable "database_url" {
  type        = string
  description = "Database URL for Lambda environment variable"
}

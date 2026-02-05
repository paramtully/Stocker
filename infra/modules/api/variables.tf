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

variable "cognito_user_pool_id" {
  type        = string
  description = "Cognito User Pool ID for Lambda environment variable"
}

variable "rate_limit_unauthenticated" {
  type        = number
  description = "Rate limit for unauthenticated requests (requests per 5 minutes per IP)"
  default     = 100
}

variable "rate_limit_authenticated" {
  type        = number
  description = "Rate limit for authenticated requests (requests per 5 minutes per IP)"
  default     = 1000
}

variable "throttle_burst_limit" {
  type        = number
  description = "API Gateway stage throttling burst limit"
  default     = 100
}

variable "throttle_rate_limit" {
  type        = number
  description = "API Gateway stage throttling rate limit (requests per second)"
  default     = 50
}

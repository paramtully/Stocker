variable "region" {
    type        = string
    description = "AWS region"
    default     = "us-west-2"
}

variable "vpc_cidr" {
    type        = string
    description = "CIDR block for the VPC"
    default     = "10.0.0.0/20"
}

variable "domain_name" {
    type        = string
    description = "Domain name for JWT issuer (e.g., cognito-idp.us-east-1.amazonaws.com/USER_POOL_ID)"
}

variable "cognito_app_client_id" {
    type        = string
    description = "Cognito app client ID for JWT audience"
}

variable "master_password" {
    type        = string
    description = "Master password for RDS database"
    sensitive   = true
}


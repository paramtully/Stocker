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

variable "master_password" {
    type        = string
    description = "Master password for RDS database"
    sensitive   = true
}


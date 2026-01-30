variable "name_prefix" {
  type        = string
  description = "Shared naming prefix"
}

variable "tags" {
  type        = map(string)
  description = "Base tags for all resources"
}

variable "s3_bucket_name" {
  type        = string
  description = "S3 bucket name for reading/writing news data"
}

variable "s3_bucket_id" {
  type        = string
  description = "S3 bucket ID for event notification configuration"
}

variable "aws_region" {
  type        = string
  description = "AWS region"
}

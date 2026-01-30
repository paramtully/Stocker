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
  description = "S3 bucket name for reading listings and writing splits"
}

variable "aws_region" {
  type        = string
  description = "AWS region"
}

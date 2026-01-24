variable "name_prefix" {
  type        = string
  description = "Shared naming prefix"
}

variable "tags" {
  type        = map(string)
  description = "Base tags for all resources"
}

variable "cidr" {
  type        = string
  description = "CIDR block for the VPC"
}

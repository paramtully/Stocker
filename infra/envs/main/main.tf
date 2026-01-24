module "vpc" {
  source = "../../modules/vpc"
  cidr   = var.vpc_cidr

  name_prefix = local.name_prefix
  tags        = local.required_tags
}

module "api" {
  source = "../../modules/api"

  name_prefix = local.name_prefix
  tags        = local.required_tags

  // VPC configuration
  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnet_ids

  // Auth configuration
  domain_name           = var.domain_name
  cognito_app_client_id = var.cognito_app_client_id
}

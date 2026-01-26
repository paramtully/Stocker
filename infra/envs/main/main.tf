module "vpc" {
  source = "../../modules/vpc"
  cidr   = var.vpc_cidr

  name_prefix = local.name_prefix
  tags        = local.required_tags
}

module "cognito" {
  source = "../../modules/cognito"

  name_prefix = local.name_prefix
  tags        = local.required_tags
  region = var.region
}

module "api" {
  source = "../../modules/api"

  name_prefix = local.name_prefix
  tags        = local.required_tags

  // VPC configuration
  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnet_ids

  // Auth configuration
  domain_name           = module.cognito.domain_name
  cognito_app_client_id = module.cognito.app_client_id
  cognito_user_pool_id = module.cognito.user_pool_id

  // Database configuration
  database_url = module.database.database_url

}

module "database" {
  source = "../../modules/database"

  name_prefix = local.name_prefix
  tags        = local.required_tags

  // VPC configuration
  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnet_ids

  lambda_security_group_id = module.api.lambda_security_group_id // Need to add this output to API module

  // Database credentials
  master_password = var.master_password
}

module "s3" {
  source = "../../modules/s3"

  name_prefix = local.name_prefix
  tags        = local.required_tags
}

module "candle_load" {
  source = "../../modules/candleLoad"

  name_prefix = local.name_prefix
  tags        = local.required_tags

  // VPC configuration - using PUBLIC subnets
  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.public_subnet_ids

  // S3 configuration
  s3_bucket_name = module.s3.bucket_name

  // Region
  aws_region = var.region
}
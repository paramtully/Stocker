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
  region      = var.region
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
  cognito_user_pool_id  = module.cognito.user_pool_id

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

  lambda_security_group_ids = [
    module.api.lambda_security_group_id,
    module.candle_split_detector_apply.lambda_security_group_id,
    module.candle_s3_to_rds.lambda_security_group_id,
    module.news_s3_to_rds.lambda_security_group_id,
    module.guest_user_cleanup.lambda_security_group_id
  ]

  // Database credentials
  master_password = var.master_password
}

module "s3" {
  source = "../../modules/s3"

  name_prefix = local.name_prefix
  tags        = local.required_tags
}

module "ecs_cluster" {
  source = "../../modules/ecs_cluster"

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

  // Shared ECS cluster
  cluster_id   = module.ecs_cluster.cluster_id
  cluster_name = module.ecs_cluster.cluster_name
  cluster_arn  = module.ecs_cluster.cluster_arn
}

module "news_load" {
  source = "../../modules/newsLoad"

  name_prefix = local.name_prefix
  tags        = local.required_tags

  // VPC configuration - using PUBLIC subnets
  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.public_subnet_ids

  // S3 configuration
  s3_bucket_name = module.s3.bucket_name

  // Region
  aws_region = var.region

  // Shared ECS cluster
  cluster_id   = module.ecs_cluster.cluster_id
  cluster_name = module.ecs_cluster.cluster_name
  cluster_arn  = module.ecs_cluster.cluster_arn
}

module "candle_new_listing_ingestion" {
  source = "../../modules/candleNewListingIngestion"

  name_prefix = local.name_prefix
  tags        = local.required_tags

  // S3 configuration
  s3_bucket_name = module.s3.bucket_name

  // Region
  aws_region = var.region
}

module "candle_new_listing_s3_to_rds" {
  source = "../../modules/candleNewListingS3ToRds"

  name_prefix = local.name_prefix
  tags        = local.required_tags

  // VPC configuration - using PRIVATE subnets
  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnet_ids

  // Database configuration
  database_url = module.database.database_url

  // S3 configuration
  s3_bucket_name = module.s3.bucket_name
  s3_bucket_id   = module.s3.bucket_id

  // Region
  aws_region = var.region
}

module "candle_split_detector_fetch" {
  source = "../../modules/candleSplitDetectorFetch"

  name_prefix = local.name_prefix
  tags        = local.required_tags

  // S3 configuration
  s3_bucket_name = module.s3.bucket_name

  // Region
  aws_region = var.region
}

module "candle_split_detector_apply" {
  source = "../../modules/candleSplitDetectorApply"

  name_prefix = local.name_prefix
  tags        = local.required_tags

  // VPC configuration - using PRIVATE subnets
  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnet_ids

  // Database configuration
  database_url = module.database.database_url

  // S3 configuration
  s3_bucket_name = module.s3.bucket_name
  s3_bucket_id   = module.s3.bucket_id

  // Region
  aws_region = var.region
}


module "candle_s3_to_rds" {
  source = "../../modules/candleS3ToRds"

  name_prefix = local.name_prefix
  tags        = local.required_tags

  // VPC configuration - using PRIVATE subnets
  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnet_ids

  // Database configuration
  database_url = module.database.database_url

  // S3 configuration
  s3_bucket_name = module.s3.bucket_name
  s3_bucket_id   = module.s3.bucket_id

  // Region
  aws_region = var.region
}

module "news_s3_to_rds" {
  source = "../../modules/newsS3ToRds"

  name_prefix = local.name_prefix
  tags        = local.required_tags

  // VPC configuration - using PRIVATE subnets
  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnet_ids

  // Database configuration
  database_url = module.database.database_url

  // S3 configuration
  s3_bucket_name = module.s3.bucket_name
  s3_bucket_id   = module.s3.bucket_id

  // Region
  aws_region = var.region
}

module "candle_historical_bulk_load" {
  source = "../../modules/candleHistoricalBulkLoad"

  name_prefix = local.name_prefix
  tags        = local.required_tags

  // VPC configuration - using PRIVATE subnets for RDS access
  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnet_ids

  // Database configuration
  database_url = module.database.database_url

  // S3 configuration
  s3_bucket_name = module.s3.bucket_name

  // Region
  aws_region = var.region
}

module "news_historical_bulk_load" {
  source = "../../modules/newsHistoricalBulkLoad"

  name_prefix = local.name_prefix
  tags        = local.required_tags

  // VPC configuration - using PRIVATE subnets for RDS access
  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnet_ids

  // Database configuration
  database_url = module.database.database_url

  // S3 configuration
  s3_bucket_name = module.s3.bucket_name

  // Region
  aws_region = var.region
}

module "news_summarization" {
  source = "../../modules/newsSummarization"

  name_prefix = local.name_prefix
  tags        = local.required_tags

  // S3 configuration
  s3_bucket_name = module.s3.bucket_name
  s3_bucket_id   = module.s3.bucket_id

  // Region
  aws_region = var.region
}

module "guest_user_cleanup" {
  source = "../../modules/guestUserCleanup"

  name_prefix = local.name_prefix
  tags        = local.required_tags

  // VPC configuration - using PRIVATE subnets
  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnet_ids

  // Database configuration
  database_url = module.database.database_url

  // Cognito configuration
  cognito_user_pool_id  = module.cognito.user_pool_id
  cognito_user_pool_arn = module.cognito.user_pool_arn

  // Region
  aws_region = var.region
}


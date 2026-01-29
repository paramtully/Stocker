// IAM role for Lambda
resource "aws_iam_role" "lambda_role" {
  name = "${var.name_prefix}-new-listing-ingestion-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-new-listing-ingestion-role"
  })
}

// Attach basic Lambda execution policy
resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

// IAM Policy for S3 write access
resource "aws_iam_role_policy" "lambda_s3_policy" {
  name = "${var.name_prefix}-new-listing-ingestion-s3-policy"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:PutObjectAcl"
        ]
        Resource = [
          "arn:aws:s3:::${var.s3_bucket_name}/listings/*"
        ]
      }
    ]
  })
}

// CloudWatch Log Group
resource "aws_cloudwatch_log_group" "lambda_logs" {
  name              = "/aws/lambda/${var.name_prefix}-new-listing-ingestion"
  retention_in_days = 7

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-new-listing-ingestion-logs"
  })
}

// Lambda function
resource "aws_lambda_function" "ingestion_lambda" {
  function_name    = "${var.name_prefix}-new-listing-ingestion"
  role             = aws_iam_role.lambda_role.arn
  handler          = "dist/index.handler"
  runtime          = "nodejs20.x"
  filename         = "../../packages/candleNewListingIngestion/dist/lambda.zip"
  source_code_hash = filebase64sha256("../../packages/candleNewListingIngestion/dist/lambda.zip")
  timeout          = 300 // 5 minutes

  // No VPC configuration - runs in default VPC or no VPC for internet access

  environment {
    variables = {
      AWS_REGION = data.aws_region.current.name
      S3_BUCKET  = var.s3_bucket_name
    }
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-new-listing-ingestion"
  })

  depends_on = [aws_cloudwatch_log_group.lambda_logs]
}

// Add data source for current region
data "aws_region" "current" {}


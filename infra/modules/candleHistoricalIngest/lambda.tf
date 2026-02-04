// IAM role for Lambda
resource "aws_iam_role" "lambda_role" {
  name = "${var.name_prefix}-candle-historical-ingest-role"

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
    Name = "${var.name_prefix}-candle-historical-ingest-role"
  })
}

// Attach basic Lambda execution policy
resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

// Attach VPC access policy for Lambda
resource "aws_iam_role_policy_attachment" "lambda_vpc_execution" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

// Security group for Lambda
resource "aws_security_group" "lambda_sg" {
  name        = "${var.name_prefix}-candle-historical-ingest-sg"
  description = "Security group for candle historical ingest Lambda function in VPC"
  vpc_id      = var.vpc_id

  // Allow outbound traffic (for RDS, S3, etc.)
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-candle-historical-ingest-sg"
  })
}

// IAM Policy for S3 read access and checkpoint management
resource "aws_iam_role_policy" "lambda_s3_policy" {
  name = "${var.name_prefix}-candle-historical-ingest-s3-policy"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = [
          "arn:aws:s3:::${var.s3_bucket_name}",
          "arn:aws:s3:::${var.s3_bucket_name}/candles/*",
          "arn:aws:s3:::${var.s3_bucket_name}/candles/year/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = [
          "arn:aws:s3:::${var.s3_bucket_name}/checkpoints/*"
        ]
      }
    ]
  })
}

// IAM Policy for Lambda invoke (recursive invocation)
resource "aws_iam_role_policy" "lambda_invoke_policy" {
  name = "${var.name_prefix}-candle-historical-ingest-invoke-policy"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "lambda:InvokeFunction"
        ]
        Resource = aws_lambda_function.bulk_load_lambda.arn
      }
    ]
  })
}

// CloudWatch Log Group
resource "aws_cloudwatch_log_group" "lambda_logs" {
  name              = "/aws/lambda/${var.name_prefix}-candle-historical-ingest"
  retention_in_days = 7

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-candle-historical-ingest-logs"
  })
}

// Lambda function
resource "aws_lambda_function" "bulk_load_lambda" {
  function_name    = "${var.name_prefix}-candle-historical-ingest"
  role             = aws_iam_role.lambda_role.arn
  handler          = "dist/index.handler"
  runtime          = "nodejs20.x"
  filename         = "../../packages/candleHistoricalIngest/dist/lambda.zip"
  source_code_hash = filebase64sha256("../../packages/candleHistoricalIngest/dist/lambda.zip")
  timeout          = 900  // 15 minutes - maximum
  memory_size      = 3008 // Maximum memory for better performance with large parquet files

  // VPC configuration for database access
  vpc_config {
    subnet_ids         = var.subnet_ids
    security_group_ids = [aws_security_group.lambda_sg.id]
  }

  environment {
    variables = {
      DATABASE_URL         = var.database_url
      AWS_REGION           = data.aws_region.current.name
      S3_BUCKET            = var.s3_bucket_name
      LAMBDA_FUNCTION_NAME = aws_lambda_function.bulk_load_lambda.function_name
    }
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-candle-historical-ingest"
  })

  depends_on = [
    aws_cloudwatch_log_group.lambda_logs,
    aws_iam_role_policy_attachment.lambda_vpc_execution
  ]
}

// Add data source for current region
data "aws_region" "current" {}

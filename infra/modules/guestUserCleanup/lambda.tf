// IAM role for Lambda
resource "aws_iam_role" "lambda_role" {
  name = "${var.name_prefix}-guest-user-cleanup-role"

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
    Name = "${var.name_prefix}-guest-user-cleanup-role"
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
  name        = "${var.name_prefix}-guest-user-cleanup-sg"
  description = "Security group for guest user cleanup Lambda function in VPC"
  vpc_id      = var.vpc_id

  // Allow outbound traffic (for RDS, Cognito, etc.)
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-guest-user-cleanup-sg"
  })
}

// IAM Policy for Cognito access
resource "aws_iam_role_policy" "lambda_cognito_policy" {
  name = "${var.name_prefix}-guest-user-cleanup-cognito-policy"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "cognito-idp:AdminDeleteUser"
        ]
        Resource = var.cognito_user_pool_arn
      }
    ]
  })
}

// CloudWatch Log Group
resource "aws_cloudwatch_log_group" "lambda_logs" {
  name              = "/aws/lambda/${var.name_prefix}-guest-user-cleanup"
  retention_in_days = 7

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-guest-user-cleanup-logs"
  })
}

// Lambda function
resource "aws_lambda_function" "cleanup_lambda" {
  function_name    = "${var.name_prefix}-guest-user-cleanup"
  role             = aws_iam_role.lambda_role.arn
  handler          = "dist/index.handler"
  runtime          = "nodejs20.x"
  filename         = "../../packages/guestUserCleanup/dist/lambda.zip"
  source_code_hash = filebase64sha256("../../packages/guestUserCleanup/dist/lambda.zip")
  timeout          = 300 // 5 minutes

  // VPC configuration for database access
  vpc_config {
    subnet_ids         = var.subnet_ids
    security_group_ids = [aws_security_group.lambda_sg.id]
  }

  environment {
    variables = {
      DATABASE_URL       = var.database_url
      COGNITO_USER_POOL_ID = var.cognito_user_pool_id
      AWS_REGION         = data.aws_region.current.name
    }
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-guest-user-cleanup"
  })

  depends_on = [
    aws_cloudwatch_log_group.lambda_logs,
    aws_iam_role_policy_attachment.lambda_vpc_execution
  ]
}

// Add data source for current region
data "aws_region" "current" {}

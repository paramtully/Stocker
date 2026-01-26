// ECS Task Definition
resource "aws_ecs_task_definition" "news_load_task" {
  family                   = "${var.name_prefix}-news-load-task"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 512
  memory                   = 1024

  execution_role_arn = aws_iam_role.news_load_execution_role.arn
  task_role_arn      = aws_iam_role.news_load_task_role.arn

  container_definitions = jsonencode([
    {
      name  = "news-load"
      image = var.ecr_repository_url != "" ? "${var.ecr_repository_url}:latest" : "stocker/news-historical-load:latest"

      essential = true

      environment = [
        {
          name  = "AWS_REGION"
          value = var.aws_region
        },
        {
          name  = "S3_BUCKET"
          value = var.s3_bucket_name
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.news_load_logs.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }
    }
  ])

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-news-load-task"
  })
}

// ECR Repository for Docker image
resource "aws_ecr_repository" "news_load_repo" {
  name                 = "${var.name_prefix}/news-historical-load"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}/news-historical-load"
  })
}

// Security Group for ECS tasks (minimal - just outbound for S3 and internet)
resource "aws_security_group" "news_load_sg" {
  name        = "${var.name_prefix}-news-load-sg"
  description = "Security group for news historical load ECS tasks"
  vpc_id      = var.vpc_id

  // Allow outbound traffic (for S3, internet API calls)
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-news-load-sg"
  })
}

// IAM Role for ECS Task Execution (pulls images, writes logs)
resource "aws_iam_role" "news_load_execution_role" {
  name = "${var.name_prefix}-news-load-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ecs-tasks.amazonaws.com"
      }
    }]
  })

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-news-load-execution-role"
  })
}

// Attach ECS task execution role policy
resource "aws_iam_role_policy_attachment" "news_load_execution_policy" {
  role       = aws_iam_role.news_load_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

// IAM Role for ECS Task (application permissions - S3 access)
resource "aws_iam_role" "news_load_task_role" {
  name = "${var.name_prefix}-news-load-task-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ecs-tasks.amazonaws.com"
      }
    }]
  })

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-news-load-task-role"
  })
}

// IAM Policy for S3 access
resource "aws_iam_role_policy" "news_load_s3_policy" {
  name = "${var.name_prefix}-news-load-s3-policy"
  role = aws_iam_role.news_load_task_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          "arn:aws:s3:::${var.s3_bucket_name}",
          "arn:aws:s3:::${var.s3_bucket_name}/*"
        ]
      }
    ]
  })
}

// CloudWatch Log Group
resource "aws_cloudwatch_log_group" "news_load_logs" {
  name              = "/ecs/${var.name_prefix}-news-load"
  retention_in_days = 7

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-news-load-logs"
  })
}

// ECS Service - runs once on deploy, scales to 0 when task completes
resource "aws_ecs_service" "news_load_service" {
  name            = "${var.name_prefix}-news-load-service"
  cluster         = var.cluster_id
  task_definition = aws_ecs_task_definition.news_load_task.arn
  desired_count   = var.run_on_deploy ? 1 : 0
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = var.subnet_ids
    security_groups  = [aws_security_group.news_load_sg.id]
    assign_public_ip = true
  }

  // Ignore changes to desired_count after initial creation (so it stays at 0 after scaling down)
  lifecycle {
    ignore_changes = [desired_count]
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-news-load-service"
  })
}

// Lambda function to scale service to 0 when task completes
resource "aws_lambda_function" "scale_down_service" {
  filename      = data.archive_file.scale_down_lambda.output_path
  function_name = "${var.name_prefix}-news-load-scale-down"
  role          = aws_iam_role.scale_down_lambda_role.arn
  handler       = "index.handler"
  runtime       = "python3.11"
  timeout       = 30

  source_code_hash = data.archive_file.scale_down_lambda.output_base64sha256

  environment {
    variables = {
      CLUSTER_NAME = var.cluster_name
      SERVICE_NAME = aws_ecs_service.news_load_service.name
    }
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-news-load-scale-down"
  })
}

// Lambda deployment package
data "archive_file" "scale_down_lambda" {
  type        = "zip"
  output_path = "${path.module}/scale_down.zip"
  source {
    content  = <<-EOF
import boto3
import os

def handler(event, context):
    cluster = os.environ['CLUSTER_NAME']
    service = os.environ['SERVICE_NAME']
    
    ecs = boto3.client('ecs')
    
    # Check if task stopped
    task_arn = event.get('detail', {}).get('taskArn', '')
    last_status = event.get('detail', {}).get('lastStatus', '')
    
    if last_status == 'STOPPED':
        # Scale service to 0
        ecs.update_service(
            cluster=cluster,
            service=service,
            desiredCount=0
        )
        print(f"Scaled service {service} to 0 after task completion")
    
    return {'statusCode': 200}
EOF
    filename = "index.py"
  }
}

// IAM role for scale-down Lambda
resource "aws_iam_role" "scale_down_lambda_role" {
  name = "${var.name_prefix}-news-load-scale-down-role"

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
    Name = "${var.name_prefix}-news-load-scale-down-role"
  })
}

// IAM policy for Lambda to update ECS service
resource "aws_iam_role_policy" "scale_down_lambda_policy" {
  name = "${var.name_prefix}-news-load-scale-down-policy"
  role = aws_iam_role.scale_down_lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ecs:UpdateService",
          "ecs:DescribeServices"
        ]
        Resource = aws_ecs_service.news_load_service.id
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}

// EventBridge rule to trigger Lambda when task stops
resource "aws_cloudwatch_event_rule" "task_stopped" {
  name        = "${var.name_prefix}-news-load-task-stopped"
  description = "Trigger when news load task stops"

  event_pattern = jsonencode({
    source      = ["aws.ecs"]
    detail-type = ["ECS Task State Change"]
    detail = {
      clusterArn        = [var.cluster_arn]
      lastStatus        = ["STOPPED"]
      taskDefinitionArn = [aws_ecs_task_definition.news_load_task.arn]
    }
  })

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-news-load-task-stopped"
  })
}

// EventBridge target - invoke Lambda
resource "aws_cloudwatch_event_target" "scale_down_target" {
  rule      = aws_cloudwatch_event_rule.task_stopped.name
  target_id = "ScaleDownService"
  arn       = aws_lambda_function.scale_down_service.arn
}

// Lambda permission for EventBridge
resource "aws_lambda_permission" "allow_eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.scale_down_service.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.task_stopped.arn
}


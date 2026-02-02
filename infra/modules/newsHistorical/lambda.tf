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


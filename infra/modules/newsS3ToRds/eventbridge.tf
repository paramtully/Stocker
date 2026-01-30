// EventBridge rule to trigger Lambda daily (optional manual trigger)
resource "aws_cloudwatch_event_rule" "sync_schedule" {
  name                = "${var.name_prefix}-news-s3-to-rds-schedule"
  description         = "Trigger news S3-to-RDS sync daily"
  schedule_expression = "rate(1 day)"

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-news-s3-to-rds-schedule"
  })
}

// EventBridge target - invoke Lambda
resource "aws_cloudwatch_event_target" "sync_target" {
  rule      = aws_cloudwatch_event_rule.sync_schedule.name
  target_id = "NewsS3ToRds"
  arn       = aws_lambda_function.s3_to_rds_lambda.arn
}

// Lambda permission for EventBridge
resource "aws_lambda_permission" "allow_eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.s3_to_rds_lambda.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.sync_schedule.arn
}

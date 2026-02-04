// EventBridge rule to trigger Lambda daily (8am EST = 1pm UTC)
resource "aws_cloudwatch_event_rule" "daily_schedule" {
  name                = "${var.name_prefix}-news-daily-schedule"
  description         = "Trigger news daily fetch daily"
  schedule_expression = "cron(0 13 * * ? *)" // 1pm UTC = 8am EST

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-news-daily-schedule"
  })
}

// EventBridge target - invoke Lambda
resource "aws_cloudwatch_event_target" "daily_target" {
  rule      = aws_cloudwatch_event_rule.daily_schedule.name
  target_id = "NewsDaily"
  arn       = aws_lambda_function.daily_lambda.arn
}

// Lambda permission for EventBridge
resource "aws_lambda_permission" "allow_eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.daily_lambda.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.daily_schedule.arn
}

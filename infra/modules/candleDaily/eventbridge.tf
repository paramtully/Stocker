// EventBridge rule to trigger Lambda daily (after market close, 6pm EST = 11pm UTC)
resource "aws_cloudwatch_event_rule" "daily_schedule" {
  name                = "${var.name_prefix}-candle-daily-schedule"
  description         = "Trigger candle daily fetch daily after market close"
  schedule_expression = "cron(0 23 * * ? *)" // 11pm UTC = 6pm EST

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-candle-daily-schedule"
  })
}

// EventBridge target - invoke Lambda
resource "aws_cloudwatch_event_target" "daily_target" {
  rule      = aws_cloudwatch_event_rule.daily_schedule.name
  target_id = "CandleDaily"
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

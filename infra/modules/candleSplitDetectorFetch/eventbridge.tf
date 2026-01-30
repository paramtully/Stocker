// EventBridge rule to trigger Lambda daily
resource "aws_cloudwatch_event_rule" "fetch_schedule" {
  name                = "${var.name_prefix}-split-detector-fetch-schedule"
  description         = "Trigger split detector fetch daily"
  schedule_expression = "rate(1 day)"

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-split-detector-fetch-schedule"
  })
}

// EventBridge target - invoke Lambda
resource "aws_cloudwatch_event_target" "fetch_target" {
  rule      = aws_cloudwatch_event_rule.fetch_schedule.name
  target_id = "SplitDetectorFetch"
  arn       = aws_lambda_function.fetch_lambda.arn
}

// Lambda permission for EventBridge
resource "aws_lambda_permission" "allow_eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.fetch_lambda.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.fetch_schedule.arn
}

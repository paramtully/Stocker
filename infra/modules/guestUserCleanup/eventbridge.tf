// EventBridge rule to trigger Lambda weekly
resource "aws_cloudwatch_event_rule" "cleanup_schedule" {
  name                = "${var.name_prefix}-guest-user-cleanup-schedule"
  description         = "Trigger guest user cleanup weekly"
  schedule_expression = "rate(7 days)"

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-guest-user-cleanup-schedule"
  })
}

// EventBridge target - invoke Lambda
resource "aws_cloudwatch_event_target" "cleanup_target" {
  rule      = aws_cloudwatch_event_rule.cleanup_schedule.name
  target_id = "GuestUserCleanup"
  arn       = aws_lambda_function.cleanup_lambda.arn
}

// Lambda permission for EventBridge
resource "aws_lambda_permission" "allow_eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.cleanup_lambda.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.cleanup_schedule.arn
}

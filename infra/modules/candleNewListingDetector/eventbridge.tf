// EventBridge rule to trigger Lambda daily
resource "aws_cloudwatch_event_rule" "detector_schedule" {
  name                = "${var.name_prefix}-candle-new-listing-detector-schedule"
  description         = "Trigger new listing detector daily"
  schedule_expression = "rate(1 day)"

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-candle-new-listing-detector-schedule"
  })
}

// EventBridge target - invoke Lambda
resource "aws_cloudwatch_event_target" "detector_target" {
  rule      = aws_cloudwatch_event_rule.detector_schedule.name
  target_id = "CandleNewListingDetector"
  arn       = aws_lambda_function.detector_lambda.arn
}

// Lambda permission for EventBridge
resource "aws_lambda_permission" "allow_eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.detector_lambda.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.detector_schedule.arn
}

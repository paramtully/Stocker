// EventBridge rule to trigger Lambda every 3 days
resource "aws_cloudwatch_event_rule" "ingestion_schedule" {
  name                = "${var.name_prefix}-new-listing-ingestion-schedule"
  description         = "Trigger new listing ingestion every 3 days"
  schedule_expression = "rate(3 days)"

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-new-listing-ingestion-schedule"
  })
}

// EventBridge target - invoke Lambda
resource "aws_cloudwatch_event_target" "ingestion_target" {
  rule      = aws_cloudwatch_event_rule.ingestion_schedule.name
  target_id = "NewListingIngestion"
  arn       = aws_lambda_function.ingestion_lambda.arn
}

// Lambda permission for EventBridge
resource "aws_lambda_permission" "allow_eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.ingestion_lambda.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.ingestion_schedule.arn
}


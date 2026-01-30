// S3 bucket notification configuration to trigger Lambda on PutObject
resource "aws_s3_bucket_notification" "lambda_trigger" {
  bucket = var.s3_bucket_id

  lambda_function {
    lambda_function_arn = aws_lambda_function.apply_lambda.arn
    events              = ["s3:ObjectCreated:Put"]
    filter_prefix       = "splits/pending/"
    filter_suffix       = "-splits.json"
  }

  depends_on = [aws_lambda_permission.allow_s3]
}

// Lambda permission for S3 to invoke Lambda
resource "aws_lambda_permission" "allow_s3" {
  statement_id  = "AllowExecutionFromS3Bucket"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.apply_lambda.function_name
  principal     = "s3.amazonaws.com"
  source_arn    = "arn:aws:s3:::${var.s3_bucket_name}"
}

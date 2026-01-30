output "lambda_function_arn" {
  description = "ARN of the Lambda function"
  value       = aws_lambda_function.fetch_lambda.arn
}

output "lambda_function_name" {
  description = "Name of the Lambda function"
  value       = aws_lambda_function.fetch_lambda.function_name
}

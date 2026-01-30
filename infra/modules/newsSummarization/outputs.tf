output "lambda_function_arn" {
  description = "ARN of the Lambda function"
  value       = aws_lambda_function.summarization_lambda.arn
}

output "lambda_function_name" {
  description = "Name of the Lambda function"
  value       = aws_lambda_function.summarization_lambda.function_name
}

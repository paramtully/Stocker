output "lambda_function_arn" {
  description = "ARN of the Lambda function"
  value       = aws_lambda_function.apply_lambda.arn
}

output "lambda_function_name" {
  description = "Name of the Lambda function"
  value       = aws_lambda_function.apply_lambda.function_name
}

output "lambda_security_group_id" {
  description = "Security group ID of the Lambda function (for RDS ingress rule)"
  value       = aws_security_group.lambda_sg.id
}

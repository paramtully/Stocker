output "user_pool_id" {
  description = "Cognito User Pool ID"
  value       = aws_cognito_user_pool.user_pool.id
}

output "user_pool_arn" {
  description = "Cognito User Pool ARN"
  value       = aws_cognito_user_pool.user_pool.arn
}

output "app_client_id" {
  description = "Cognito User Pool Client ID"
  value       = aws_cognito_user_pool_client.app_client.id
}

output "issuer_url" {
  description = "Cognito issuer URL for JWT validation (format: cognito-idp.region.amazonaws.com/user_pool_id)"
  value       = aws_cognito_user_pool.user_pool.endpoint
}

output "domain_name" {
  description = "Domain name for JWT issuer (for API Gateway authorizer)"
  value       = "${replace(aws_cognito_user_pool.user_pool.endpoint, "https://", "")}"
}
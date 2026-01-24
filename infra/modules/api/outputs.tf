output "api_gateway_id" {
    description = "ID of the API Gateway"
    value       = aws_apigatewayv2_api.api_gateway.id
}

output "api_gateway_endpoint" {
    description = "Invocation URL for the API Gateway"
    value       = aws_apigatewayv2_stage.api_stage.invoke_url
}

output "api_gateway_arn" {
    description = "ARN of the API Gateway"
    value       = aws_apigatewayv2_api.api_gateway.arn
}
// defines configurations for the API Gateway
resource "aws_apigatewayv2_api" "api_gateway" {
  name          = "${var.name_prefix}-api-gateway"
  protocol_type = "HTTP"

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-api-gateway"
  })
  description = "API Gateway for ${var.name_prefix} backend"
}

resource "aws_apigatewayv2_authorizer" "jwt_authorizer" {
  api_id           = aws_apigatewayv2_api.api_gateway.id
  name             = "${var.name_prefix}-jwt-authorizer"
  authorizer_type  = "JWT"
  identity_sources = ["$request.header.Authorization"]
  jwt_configuration {
    issuer   = "https://${var.domain_name}"
    audience = [var.cognito_app_client_id]
  }
}

resource "aws_apigatewayv2_integration" "lambda_integration" {
  api_id                 = aws_apigatewayv2_api.api_gateway.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.api_lambda.invoke_arn
  integration_method     = "POST"
  payload_format_version = "2.0"
}


// Routes WITH JWT authorizer (using interceptedUserHandler)
resource "aws_apigatewayv2_route" "get_auth_user" {
  api_id             = aws_apigatewayv2_api.api_gateway.id
  route_key          = "GET /api/auth/user"
  target             = "integrations/${aws_apigatewayv2_integration.lambda_integration.id}"
  authorizer_id      = aws_apigatewayv2_authorizer.jwt_authorizer.id
  authorization_type = "JWT"
}

resource "aws_apigatewayv2_route" "get_portfolio_quotes" {
  api_id             = aws_apigatewayv2_api.api_gateway.id
  route_key          = "GET /api/portfolio/quotes"
  target             = "integrations/${aws_apigatewayv2_integration.lambda_integration.id}"
  authorizer_id      = aws_apigatewayv2_authorizer.jwt_authorizer.id
  authorization_type = "JWT"
}

resource "aws_apigatewayv2_route" "post_portfolio_holdings" {
  api_id             = aws_apigatewayv2_api.api_gateway.id
  route_key          = "POST /api/portfolio/holdings"
  target             = "integrations/${aws_apigatewayv2_integration.lambda_integration.id}"
  authorizer_id      = aws_apigatewayv2_authorizer.jwt_authorizer.id
  authorization_type = "JWT"
}

resource "aws_apigatewayv2_route" "delete_portfolio_holdings" {
  api_id             = aws_apigatewayv2_api.api_gateway.id
  route_key          = "DELETE /api/portfolio/holdings/{ticker}"
  target             = "integrations/${aws_apigatewayv2_integration.lambda_integration.id}"
  authorizer_id      = aws_apigatewayv2_authorizer.jwt_authorizer.id
  authorization_type = "JWT"
}

resource "aws_apigatewayv2_route" "get_portfolio_overview" {
  api_id             = aws_apigatewayv2_api.api_gateway.id
  route_key          = "GET /api/portfolio/overview"
  target             = "integrations/${aws_apigatewayv2_integration.lambda_integration.id}"
  authorizer_id      = aws_apigatewayv2_authorizer.jwt_authorizer.id
  authorization_type = "JWT"
}

resource "aws_apigatewayv2_route" "get_portfolio_charts" {
  api_id             = aws_apigatewayv2_api.api_gateway.id
  route_key          = "GET /api/portfolio/charts"
  target             = "integrations/${aws_apigatewayv2_integration.lambda_integration.id}"
  authorizer_id      = aws_apigatewayv2_authorizer.jwt_authorizer.id
  authorization_type = "JWT"
}

resource "aws_apigatewayv2_route" "get_news" {
  api_id             = aws_apigatewayv2_api.api_gateway.id
  route_key          = "GET /api/news"
  target             = "integrations/${aws_apigatewayv2_integration.lambda_integration.id}"
  authorizer_id      = aws_apigatewayv2_authorizer.jwt_authorizer.id
  authorization_type = "JWT"
}

resource "aws_apigatewayv2_route" "get_settings_email" {
  api_id             = aws_apigatewayv2_api.api_gateway.id
  route_key          = "GET /api/settings/email"
  target             = "integrations/${aws_apigatewayv2_integration.lambda_integration.id}"
  authorizer_id      = aws_apigatewayv2_authorizer.jwt_authorizer.id
  authorization_type = "JWT"
}

resource "aws_apigatewayv2_route" "put_settings_email" {
  api_id             = aws_apigatewayv2_api.api_gateway.id
  route_key          = "PUT /api/settings/email"
  target             = "integrations/${aws_apigatewayv2_integration.lambda_integration.id}"
  authorizer_id      = aws_apigatewayv2_authorizer.jwt_authorizer.id
  authorization_type = "JWT"
}

resource "aws_apigatewayv2_route" "post_track_pageview" {
  api_id             = aws_apigatewayv2_api.api_gateway.id
  route_key          = "POST /api/track/pageview"
  target             = "integrations/${aws_apigatewayv2_integration.lambda_integration.id}"
  authorizer_id      = aws_apigatewayv2_authorizer.jwt_authorizer.id
  authorization_type = "JWT"
}

resource "aws_apigatewayv2_route" "get_admin_metrics" {
  api_id             = aws_apigatewayv2_api.api_gateway.id
  route_key          = "GET /api/admin/metrics"
  target             = "integrations/${aws_apigatewayv2_integration.lambda_integration.id}"
  authorizer_id      = aws_apigatewayv2_authorizer.jwt_authorizer.id
  authorization_type = "JWT"
}

// Routes WITHOUT JWT authorizer
resource "aws_apigatewayv2_route" "get_auth_guest" {
  api_id    = aws_apigatewayv2_api.api_gateway.id
  route_key = "GET /api/auth/guest"
  target    = "integrations/${aws_apigatewayv2_integration.lambda_integration.id}"
}

resource "aws_apigatewayv2_route" "post_auth_signup" {
  api_id    = aws_apigatewayv2_api.api_gateway.id
  route_key = "POST /api/auth/signup"
  target    = "integrations/${aws_apigatewayv2_integration.lambda_integration.id}"
}

resource "aws_apigatewayv2_route" "get_stocks_search" {
  api_id    = aws_apigatewayv2_api.api_gateway.id
  route_key = "GET /api/stocks/search"
  target    = "integrations/${aws_apigatewayv2_integration.lambda_integration.id}"
}

// deploys API
resource "aws_apigatewayv2_stage" "api_stage" {
  api_id      = aws_apigatewayv2_api.api_gateway.id
  name        = "$default"
  auto_deploy = true
  tags = merge(var.tags, {
    Name = "${var.name_prefix}-api-stage"
  })
}

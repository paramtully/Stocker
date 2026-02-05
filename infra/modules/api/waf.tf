// AWS WAF Web ACL for rate limiting and DDoS protection
resource "aws_wafv2_web_acl" "api_waf" {
  name        = "${var.name_prefix}-api-waf"
  description = "WAF for API Gateway rate limiting and protection"
  scope       = "REGIONAL"

  default_action {
    allow {}
  }

  // Rate limit for unauthenticated endpoints (public routes)
  rule {
    name     = "RateLimitUnauthenticated"
    priority = 1

    statement {
      rate_based_statement {
        limit              = var.rate_limit_unauthenticated
        aggregate_key_type = "IP"

        // Scope down to unauthenticated routes only
        scope_down_statement {
          or_statement {
            statement {
              byte_match_statement {
                positional_constraint = "STARTS_WITH"
                search_string         = "/api/auth/guest"
                field_to_match {
                  uri_path {}
                }
                text_transformation {
                  priority = 0
                  type     = "LOWERCASE"
                }
              }
            }
            statement {
              byte_match_statement {
                positional_constraint = "STARTS_WITH"
                search_string         = "/api/auth/signup"
                field_to_match {
                  uri_path {}
                }
                text_transformation {
                  priority = 0
                  type     = "LOWERCASE"
                }
              }
            }
            statement {
              byte_match_statement {
                positional_constraint = "STARTS_WITH"
                search_string         = "/api/stocks/search"
                field_to_match {
                  uri_path {}
                }
                text_transformation {
                  priority = 0
                  type     = "LOWERCASE"
                }
              }
            }
          }
        }
      }
    }

    action {
      block {}
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "RateLimitUnauthenticated"
      sampled_requests_enabled   = true
    }
  }

  // Rate limit for authenticated endpoints (JWT-protected routes)
  rule {
    name     = "RateLimitAuthenticated"
    priority = 2

    statement {
      rate_based_statement {
        limit              = var.rate_limit_authenticated
        aggregate_key_type = "IP"

        // Scope down to authenticated routes (those with Authorization header)
        scope_down_statement {
          byte_match_statement {
            positional_constraint = "CONTAINS"
            search_string         = "Bearer"
            field_to_match {
              single_header {
                name = "authorization"
              }
            }
            text_transformation {
              priority = 0
              type     = "LOWERCASE"
            }
          }
        }
      }
    }

    action {
      block {}
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "RateLimitAuthenticated"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${var.name_prefix}-api-waf"
    sampled_requests_enabled   = true
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-api-waf"
  })
}

// Associate WAF with API Gateway stage
resource "aws_wafv2_web_acl_association" "api_waf_association" {
  resource_arn = aws_apigatewayv2_stage.api_stage.arn
  web_acl_arn  = aws_wafv2_web_acl.api_waf.arn
}

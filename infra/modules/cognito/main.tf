resource "aws_cognito_user_pool" "user_pool" {
  name = "${var.name_prefix}-user-pool"

  // Password policy
  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_uppercase = true
    require_numbers   = true
    require_symbols   = true
  }

  // User attributes
  schema {
    name                = "email"
    attribute_data_type = "String"
    required            = true
    mutable             = true
  }

  // Custom attribute for user role
  schema {
    name                = "role"
    attribute_data_type = "String"
    required            = false
    mutable             = true
  }

  // Auto-verify email
  auto_verified_attributes = ["email"]

  // Admin create user config (for guest user creation)
  admin_create_user_config {
    allow_admin_create_user_only = false
  }

  // Account recovery
  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  // Deletion protection
  deletion_protection = "ACTIVE"

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-user-pool"
  })
}

resource "aws_cognito_user_pool_client" "app_client" {
  name         = "${var.name_prefix}-app-client"
  user_pool_id = aws_cognito_user_pool.user_pool.id

  // Authentication flows
  explicit_auth_flows = [
    "ALLOW_ADMIN_USER_PASSWORD_AUTH",
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH"
  ]

  // Token validity
  access_token_validity  = 60  // 1 hour
  id_token_validity      = 60  // 1 hour
  refresh_token_validity = 7  // 7 days

  // Prevent user existence errors (security)
  prevent_user_existence_errors = "ENABLED"

  // Generate secret (set to false if you need a client secret)
  generate_secret = false

  // Supported identity providers
  supported_identity_providers = ["COGNITO"]

}
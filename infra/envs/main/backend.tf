// defines where terraform state is stored
// Note: Terraform backend blocks don't support variables directly.
// To use different values, you can:
// 1. Use environment variables: TF_CLI_ARGS_backend="-backend-config=bucket=my-bucket"
// 2. Use a backend config file: terraform init -backend-config=backend.hcl
// 3. Use partial backend configuration and pass values via -backend-config flags
//
// The backend region (us-east-1) can differ from the deployment region (us-west-2).
// This is common practice as backend is often in us-east-1 for global availability.
// The S3 bucket and DynamoDB table must exist before running terraform init.
// Create them manually or use a bootstrap Terraform configuration.
terraform {
  backend "s3" {
    bucket         = "stocker-terraform-state"
    key            = "main/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-locks"
    encrypt        = true
  }
}
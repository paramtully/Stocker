// defines where terraform state is stored
terraform {
  backend "s3" {
    bucket         = "stocker-terraform-state"
    key            = "main/terraform.tfstate"
    region         = "us-east-1"    // TODO: make this a variable
    dynamodb_table = "terraform-locks" // TODO: make this a variable
    encrypt        = false
  }
}
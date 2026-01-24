resource "aws_vpc" "vpc" {
  cidr_block = var.cidr

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-vpc"
  })
}

resource "aws_subnet" "private" {
  vpc_id     = aws_vpc.vpc.id // links to vpc resource
  cidr_block = "10.0.10.0/24"

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-private-subnet"
  })
}

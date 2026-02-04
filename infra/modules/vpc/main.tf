resource "aws_vpc" "vpc" {
  cidr_block = var.cidr

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-vpc"
  })
}

// Internet Gateway for public subnets
resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.vpc.id

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-igw"
  })
}

// Public Subnet
resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.vpc.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = data.aws_availability_zones.available.names[0]
  map_public_ip_on_launch = true

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-public-subnet"
  })
}

// Route table for public subnet
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-public-rt"
  })
}

// Associate public subnet with public route table
resource "aws_route_table_association" "public" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
}


// Private Subnet
resource "aws_subnet" "private" {
  vpc_id     = aws_vpc.vpc.id // links to vpc resource
  cidr_block = "10.0.10.0/24"
  availability_zone = data.aws_availability_zones.available.names[0]

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-private-subnet"
  })
}

// Data source for availability zones
data "aws_availability_zones" "available" {
  state = "available"
}

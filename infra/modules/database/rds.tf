resource "aws_db_instance" "database" {
  identifier     = "${var.name_prefix}-db"
  engine         = "postgres"
  engine_version = var.engine_version
  instance_class = var.instance_class

  db_name  = var.database_name
  username = var.master_username
  password = var.master_password

  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type          = "gp3"
  storage_encrypted     = true

  db_subnet_group_name   = aws_db_subnet_group.database_subnet_group.name
  vpc_security_group_ids = [aws_security_group.database_security_group.id]

  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "mon:04:00-mon:05:00"

  skip_final_snapshot       = false
  final_snapshot_identifier = "${var.name_prefix}-db-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-db"
  })
}

resource "aws_db_subnet_group" "database_subnet_group" {
  name       = "${var.name_prefix}-db-subnet-group"
  subnet_ids = var.subnet_ids

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-db-subnet-group"
  })
}

resource "aws_security_group" "database_security_group" {
  name        = "${var.name_prefix}-db-security-group"
  description = "Security group for RDS database"
  vpc_id      = var.vpc_id

  // Allow inbound from Lambda security groups on PostgreSQL port
  dynamic "ingress" {
    for_each = var.lambda_security_group_ids
    content {
      from_port       = 5432
      to_port         = 5432
      protocol        = "tcp"
      security_groups = [ingress.value]
      description     = "Allow PostgreSQL access from Lambda"
    }
  }

  // No outbound needed for RDS

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-db-security-group"
  })
}

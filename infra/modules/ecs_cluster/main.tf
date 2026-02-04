// Shared ECS Cluster for batch load jobs
resource "aws_ecs_cluster" "batch_load_cluster" {
  name = "${var.name_prefix}-batch-load-cluster"

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-batch-load-cluster"
  })
}

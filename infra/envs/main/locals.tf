// defines tag related variables
locals {
    project = "stocker"
    env     = "main"

    name_prefix = "${local.project}-${local.env}"

    required_tags = {
        project = local.project
        env     = local.env
        managed_by = "terraform"
    }
}
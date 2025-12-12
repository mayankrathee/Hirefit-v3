# Container Apps Module

variable "resource_group_name" {
  type = string
}

variable "location" {
  type = string
}

variable "environment" {
  type = string
}

variable "resource_suffix" {
  type = string
}

variable "subnet_id" {
  type = string
}

variable "log_analytics_workspace_id" {
  type = string
}

variable "tags" {
  type = map(string)
}

# Container Apps Environment
resource "azurerm_container_app_environment" "main" {
  name                       = "cae-hirefit-${var.environment}-${var.resource_suffix}"
  location                   = var.location
  resource_group_name        = var.resource_group_name
  log_analytics_workspace_id = var.log_analytics_workspace_id
  infrastructure_subnet_id   = var.subnet_id

  tags = var.tags
}

# API Container App (placeholder - will be deployed via CI/CD)
resource "azurerm_container_app" "api" {
  name                         = "ca-api-hirefit-${var.environment}"
  container_app_environment_id = azurerm_container_app_environment.main.id
  resource_group_name          = var.resource_group_name
  revision_mode                = "Single"

  template {
    container {
      name   = "api"
      image  = "mcr.microsoft.com/azuredocs/containerapps-helloworld:latest"
      cpu    = 0.5
      memory = "1Gi"

      env {
        name  = "NODE_ENV"
        value = var.environment
      }
    }

    min_replicas = var.environment == "prod" ? 2 : 1
    max_replicas = var.environment == "prod" ? 10 : 3
  }

  ingress {
    external_enabled = true
    target_port      = 3001
    transport        = "http"

    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }

  tags = var.tags
}

output "environment_id" {
  value = azurerm_container_app_environment.main.id
}

output "environment_name" {
  value = azurerm_container_app_environment.main.name
}

output "api_fqdn" {
  value = azurerm_container_app.api.ingress[0].fqdn
}


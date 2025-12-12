# Cognitive Search Module

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

variable "sku" {
  type    = string
  default = "basic"
}

variable "key_vault_id" {
  type = string
}

variable "tags" {
  type = map(string)
}

resource "azurerm_search_service" "main" {
  name                = "srch-hirefit-${var.environment}-${var.resource_suffix}"
  resource_group_name = var.resource_group_name
  location            = var.location
  sku                 = var.sku
  replica_count       = var.environment == "prod" ? 2 : 1
  partition_count     = 1

  public_network_access_enabled = var.environment != "prod"

  identity {
    type = "SystemAssigned"
  }

  tags = var.tags
}

# Store API key in Key Vault
resource "azurerm_key_vault_secret" "search_api_key" {
  name         = "search-api-key"
  value        = azurerm_search_service.main.primary_key
  key_vault_id = var.key_vault_id
}

output "search_id" {
  value = azurerm_search_service.main.id
}

output "endpoint" {
  value = "https://${azurerm_search_service.main.name}.search.windows.net"
}


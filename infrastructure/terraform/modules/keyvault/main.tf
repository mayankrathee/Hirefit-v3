# Key Vault Module

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

variable "tenant_id" {
  type = string
}

variable "admin_object_ids" {
  type = list(string)
}

variable "subnet_id" {
  type = string
}

variable "tags" {
  type = map(string)
}

resource "azurerm_key_vault" "main" {
  name                        = "kv-hirefit-${var.environment}-${var.resource_suffix}"
  location                    = var.location
  resource_group_name         = var.resource_group_name
  tenant_id                   = var.tenant_id
  sku_name                    = "standard"
  soft_delete_retention_days  = 90
  purge_protection_enabled    = true
  enable_rbac_authorization   = true

  network_acls {
    default_action = "Deny"
    bypass         = "AzureServices"
  }

  tags = var.tags
}

# Private Endpoint for Key Vault
resource "azurerm_private_endpoint" "keyvault" {
  name                = "pe-kv-hirefit-${var.environment}"
  location            = var.location
  resource_group_name = var.resource_group_name
  subnet_id           = var.subnet_id

  private_service_connection {
    name                           = "psc-kv-hirefit"
    private_connection_resource_id = azurerm_key_vault.main.id
    subresource_names              = ["vault"]
    is_manual_connection           = false
  }

  tags = var.tags
}

# Role assignments for admins
resource "azurerm_role_assignment" "admin" {
  count                = length(var.admin_object_ids)
  scope                = azurerm_key_vault.main.id
  role_definition_name = "Key Vault Administrator"
  principal_id         = var.admin_object_ids[count.index]
}

output "key_vault_id" {
  value = azurerm_key_vault.main.id
}

output "key_vault_name" {
  value = azurerm_key_vault.main.name
}

output "key_vault_uri" {
  value = azurerm_key_vault.main.vault_uri
}


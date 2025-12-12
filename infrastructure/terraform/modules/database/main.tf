# SQL Database Module

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

variable "admin_login" {
  type      = string
  sensitive = true
}

variable "admin_password" {
  type      = string
  sensitive = true
}

variable "subnet_id" {
  type = string
}

variable "key_vault_id" {
  type = string
}

variable "tags" {
  type = map(string)
}

# SQL Server
resource "azurerm_mssql_server" "main" {
  name                         = "sql-hirefit-${var.environment}-${var.resource_suffix}"
  resource_group_name          = var.resource_group_name
  location                     = var.location
  version                      = "12.0"
  administrator_login          = var.admin_login
  administrator_login_password = var.admin_password
  minimum_tls_version          = "1.2"

  azuread_administrator {
    login_username = "AzureAD Admin"
    object_id      = data.azurerm_client_config.current.object_id
  }

  tags = var.tags
}

data "azurerm_client_config" "current" {}

# SQL Database
resource "azurerm_mssql_database" "main" {
  name                        = "sqldb-hirefit-${var.environment}"
  server_id                   = azurerm_mssql_server.main.id
  collation                   = "SQL_Latin1_General_CP1_CI_AS"
  max_size_gb                 = var.environment == "prod" ? 100 : 10
  sku_name                    = var.environment == "prod" ? "S2" : "S0"
  zone_redundant              = var.environment == "prod"
  storage_account_type        = "Local"

  threat_detection_policy {
    state                      = "Enabled"
    email_account_admins       = "Enabled"
  }

  tags = var.tags
}

# Private Endpoint
resource "azurerm_private_endpoint" "sql" {
  name                = "pe-sql-hirefit-${var.environment}"
  location            = var.location
  resource_group_name = var.resource_group_name
  subnet_id           = var.subnet_id

  private_service_connection {
    name                           = "psc-sql-hirefit"
    private_connection_resource_id = azurerm_mssql_server.main.id
    subresource_names              = ["sqlServer"]
    is_manual_connection           = false
  }

  tags = var.tags
}

# Store connection string in Key Vault
resource "azurerm_key_vault_secret" "sql_connection_string" {
  name         = "sql-connection-string"
  value        = "Server=tcp:${azurerm_mssql_server.main.fully_qualified_domain_name},1433;Initial Catalog=${azurerm_mssql_database.main.name};Persist Security Info=False;User ID=${var.admin_login};Password=${var.admin_password};MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;"
  key_vault_id = var.key_vault_id
}

output "sql_server_id" {
  value = azurerm_mssql_server.main.id
}

output "sql_server_fqdn" {
  value = azurerm_mssql_server.main.fully_qualified_domain_name
}

output "sql_database_id" {
  value = azurerm_mssql_database.main.id
}

output "sql_database_name" {
  value = azurerm_mssql_database.main.name
}


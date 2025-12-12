# HireFit Platform - Terraform Outputs

output "resource_group_name" {
  description = "Name of the resource group"
  value       = azurerm_resource_group.main.name
}

output "resource_group_id" {
  description = "ID of the resource group"
  value       = azurerm_resource_group.main.id
}

# Network
output "vnet_id" {
  description = "ID of the virtual network"
  value       = module.network.vnet_id
}

output "vnet_name" {
  description = "Name of the virtual network"
  value       = module.network.vnet_name
}

# Key Vault
output "key_vault_id" {
  description = "ID of the Key Vault"
  value       = module.keyvault.key_vault_id
}

output "key_vault_name" {
  description = "Name of the Key Vault"
  value       = module.keyvault.key_vault_name
}

output "key_vault_uri" {
  description = "URI of the Key Vault"
  value       = module.keyvault.key_vault_uri
}

# Database
output "sql_server_fqdn" {
  description = "FQDN of the SQL Server"
  value       = module.database.sql_server_fqdn
}

output "sql_database_name" {
  description = "Name of the SQL Database"
  value       = module.database.sql_database_name
}

# Storage
output "storage_account_name" {
  description = "Name of the storage account"
  value       = module.storage.storage_account_name
}

output "storage_primary_blob_endpoint" {
  description = "Primary blob endpoint"
  value       = module.storage.primary_blob_endpoint
}

# Redis
output "redis_hostname" {
  description = "Redis Cache hostname"
  value       = module.redis.hostname
}

output "redis_port" {
  description = "Redis Cache SSL port"
  value       = module.redis.ssl_port
}

# Service Bus
output "servicebus_namespace" {
  description = "Service Bus namespace name"
  value       = module.servicebus.namespace_name
}

# Search
output "search_endpoint" {
  description = "Cognitive Search endpoint"
  value       = module.search.endpoint
}

# Container Apps
output "api_fqdn" {
  description = "FQDN of the API container app"
  value       = module.container_apps.api_fqdn
}

output "container_apps_environment_id" {
  description = "ID of the Container Apps environment"
  value       = module.container_apps.environment_id
}

# Monitoring
output "log_analytics_workspace_id" {
  description = "ID of the Log Analytics workspace"
  value       = module.monitoring.log_analytics_workspace_id
}

output "application_insights_connection_string" {
  description = "Application Insights connection string"
  value       = module.monitoring.application_insights_connection_string
  sensitive   = true
}

# Front Door
output "frontdoor_endpoint" {
  description = "Front Door endpoint URL"
  value       = module.frontdoor.endpoint_url
}


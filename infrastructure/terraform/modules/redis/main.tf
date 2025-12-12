# Redis Cache Module

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

variable "key_vault_id" {
  type = string
}

variable "sku" {
  type    = string
  default = "Basic"
}

variable "tags" {
  type = map(string)
}

resource "azurerm_redis_cache" "main" {
  name                          = "redis-hirefit-${var.environment}-${var.resource_suffix}"
  location                      = var.location
  resource_group_name           = var.resource_group_name
  capacity                      = var.sku == "Basic" ? 0 : 1
  family                        = var.sku == "Premium" ? "P" : "C"
  sku_name                      = var.sku
  enable_non_ssl_port           = false
  minimum_tls_version           = "1.2"
  public_network_access_enabled = false

  redis_configuration {
    maxmemory_policy = "volatile-lru"
  }

  tags = var.tags
}

# Private Endpoint
resource "azurerm_private_endpoint" "redis" {
  name                = "pe-redis-hirefit-${var.environment}"
  location            = var.location
  resource_group_name = var.resource_group_name
  subnet_id           = var.subnet_id

  private_service_connection {
    name                           = "psc-redis-hirefit"
    private_connection_resource_id = azurerm_redis_cache.main.id
    subresource_names              = ["redisCache"]
    is_manual_connection           = false
  }

  tags = var.tags
}

# Store connection string in Key Vault
resource "azurerm_key_vault_secret" "redis_connection_string" {
  name         = "redis-connection-string"
  value        = azurerm_redis_cache.main.primary_connection_string
  key_vault_id = var.key_vault_id
}

output "redis_id" {
  value = azurerm_redis_cache.main.id
}

output "hostname" {
  value = azurerm_redis_cache.main.hostname
}

output "ssl_port" {
  value = azurerm_redis_cache.main.ssl_port
}


# Service Bus Module

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
  default = "Standard"
}

variable "tags" {
  type = map(string)
}

resource "azurerm_servicebus_namespace" "main" {
  name                = "sb-hirefit-${var.environment}-${var.resource_suffix}"
  location            = var.location
  resource_group_name = var.resource_group_name
  sku                 = var.sku

  tags = var.tags
}

# Topics
resource "azurerm_servicebus_topic" "resume_processing" {
  name                = "resume-processing"
  namespace_id        = azurerm_servicebus_namespace.main.id
  enable_partitioning = true
}

resource "azurerm_servicebus_topic" "notifications" {
  name                = "notifications"
  namespace_id        = azurerm_servicebus_namespace.main.id
  enable_partitioning = true
}

resource "azurerm_servicebus_topic" "ai_scoring" {
  name                = "ai-scoring"
  namespace_id        = azurerm_servicebus_namespace.main.id
  enable_partitioning = true
}

# Subscriptions
resource "azurerm_servicebus_subscription" "resume_parser" {
  name               = "resume-parser"
  topic_id           = azurerm_servicebus_topic.resume_processing.id
  max_delivery_count = 10
}

resource "azurerm_servicebus_subscription" "ai_scorer" {
  name               = "ai-scorer"
  topic_id           = azurerm_servicebus_topic.ai_scoring.id
  max_delivery_count = 5
}

# Private Endpoint
resource "azurerm_private_endpoint" "servicebus" {
  name                = "pe-sb-hirefit-${var.environment}"
  location            = var.location
  resource_group_name = var.resource_group_name
  subnet_id           = var.subnet_id

  private_service_connection {
    name                           = "psc-sb-hirefit"
    private_connection_resource_id = azurerm_servicebus_namespace.main.id
    subresource_names              = ["namespace"]
    is_manual_connection           = false
  }

  tags = var.tags
}

# Store connection string in Key Vault
resource "azurerm_key_vault_secret" "servicebus_connection_string" {
  name         = "servicebus-connection-string"
  value        = azurerm_servicebus_namespace.main.default_primary_connection_string
  key_vault_id = var.key_vault_id
}

output "namespace_id" {
  value = azurerm_servicebus_namespace.main.id
}

output "namespace_name" {
  value = azurerm_servicebus_namespace.main.name
}


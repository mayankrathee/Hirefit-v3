# Monitoring Module

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

variable "tags" {
  type = map(string)
}

# Log Analytics Workspace
resource "azurerm_log_analytics_workspace" "main" {
  name                = "log-hirefit-${var.environment}-${var.resource_suffix}"
  location            = var.location
  resource_group_name = var.resource_group_name
  sku                 = "PerGB2018"
  retention_in_days   = var.environment == "prod" ? 90 : 30

  tags = var.tags
}

# Application Insights
resource "azurerm_application_insights" "main" {
  name                = "appi-hirefit-${var.environment}-${var.resource_suffix}"
  location            = var.location
  resource_group_name = var.resource_group_name
  workspace_id        = azurerm_log_analytics_workspace.main.id
  application_type    = "web"

  tags = var.tags
}

# Action Group for alerts
resource "azurerm_monitor_action_group" "main" {
  name                = "ag-hirefit-${var.environment}"
  resource_group_name = var.resource_group_name
  short_name          = "hirefit"

  tags = var.tags
}

# Alert Rules
resource "azurerm_monitor_metric_alert" "high_cpu" {
  name                = "alert-high-cpu-${var.environment}"
  resource_group_name = var.resource_group_name
  scopes              = [azurerm_application_insights.main.id]
  description         = "Alert when CPU usage is high"
  severity            = 2
  frequency           = "PT5M"
  window_size         = "PT15M"

  criteria {
    metric_namespace = "microsoft.insights/components"
    metric_name      = "performanceCounters/processCpuPercentage"
    aggregation      = "Average"
    operator         = "GreaterThan"
    threshold        = 80
  }

  action {
    action_group_id = azurerm_monitor_action_group.main.id
  }

  tags = var.tags
}

output "log_analytics_workspace_id" {
  value = azurerm_log_analytics_workspace.main.id
}

output "log_analytics_workspace_name" {
  value = azurerm_log_analytics_workspace.main.name
}

output "application_insights_id" {
  value = azurerm_application_insights.main.id
}

output "application_insights_connection_string" {
  value     = azurerm_application_insights.main.connection_string
  sensitive = true
}

output "application_insights_instrumentation_key" {
  value     = azurerm_application_insights.main.instrumentation_key
  sensitive = true
}


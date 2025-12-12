# HireFit Platform - Terraform Variables

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "location" {
  description = "Azure region for resources"
  type        = string
  default     = "eastus2"
}

variable "location_short" {
  description = "Short name for Azure region"
  type        = string
  default     = "eus2"
}

variable "owner_email" {
  description = "Email of the resource owner for tagging"
  type        = string
}

# Network
variable "vnet_address_space" {
  description = "Address space for the virtual network"
  type        = list(string)
  default     = ["10.0.0.0/16"]
}

# Key Vault
variable "keyvault_admin_object_ids" {
  description = "Object IDs of users/groups with admin access to Key Vault"
  type        = list(string)
  default     = []
}

# Database
variable "sql_admin_login" {
  description = "SQL Server admin login"
  type        = string
  sensitive   = true
}

variable "sql_admin_password" {
  description = "SQL Server admin password"
  type        = string
  sensitive   = true
}

variable "sql_sku" {
  description = "SQL Database SKU"
  type        = string
  default     = "S0"
}

# Redis
variable "redis_sku" {
  description = "Redis Cache SKU (Basic, Standard, Premium)"
  type        = string
  default     = "Basic"
}

variable "redis_capacity" {
  description = "Redis Cache capacity (0-6 for Basic/Standard, 1-4 for Premium)"
  type        = number
  default     = 0
}

# Service Bus
variable "servicebus_sku" {
  description = "Service Bus SKU (Basic, Standard, Premium)"
  type        = string
  default     = "Standard"
}

# Search
variable "search_sku" {
  description = "Cognitive Search SKU"
  type        = string
  default     = "basic"
}

# Container Apps
variable "api_image" {
  description = "Docker image for API container"
  type        = string
  default     = "mcr.microsoft.com/azuredocs/containerapps-helloworld:latest"
}

variable "api_min_replicas" {
  description = "Minimum replicas for API"
  type        = number
  default     = 1
}

variable "api_max_replicas" {
  description = "Maximum replicas for API"
  type        = number
  default     = 10
}

# Azure AD
variable "aad_client_id" {
  description = "Azure AD application client ID"
  type        = string
  default     = ""
}

variable "aad_tenant_id" {
  description = "Azure AD tenant ID"
  type        = string
  default     = ""
}


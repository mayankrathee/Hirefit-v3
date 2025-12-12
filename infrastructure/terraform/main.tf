# HireFit Platform - Azure Infrastructure
# Terraform configuration for the complete Azure deployment

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.85.0"
    }
    azuread = {
      source  = "hashicorp/azuread"
      version = "~> 2.47.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6.0"
    }
  }

  backend "azurerm" {
    # Configure in backend.tfvars or via environment variables
    # resource_group_name  = "hirefit-tfstate-rg"
    # storage_account_name = "hirefittfstate"
    # container_name       = "tfstate"
    # key                  = "hirefit.terraform.tfstate"
  }
}

provider "azurerm" {
  features {
    key_vault {
      purge_soft_delete_on_destroy    = false
      recover_soft_deleted_key_vaults = true
    }
    resource_group {
      prevent_deletion_if_contains_resources = false
    }
  }
}

provider "azuread" {}

# Data sources
data "azurerm_client_config" "current" {}

data "azuread_client_config" "current" {}

# Random suffix for globally unique names
resource "random_string" "suffix" {
  length  = 6
  lower   = true
  upper   = false
  special = false
  numeric = true
}

locals {
  resource_suffix = random_string.suffix.result
  common_tags = {
    Project     = "HireFit"
    Environment = var.environment
    ManagedBy   = "Terraform"
    Owner       = var.owner_email
  }
}

# Resource Group
resource "azurerm_resource_group" "main" {
  name     = "rg-hirefit-${var.environment}-${var.location_short}"
  location = var.location
  tags     = local.common_tags
}

# Virtual Network
module "network" {
  source = "./modules/network"

  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  environment         = var.environment
  address_space       = var.vnet_address_space
  tags                = local.common_tags
}

# Key Vault
module "keyvault" {
  source = "./modules/keyvault"

  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  environment         = var.environment
  resource_suffix     = local.resource_suffix
  tenant_id           = data.azurerm_client_config.current.tenant_id
  admin_object_ids    = var.keyvault_admin_object_ids
  subnet_id           = module.network.private_endpoints_subnet_id
  tags                = local.common_tags
}

# SQL Database
module "database" {
  source = "./modules/database"

  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  environment         = var.environment
  resource_suffix     = local.resource_suffix
  admin_login         = var.sql_admin_login
  admin_password      = var.sql_admin_password
  subnet_id           = module.network.private_endpoints_subnet_id
  key_vault_id        = module.keyvault.key_vault_id
  tags                = local.common_tags
}

# Storage Account
module "storage" {
  source = "./modules/storage"

  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  environment         = var.environment
  resource_suffix     = local.resource_suffix
  subnet_id           = module.network.private_endpoints_subnet_id
  key_vault_id        = module.keyvault.key_vault_id
  tags                = local.common_tags
}

# Redis Cache
module "redis" {
  source = "./modules/redis"

  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  environment         = var.environment
  resource_suffix     = local.resource_suffix
  subnet_id           = module.network.private_endpoints_subnet_id
  key_vault_id        = module.keyvault.key_vault_id
  sku                 = var.redis_sku
  tags                = local.common_tags
}

# Service Bus
module "servicebus" {
  source = "./modules/servicebus"

  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  environment         = var.environment
  resource_suffix     = local.resource_suffix
  subnet_id           = module.network.private_endpoints_subnet_id
  key_vault_id        = module.keyvault.key_vault_id
  sku                 = var.servicebus_sku
  tags                = local.common_tags
}

# Cognitive Search
module "search" {
  source = "./modules/search"

  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  environment         = var.environment
  resource_suffix     = local.resource_suffix
  sku                 = var.search_sku
  key_vault_id        = module.keyvault.key_vault_id
  tags                = local.common_tags
}

# Container Apps Environment
module "container_apps" {
  source = "./modules/container-apps"

  resource_group_name   = azurerm_resource_group.main.name
  location              = azurerm_resource_group.main.location
  environment           = var.environment
  resource_suffix       = local.resource_suffix
  subnet_id             = module.network.app_subnet_id
  log_analytics_workspace_id = module.monitoring.log_analytics_workspace_id
  tags                  = local.common_tags
}

# Monitoring
module "monitoring" {
  source = "./modules/monitoring"

  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  environment         = var.environment
  resource_suffix     = local.resource_suffix
  tags                = local.common_tags
}

# Front Door / CDN
module "frontdoor" {
  source = "./modules/frontdoor"

  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  environment         = var.environment
  resource_suffix     = local.resource_suffix
  backend_fqdn        = module.container_apps.api_fqdn
  tags                = local.common_tags
}


# Storage Account Module

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

variable "tags" {
  type = map(string)
}

resource "azurerm_storage_account" "main" {
  name                            = "sthirefit${var.environment}${var.resource_suffix}"
  resource_group_name             = var.resource_group_name
  location                        = var.location
  account_tier                    = "Standard"
  account_replication_type        = var.environment == "prod" ? "ZRS" : "LRS"
  account_kind                    = "StorageV2"
  min_tls_version                 = "TLS1_2"
  is_hns_enabled                  = true # Enable hierarchical namespace (Data Lake Gen2)
  allow_nested_items_to_be_public = false
  shared_access_key_enabled       = false

  network_rules {
    default_action = "Deny"
    bypass         = ["AzureServices"]
  }

  blob_properties {
    versioning_enabled = true
    
    delete_retention_policy {
      days = 30
    }

    container_delete_retention_policy {
      days = 30
    }
  }

  identity {
    type = "SystemAssigned"
  }

  tags = var.tags
}

# Containers
resource "azurerm_storage_container" "resumes" {
  name                  = "resumes"
  storage_account_name  = azurerm_storage_account.main.name
  container_access_type = "private"
}

resource "azurerm_storage_container" "documents" {
  name                  = "documents"
  storage_account_name  = azurerm_storage_account.main.name
  container_access_type = "private"
}

resource "azurerm_storage_container" "exports" {
  name                  = "exports"
  storage_account_name  = azurerm_storage_account.main.name
  container_access_type = "private"
}

# Private Endpoint
resource "azurerm_private_endpoint" "blob" {
  name                = "pe-st-blob-hirefit-${var.environment}"
  location            = var.location
  resource_group_name = var.resource_group_name
  subnet_id           = var.subnet_id

  private_service_connection {
    name                           = "psc-st-blob-hirefit"
    private_connection_resource_id = azurerm_storage_account.main.id
    subresource_names              = ["blob"]
    is_manual_connection           = false
  }

  tags = var.tags
}

# Lifecycle Management Policy
resource "azurerm_storage_management_policy" "lifecycle" {
  storage_account_id = azurerm_storage_account.main.id

  rule {
    name    = "move-exports-to-cool"
    enabled = true
    filters {
      blob_types   = ["blockBlob"]
      prefix_match = ["exports/"]
    }
    actions {
      base_blob {
        tier_to_cool_after_days_since_modification_greater_than    = 30
        tier_to_archive_after_days_since_modification_greater_than = 90
        delete_after_days_since_modification_greater_than          = 365
      }
    }
  }
}

output "storage_account_id" {
  value = azurerm_storage_account.main.id
}

output "storage_account_name" {
  value = azurerm_storage_account.main.name
}

output "primary_blob_endpoint" {
  value = azurerm_storage_account.main.primary_blob_endpoint
}


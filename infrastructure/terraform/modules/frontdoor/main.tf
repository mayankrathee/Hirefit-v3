# Front Door Module

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

variable "backend_fqdn" {
  type = string
}

variable "tags" {
  type = map(string)
}

# Front Door Profile
resource "azurerm_cdn_frontdoor_profile" "main" {
  name                = "afd-hirefit-${var.environment}-${var.resource_suffix}"
  resource_group_name = var.resource_group_name
  sku_name            = var.environment == "prod" ? "Premium_AzureFrontDoor" : "Standard_AzureFrontDoor"

  tags = var.tags
}

# Endpoint
resource "azurerm_cdn_frontdoor_endpoint" "main" {
  name                     = "fde-hirefit-${var.environment}"
  cdn_frontdoor_profile_id = azurerm_cdn_frontdoor_profile.main.id
}

# Origin Group
resource "azurerm_cdn_frontdoor_origin_group" "api" {
  name                     = "og-api"
  cdn_frontdoor_profile_id = azurerm_cdn_frontdoor_profile.main.id

  load_balancing {
    sample_size                 = 4
    successful_samples_required = 3
  }

  health_probe {
    path                = "/health"
    request_type        = "GET"
    protocol            = "Https"
    interval_in_seconds = 30
  }
}

# Origin
resource "azurerm_cdn_frontdoor_origin" "api" {
  name                          = "origin-api"
  cdn_frontdoor_origin_group_id = azurerm_cdn_frontdoor_origin_group.api.id

  enabled                        = true
  host_name                      = var.backend_fqdn
  http_port                      = 80
  https_port                     = 443
  origin_host_header             = var.backend_fqdn
  priority                       = 1
  weight                         = 1000
  certificate_name_check_enabled = true
}

# Route
resource "azurerm_cdn_frontdoor_route" "api" {
  name                          = "route-api"
  cdn_frontdoor_endpoint_id     = azurerm_cdn_frontdoor_endpoint.main.id
  cdn_frontdoor_origin_group_id = azurerm_cdn_frontdoor_origin_group.api.id
  cdn_frontdoor_origin_ids      = [azurerm_cdn_frontdoor_origin.api.id]

  supported_protocols    = ["Http", "Https"]
  patterns_to_match      = ["/*"]
  forwarding_protocol    = "HttpsOnly"
  link_to_default_domain = true
  https_redirect_enabled = true
}

# WAF Policy
resource "azurerm_cdn_frontdoor_firewall_policy" "main" {
  name                = "wafpolicyhirefit${var.environment}"
  resource_group_name = var.resource_group_name
  sku_name            = azurerm_cdn_frontdoor_profile.main.sku_name
  enabled             = true
  mode                = var.environment == "prod" ? "Prevention" : "Detection"

  managed_rule {
    type    = "DefaultRuleSet"
    version = "1.0"
    action  = "Block"
  }

  managed_rule {
    type    = "Microsoft_BotManagerRuleSet"
    version = "1.0"
    action  = "Block"
  }

  tags = var.tags
}

# Security Policy
resource "azurerm_cdn_frontdoor_security_policy" "main" {
  name                     = "secpolicy-hirefit-${var.environment}"
  cdn_frontdoor_profile_id = azurerm_cdn_frontdoor_profile.main.id

  security_policies {
    firewall {
      cdn_frontdoor_firewall_policy_id = azurerm_cdn_frontdoor_firewall_policy.main.id

      association {
        domain {
          cdn_frontdoor_domain_id = azurerm_cdn_frontdoor_endpoint.main.id
        }
        patterns_to_match = ["/*"]
      }
    }
  }
}

output "profile_id" {
  value = azurerm_cdn_frontdoor_profile.main.id
}

output "endpoint_id" {
  value = azurerm_cdn_frontdoor_endpoint.main.id
}

output "endpoint_url" {
  value = "https://${azurerm_cdn_frontdoor_endpoint.main.host_name}"
}


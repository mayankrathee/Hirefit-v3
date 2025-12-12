# Azure Blob Storage Design - HireFit Platform

## Overview

This document details the design for document storage in the HireFit platform using Azure Blob Storage with Data Lake Storage Gen2 capabilities (hierarchical namespace enabled).

---

## 1. Storage Account Configuration

### 1.1 Account Settings

```yaml
storage_account:
  name: hirefitstorage{env}
  kind: StorageV2
  sku: Standard_ZRS  # Zone-redundant for production
  access_tier: Hot
  hierarchical_namespace: true  # Data Lake Gen2
  minimum_tls_version: TLS1_2
  allow_blob_public_access: false
  allow_shared_key_access: false  # Force Azure AD auth
  default_to_oauth_authentication: true
  infrastructure_encryption: true
  
  network_rules:
    default_action: Deny
    bypass: ["AzureServices"]
    virtual_network_rules:
      - subnet_id: /subscriptions/{sub}/resourceGroups/{rg}/providers/Microsoft.Network/virtualNetworks/{vnet}/subnets/{subnet}
    ip_rules:
      - value: "office-ip-range"  # For development
```

### 1.2 Redundancy Options by Environment

| Environment | Redundancy | Rationale |
|-------------|------------|-----------|
| Development | LRS | Cost optimization |
| Staging | ZRS | Match production behavior |
| Production | ZRS | High availability within region |
| DR Region | GRS | Cross-region disaster recovery |

---

## 2. Container Structure

### 2.1 Container Hierarchy

```
hirefitstorage{env}
├── resumes/                          # Candidate resume storage
│   └── {tenant-id}/
│       └── {candidate-id}/
│           ├── original/
│           │   └── {filename}.{ext}
│           └── processed/
│               ├── parsed.json
│               └── thumbnail.png
│
├── job-profiles/                     # Job description documents
│   └── {tenant-id}/
│       └── {job-id}/
│           ├── description.pdf
│           └── requirements.json
│
├── evaluations/                      # Interview and evaluation artifacts
│   └── {tenant-id}/
│       └── {evaluation-id}/
│           ├── recordings/
│           │   └── {session-id}.webm
│           ├── notes/
│           │   └── {reviewer-id}.md
│           └── scorecard.json
│
├── exports/                          # Generated reports and exports
│   └── {tenant-id}/
│       └── {export-id}/
│           └── {filename}.{ext}
│
├── imports/                          # Bulk import staging
│   └── {tenant-id}/
│       └── {import-id}/
│           ├── pending/
│           ├── processing/
│           └── completed/
│
├── templates/                        # Document templates
│   └── {tenant-id}/
│       ├── offer-letters/
│       ├── interview-guides/
│       └── email-templates/
│
└── system/                           # System-level storage
    ├── schemas/
    ├── ml-models/
    └── audit-archives/
```

### 2.2 Container Configuration

```typescript
// Container definitions
const containers = [
  {
    name: 'resumes',
    publicAccess: 'None',
    metadata: { category: 'candidate-documents', retention: 'policy-driven' },
    defaultEncryptionScope: 'candidate-data-scope'
  },
  {
    name: 'job-profiles',
    publicAccess: 'None',
    metadata: { category: 'job-documents', retention: '7-years' }
  },
  {
    name: 'evaluations',
    publicAccess: 'None',
    metadata: { category: 'evaluation-artifacts', retention: 'policy-driven' }
  },
  {
    name: 'exports',
    publicAccess: 'None',
    metadata: { category: 'generated-exports', retention: '90-days' }
  },
  {
    name: 'imports',
    publicAccess: 'None',
    metadata: { category: 'import-staging', retention: '30-days' }
  },
  {
    name: 'templates',
    publicAccess: 'None',
    metadata: { category: 'document-templates', retention: 'indefinite' }
  },
  {
    name: 'system',
    publicAccess: 'None',
    metadata: { category: 'system-files', retention: 'indefinite' }
  }
];
```

---

## 3. Naming Conventions

### 3.1 Path Structure

```
{container}/{tenant-id}/{entity-id}/{category}/{filename}
```

### 3.2 Filename Conventions

| Document Type | Pattern | Example |
|--------------|---------|---------|
| Original Resume | `{uuid}_original.{ext}` | `a1b2c3d4_original.pdf` |
| Parsed Resume | `{uuid}_parsed.json` | `a1b2c3d4_parsed.json` |
| Recording | `{session-id}_{timestamp}.webm` | `sess123_20240115T103045Z.webm` |
| Export | `{export-type}_{date}_{uuid}.{ext}` | `candidates_20240115_x1y2z3.xlsx` |

### 3.3 Metadata Standards

```typescript
interface BlobMetadata {
  // Required for all blobs
  tenantId: string;
  uploadedBy: string;
  uploadedAt: string;  // ISO 8601
  contentCategory: string;
  
  // Document-specific
  originalFilename?: string;
  documentType?: string;
  candidateId?: string;
  jobId?: string;
  
  // Processing metadata
  processingStatus?: 'pending' | 'processing' | 'completed' | 'failed';
  processedAt?: string;
  
  // Compliance
  retentionPolicy?: string;
  piiLevel?: 'none' | 'low' | 'medium' | 'high';
  encryptionScope?: string;
}
```

---

## 4. Access Control

### 4.1 RBAC Roles

| Role | Scope | Permissions |
|------|-------|-------------|
| Storage Blob Data Owner | Storage Account | Full control (admin only) |
| Storage Blob Data Contributor | Container | Read, write, delete |
| Storage Blob Data Reader | Container | Read only |
| Storage Blob Delegator | Storage Account | Generate user delegation SAS |

### 4.2 Access Control Lists (ACL)

```typescript
// Tenant-level ACL configuration
const tenantAcl = {
  // Tenant admin - full access to tenant folder
  tenantAdmin: {
    permissions: 'rwx',  // read, write, execute
    scope: '/{container}/{tenant-id}',
    recursive: true
  },
  
  // Recruiter - read/write to resumes and evaluations
  recruiter: {
    permissions: 'rw-',
    scope: ['/{container}/{tenant-id}/resumes', '/{container}/{tenant-id}/evaluations'],
    recursive: true
  },
  
  // Hiring manager - read access
  hiringManager: {
    permissions: 'r--',
    scope: '/{container}/{tenant-id}',
    recursive: true
  },
  
  // System service - full access for processing
  systemService: {
    permissions: 'rwx',
    scope: '/{container}',
    recursive: true
  }
};
```

### 4.3 SAS Token Generation

```typescript
// SAS token configuration for different use cases
interface SasTokenConfig {
  // Resume upload (candidate or recruiter)
  resumeUpload: {
    permissions: 'cw',  // create, write
    expiresIn: '15m',
    contentType: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    maxSize: '10MB'
  };
  
  // Resume download (authenticated user)
  resumeDownload: {
    permissions: 'r',
    expiresIn: '1h',
    ipRange?: string  // Optional IP restriction
  };
  
  // Bulk export download
  exportDownload: {
    permissions: 'r',
    expiresIn: '24h',
    singleUse: true  // Invalidate after first use
  };
  
  // Recording upload (interview system)
  recordingUpload: {
    permissions: 'cw',
    expiresIn: '2h',
    contentType: ['video/webm', 'audio/webm'],
    maxSize: '500MB'
  };
}

// SAS generation function
async function generateSasToken(
  blobPath: string,
  config: SasTokenConfig,
  userContext: UserContext
): Promise<string> {
  // Validate tenant access
  if (!canAccessTenant(userContext, extractTenantId(blobPath))) {
    throw new ForbiddenException('Tenant access denied');
  }
  
  // Generate user delegation key
  const delegationKey = await blobServiceClient.getUserDelegationKey(
    new Date(),
    new Date(Date.now() + parseExpiry(config.expiresIn))
  );
  
  // Create SAS token
  const sasToken = generateBlobSASQueryParameters({
    containerName: extractContainer(blobPath),
    blobName: extractBlobName(blobPath),
    permissions: BlobSASPermissions.parse(config.permissions),
    expiresOn: new Date(Date.now() + parseExpiry(config.expiresIn)),
    ipRange: config.ipRange ? SasIPRange.parse(config.ipRange) : undefined,
    contentType: config.contentType?.[0],
  }, delegationKey, accountName);
  
  return sasToken.toString();
}
```

---

## 5. Security Configuration

### 5.1 Encryption

```yaml
encryption:
  # Storage account level
  storage_encryption:
    services:
      blob:
        enabled: true
        key_type: Account
      file:
        enabled: true
        key_type: Account
    key_source: Microsoft.Keyvault
    key_vault_properties:
      key_vault_uri: https://hirefit-keyvault.vault.azure.net/
      key_name: storage-encryption-key
      key_version: null  # Use latest
  
  # Infrastructure encryption (double encryption)
  require_infrastructure_encryption: true
  
  # Encryption scopes for different data classifications
  encryption_scopes:
    - name: candidate-data-scope
      source: Microsoft.KeyVault
      key_vault_key_id: https://hirefit-keyvault.vault.azure.net/keys/candidate-data-key
      infrastructure_encryption: enabled
    
    - name: evaluation-data-scope
      source: Microsoft.KeyVault
      key_vault_key_id: https://hirefit-keyvault.vault.azure.net/keys/evaluation-data-key
      infrastructure_encryption: enabled
```

### 5.2 Network Security

```yaml
network_security:
  # Private endpoints
  private_endpoints:
    - name: storage-pe-blob
      subnet_id: /subscriptions/{sub}/resourceGroups/{rg}/providers/Microsoft.Network/virtualNetworks/{vnet}/subnets/private-endpoints
      private_dns_zone_id: /subscriptions/{sub}/resourceGroups/{rg}/providers/Microsoft.Network/privateDnsZones/privatelink.blob.core.windows.net
      group_id: blob
    
    - name: storage-pe-dfs
      subnet_id: /subscriptions/{sub}/resourceGroups/{rg}/providers/Microsoft.Network/virtualNetworks/{vnet}/subnets/private-endpoints
      private_dns_zone_id: /subscriptions/{sub}/resourceGroups/{rg}/providers/Microsoft.Network/privateDnsZones/privatelink.dfs.core.windows.net
      group_id: dfs
  
  # Firewall rules
  firewall:
    default_action: Deny
    ip_rules:
      - name: azure-devops
        value: "13.107.6.0/24"
    virtual_network_rules:
      - subnet_id: /subscriptions/{sub}/resourceGroups/{rg}/providers/Microsoft.Network/virtualNetworks/{vnet}/subnets/app-subnet
```

### 5.3 Azure Defender for Storage

```yaml
defender_for_storage:
  enabled: true
  
  malware_scanning:
    on_upload:
      enabled: true
      cap_gb_per_month: 5000
    
  sensitive_data_discovery:
    enabled: true
    
  alerts:
    - Access from a Tor exit node
    - Access from an unusual location
    - Anonymous access to a container
    - Unusual amount of data extracted
    - Unusual change in access permissions
```

---

## 6. Lifecycle Management

### 6.1 Lifecycle Policies

```json
{
  "rules": [
    {
      "name": "move-exports-to-cool",
      "enabled": true,
      "type": "Lifecycle",
      "definition": {
        "filters": {
          "blobTypes": ["blockBlob"],
          "prefixMatch": ["exports/"]
        },
        "actions": {
          "baseBlob": {
            "tierToCool": {
              "daysAfterModificationGreaterThan": 30
            },
            "tierToArchive": {
              "daysAfterModificationGreaterThan": 90
            },
            "delete": {
              "daysAfterModificationGreaterThan": 365
            }
          }
        }
      }
    },
    {
      "name": "delete-import-staging",
      "enabled": true,
      "type": "Lifecycle",
      "definition": {
        "filters": {
          "blobTypes": ["blockBlob"],
          "prefixMatch": ["imports/"]
        },
        "actions": {
          "baseBlob": {
            "delete": {
              "daysAfterModificationGreaterThan": 30
            }
          }
        }
      }
    },
    {
      "name": "archive-old-evaluations",
      "enabled": true,
      "type": "Lifecycle",
      "definition": {
        "filters": {
          "blobTypes": ["blockBlob"],
          "prefixMatch": ["evaluations/"],
          "blobIndexMatch": [
            {
              "name": "processingStatus",
              "op": "==",
              "value": "completed"
            }
          ]
        },
        "actions": {
          "baseBlob": {
            "tierToCool": {
              "daysAfterModificationGreaterThan": 180
            },
            "tierToArchive": {
              "daysAfterModificationGreaterThan": 365
            }
          }
        }
      }
    },
    {
      "name": "cleanup-deleted-blobs",
      "enabled": true,
      "type": "Lifecycle",
      "definition": {
        "filters": {
          "blobTypes": ["blockBlob"]
        },
        "actions": {
          "snapshot": {
            "delete": {
              "daysAfterCreationGreaterThan": 90
            }
          },
          "version": {
            "delete": {
              "daysAfterCreationGreaterThan": 90
            }
          }
        }
      }
    }
  ]
}
```

### 6.2 Retention Policies by Document Type

| Document Type | Hot Tier | Cool Tier | Archive | Delete |
|--------------|----------|-----------|---------|--------|
| Active Candidate Resumes | Indefinite | - | - | Policy-driven |
| Rejected Candidate Resumes | 30 days | 60 days | 2 years | 7 years |
| Job Profiles | Duration + 90 days | 1 year | - | 7 years |
| Interview Recordings | 90 days | 1 year | 3 years | 7 years |
| Evaluation Notes | Duration + 180 days | 1 year | - | 7 years |
| Exports | 30 days | 90 days | - | 1 year |
| Import Staging | 7 days | - | - | 30 days |

### 6.3 Data Deletion Workflow

```typescript
// Soft delete configuration
const softDeleteConfig = {
  blobSoftDelete: {
    enabled: true,
    retentionDays: 30
  },
  containerSoftDelete: {
    enabled: true,
    retentionDays: 30
  },
  blobVersioning: {
    enabled: true
  }
};

// GDPR deletion request handling
async function handleDataDeletionRequest(
  tenantId: string,
  candidateId: string,
  requestId: string
): Promise<DeletionResult> {
  const audit = new AuditTrail(requestId);
  
  // Find all blobs for candidate
  const blobs = await findBlobsByCandidate(tenantId, candidateId);
  
  // Log deletion request
  await audit.log('deletion_initiated', {
    candidateId,
    blobCount: blobs.length,
    requestedBy: getCurrentUser()
  });
  
  // Soft delete all blobs
  for (const blob of blobs) {
    await deleteBlob(blob.path, { softDelete: true });
    await audit.log('blob_deleted', { path: blob.path });
  }
  
  // Update database records
  await markCandidateDeleted(candidateId);
  
  // Schedule permanent deletion after retention period
  await schedulePermanentDeletion(tenantId, candidateId, 30);
  
  return {
    requestId,
    status: 'completed',
    deletedBlobs: blobs.length,
    permanentDeletionDate: addDays(new Date(), 30)
  };
}
```

---

## 7. Performance Optimization

### 7.1 CDN Configuration

```yaml
cdn_profile:
  name: hirefit-cdn
  sku: Standard_Microsoft
  
  endpoints:
    - name: documents
      origin:
        name: storage
        host_name: hirefitstorage.blob.core.windows.net
      origin_path: /public-assets
      
      caching_rules:
        - name: cache-static-assets
          match_conditions:
            - url_path:
                operator: BeginsWith
                value: /templates/
          action:
            cache_behavior: Override
            cache_duration: "7.00:00:00"
        
        - name: no-cache-user-content
          match_conditions:
            - url_path:
                operator: BeginsWith
                value: /resumes/
          action:
            cache_behavior: BypassCache
```

### 7.2 Upload Optimization

```typescript
// Chunked upload configuration
const uploadConfig = {
  // Single upload threshold
  singleUploadThreshold: 4 * 1024 * 1024,  // 4 MB
  
  // Block size for chunked uploads
  blockSize: 4 * 1024 * 1024,  // 4 MB blocks
  
  // Concurrent uploads
  maxConcurrency: 4,
  
  // Transfer options
  transferOptions: {
    maxRetries: 3,
    retryDelayMs: 1000,
    retryDelayMultiplier: 2
  }
};

// Upload with progress tracking
async function uploadResume(
  file: Buffer,
  path: string,
  metadata: BlobMetadata,
  onProgress: (progress: number) => void
): Promise<UploadResult> {
  const blockBlobClient = containerClient.getBlockBlobClient(path);
  
  const options: BlockBlobParallelUploadOptions = {
    blockSize: uploadConfig.blockSize,
    concurrency: uploadConfig.maxConcurrency,
    metadata: metadata as Record<string, string>,
    onProgress: (ev) => onProgress(ev.loadedBytes / file.length * 100),
    blobHTTPHeaders: {
      blobContentType: detectContentType(file),
      blobContentDisposition: `attachment; filename="${metadata.originalFilename}"`
    },
    tier: 'Hot'
  };
  
  const response = await blockBlobClient.uploadData(file, options);
  
  return {
    path,
    etag: response.etag,
    url: blockBlobClient.url,
    size: file.length
  };
}
```

### 7.3 Download Optimization

```typescript
// Streaming download for large files
async function streamDownload(
  path: string,
  range?: { start: number; end: number }
): Promise<NodeJS.ReadableStream> {
  const blobClient = containerClient.getBlobClient(path);
  
  const downloadOptions: BlobDownloadOptions = {
    rangeGetContentMD5: true,
    conditions: {
      // Only download if not modified (for caching)
      ifNoneMatch: getCachedEtag(path)
    }
  };
  
  if (range) {
    downloadOptions.offset = range.start;
    downloadOptions.count = range.end - range.start + 1;
  }
  
  const response = await blobClient.download(0, undefined, downloadOptions);
  return response.readableStreamBody!;
}
```

---

## 8. Monitoring & Alerting

### 8.1 Metrics to Monitor

| Metric | Threshold | Alert Severity |
|--------|-----------|----------------|
| Storage Capacity | > 80% of quota | Warning |
| Transaction Errors | > 1% error rate | Critical |
| Latency (E2E) | > 200ms P95 | Warning |
| Egress | > 80% of budget | Warning |
| Failed Uploads | > 5 per hour | Warning |
| Malware Detected | Any | Critical |

### 8.2 Diagnostic Settings

```yaml
diagnostic_settings:
  name: storage-diagnostics
  
  logs:
    - category: StorageRead
      enabled: true
    - category: StorageWrite
      enabled: true
    - category: StorageDelete
      enabled: true
  
  metrics:
    - category: Transaction
      enabled: true
    - category: Capacity
      enabled: true
  
  destinations:
    log_analytics_workspace_id: /subscriptions/{sub}/resourceGroups/{rg}/providers/Microsoft.OperationalInsights/workspaces/hirefit-logs
    storage_account_id: /subscriptions/{sub}/resourceGroups/{rg}/providers/Microsoft.Storage/storageAccounts/hirefitauditlogs
```

### 8.3 Alert Rules

```yaml
alert_rules:
  - name: high-error-rate
    description: Storage transaction error rate above threshold
    query: |
      StorageBlobLogs
      | where TimeGenerated > ago(5m)
      | summarize 
          total = count(),
          errors = countif(StatusCode >= 400)
          by bin(TimeGenerated, 1m)
      | extend error_rate = errors * 100.0 / total
      | where error_rate > 1
    severity: 1
    frequency: PT5M
    window: PT5M
    
  - name: malware-detected
    description: Azure Defender detected malware in uploaded file
    query: |
      SecurityAlert
      | where AlertType == "SIMULATED_Malware_Scanning_Detected_Malware"
      | where ResourceType == "Storage"
    severity: 0
    frequency: PT1M
    window: PT1M
```

---

## 9. Infrastructure as Code

### 9.1 Terraform Configuration

```hcl
# storage.tf
resource "azurerm_storage_account" "hirefit" {
  name                     = "hirefit${var.environment}"
  resource_group_name      = azurerm_resource_group.main.name
  location                 = azurerm_resource_group.main.location
  account_tier             = "Standard"
  account_replication_type = var.environment == "prod" ? "ZRS" : "LRS"
  account_kind             = "StorageV2"
  
  is_hns_enabled           = true  # Data Lake Gen2
  min_tls_version          = "TLS1_2"
  
  allow_nested_items_to_be_public = false
  shared_access_key_enabled       = false
  default_to_oauth_authentication = true
  
  infrastructure_encryption_enabled = true
  
  network_rules {
    default_action             = "Deny"
    bypass                     = ["AzureServices"]
    virtual_network_subnet_ids = [azurerm_subnet.app.id]
  }
  
  identity {
    type = "SystemAssigned"
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
  
  tags = var.common_tags
}

resource "azurerm_storage_container" "containers" {
  for_each = toset(["resumes", "job-profiles", "evaluations", "exports", "imports", "templates", "system"])
  
  name                  = each.key
  storage_account_name  = azurerm_storage_account.hirefit.name
  container_access_type = "private"
}

resource "azurerm_storage_management_policy" "lifecycle" {
  storage_account_id = azurerm_storage_account.hirefit.id
  
  rule {
    name    = "move-exports-to-cool"
    enabled = true
    
    filters {
      prefix_match = ["exports/"]
      blob_types   = ["blockBlob"]
    }
    
    actions {
      base_blob {
        tier_to_cool_after_days_since_modification_greater_than    = 30
        tier_to_archive_after_days_since_modification_greater_than = 90
        delete_after_days_since_modification_greater_than          = 365
      }
    }
  }
  
  rule {
    name    = "delete-import-staging"
    enabled = true
    
    filters {
      prefix_match = ["imports/"]
      blob_types   = ["blockBlob"]
    }
    
    actions {
      base_blob {
        delete_after_days_since_modification_greater_than = 30
      }
    }
  }
}
```

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-01-XX | HireFit Team | Initial design |

**Review Schedule**: Quarterly or when storage requirements change


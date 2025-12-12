# Enterprise Security Plan - HireFit Platform

## Overview

This document details the enterprise-grade security controls, identity and access management (IAM), observability strategy, and compliance roadmap for the HireFit talent acquisition platform.

---

## 1. Security Architecture

### 1.1 Defense in Depth

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              PERIMETER SECURITY                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │    Azure Front Door + WAF (DDoS, OWASP Top 10, Bot Protection)          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              NETWORK SECURITY                                    │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐    │
│  │  Azure VNet   │  │    NSGs       │  │   Private     │  │  Azure        │    │
│  │  Isolation    │  │  (Subnets)    │  │   Endpoints   │  │  Firewall     │    │
│  └───────────────┘  └───────────────┘  └───────────────┘  └───────────────┘    │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              IDENTITY & ACCESS                                   │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐    │
│  │   Azure AD    │  │  Conditional  │  │     MFA       │  │   RBAC/       │    │
│  │   (Entra)     │  │    Access     │  │   Enforced    │  │    ABAC       │    │
│  └───────────────┘  └───────────────┘  └───────────────┘  └───────────────┘    │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              APPLICATION SECURITY                                │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐    │
│  │   Input       │  │   API Rate    │  │   CORS        │  │   Content     │    │
│  │  Validation   │  │   Limiting    │  │   Policy      │  │    Security   │    │
│  └───────────────┘  └───────────────┘  └───────────────┘  └───────────────┘    │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                DATA SECURITY                                     │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐    │
│  │  Encryption   │  │   Key Vault   │  │  Row-Level    │  │   Data        │    │
│  │  (TLS/AES)    │  │   (CMK)       │  │   Security    │  │   Masking     │    │
│  └───────────────┘  └───────────────┘  └───────────────┘  └───────────────┘    │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Security Domains

| Domain | Controls | Azure Services |
|--------|----------|----------------|
| Perimeter | DDoS, WAF, Bot Protection | Azure Front Door, Azure WAF |
| Network | Segmentation, Firewalls, Private Links | VNet, NSG, Azure Firewall, Private Endpoints |
| Identity | Authentication, Authorization, MFA | Azure AD, Conditional Access, PIM |
| Application | Input Validation, Rate Limiting, CORS | API Management, App Code |
| Data | Encryption, Access Control, Masking | Key Vault, TDE, Always Encrypted |
| Operations | Logging, Monitoring, Incident Response | Azure Monitor, Sentinel, Defender |

---

## 2. Identity & Access Management

### 2.1 Authentication Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           AUTHENTICATION FLOWS                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Internal Users (Enterprise SSO)                                                │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐                  │
│  │  User    │───▶│  SAML/   │───▶│  Azure   │───▶│  HireFit │                  │
│  │          │    │  OIDC    │    │    AD    │    │  App     │                  │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘                  │
│                                                                                  │
│  External Users (B2C)                                                           │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐                  │
│  │  User    │───▶│  Azure   │───▶│  Email/  │───▶│  HireFit │                  │
│  │          │    │  AD B2C  │    │  Social  │    │  App     │                  │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘                  │
│                                                                                  │
│  Service-to-Service                                                             │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐                  │
│  │  Service │───▶│ Managed  │───▶│  Azure   │───▶│  Target  │                  │
│  │          │    │ Identity │    │    AD    │    │  Service │                  │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘                  │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Authentication Requirements

| Requirement | Implementation | Notes |
|-------------|----------------|-------|
| Multi-Factor Authentication | Azure AD MFA | Required for all users |
| Single Sign-On | SAML 2.0, OIDC | Enterprise customers |
| Password Policy | Azure AD Policy | 12+ chars, complexity, rotation |
| Session Management | JWT with refresh | 1hr access, 24hr refresh |
| Passwordless | FIDO2, Authenticator | Optional for enhanced security |
| Account Lockout | 5 failed attempts | 15-minute lockout |

### 2.3 Azure AD Configuration

```yaml
azure_ad_configuration:
  # Application registration
  application:
    name: HireFit Platform
    sign_in_audience: AzureADMultipleOrgs  # Multi-tenant
    redirect_uris:
      - https://app.hirefit.io/auth/callback
      - https://app.hirefit.io/auth/silent-callback
    id_tokens: true
    access_tokens: true
    
  # API permissions
  api_permissions:
    - resource: Microsoft Graph
      permissions:
        - User.Read
        - User.ReadBasic.All
        - Calendars.ReadWrite
        - Mail.Send
    
  # Conditional access policies
  conditional_access:
    - name: Require MFA for All Users
      conditions:
        users: All
        applications: HireFit Platform
      grant_controls:
        - MFA required
        
    - name: Block Legacy Authentication
      conditions:
        client_apps: [Exchange ActiveSync, Other clients]
      access: Block
      
    - name: Require Compliant Device for Admin
      conditions:
        users: Admin role
        applications: HireFit Platform
      grant_controls:
        - Compliant device required
        - MFA required
```

### 2.4 Role-Based Access Control (RBAC)

#### Platform Roles

| Role | Description | Permissions |
|------|-------------|-------------|
| System Admin | Platform-wide administration | Full access all tenants |
| Tenant Admin | Organization administration | Full access own tenant |
| HR Admin | HR system management | User management, settings, compliance |
| Recruiter | Full recruitment access | Jobs, candidates, evaluations |
| Hiring Manager | Team hiring access | Own jobs, assigned candidates |
| Interviewer | Interview participation | Assigned interviews, evaluations |
| Viewer | Read-only access | View jobs, candidates |

#### Permission Matrix

```typescript
interface Permission {
  resource: string;
  actions: ('create' | 'read' | 'update' | 'delete' | 'manage')[];
  scope: 'all' | 'team' | 'own';
}

const rolePermissions: Record<string, Permission[]> = {
  tenant_admin: [
    { resource: 'users', actions: ['create', 'read', 'update', 'delete', 'manage'], scope: 'all' },
    { resource: 'settings', actions: ['read', 'update', 'manage'], scope: 'all' },
    { resource: 'jobs', actions: ['create', 'read', 'update', 'delete'], scope: 'all' },
    { resource: 'candidates', actions: ['create', 'read', 'update', 'delete'], scope: 'all' },
    { resource: 'evaluations', actions: ['read', 'manage'], scope: 'all' },
    { resource: 'billing', actions: ['read', 'update', 'manage'], scope: 'all' },
    { resource: 'audit_logs', actions: ['read'], scope: 'all' },
  ],
  
  recruiter: [
    { resource: 'jobs', actions: ['create', 'read', 'update'], scope: 'all' },
    { resource: 'candidates', actions: ['create', 'read', 'update'], scope: 'all' },
    { resource: 'evaluations', actions: ['create', 'read', 'update'], scope: 'all' },
    { resource: 'interviews', actions: ['create', 'read', 'update'], scope: 'all' },
    { resource: 'reports', actions: ['read'], scope: 'all' },
  ],
  
  hiring_manager: [
    { resource: 'jobs', actions: ['create', 'read', 'update'], scope: 'own' },
    { resource: 'candidates', actions: ['read', 'update'], scope: 'team' },
    { resource: 'evaluations', actions: ['create', 'read'], scope: 'team' },
    { resource: 'interviews', actions: ['read'], scope: 'team' },
    { resource: 'decisions', actions: ['create', 'read'], scope: 'team' },
  ],
  
  interviewer: [
    { resource: 'candidates', actions: ['read'], scope: 'own' },
    { resource: 'evaluations', actions: ['create', 'read', 'update'], scope: 'own' },
    { resource: 'interviews', actions: ['read'], scope: 'own' },
    { resource: 'questions', actions: ['read'], scope: 'all' },
  ],
};
```

### 2.5 Attribute-Based Access Control (ABAC)

```typescript
interface AccessPolicy {
  name: string;
  effect: 'allow' | 'deny';
  conditions: {
    subject: SubjectCondition;
    resource: ResourceCondition;
    action: string[];
    environment?: EnvironmentCondition;
  };
}

// Example policies
const policies: AccessPolicy[] = [
  {
    name: 'Hiring managers can only access their team candidates',
    effect: 'allow',
    conditions: {
      subject: { role: 'hiring_manager' },
      resource: { type: 'candidate', attribute: 'teamId', matchSubject: 'teamId' },
      action: ['read', 'update'],
    },
  },
  {
    name: 'Block access outside business hours for contractors',
    effect: 'deny',
    conditions: {
      subject: { employmentType: 'contractor' },
      resource: { type: '*' },
      action: ['*'],
      environment: { timeOfDay: { notBetween: ['09:00', '18:00'] } },
    },
  },
  {
    name: 'PII access requires explicit grant',
    effect: 'deny',
    conditions: {
      subject: { hasAttribute: { 'pii_access': false } },
      resource: { classification: 'pii' },
      action: ['read'],
    },
  },
];
```

---

## 3. Network Security

### 3.1 Network Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              AZURE REGION                                        │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │                           VIRTUAL NETWORK (10.0.0.0/16)                    │  │
│  │  ┌─────────────────────────────────────────────────────────────────────┐  │  │
│  │  │  PUBLIC SUBNET (10.0.1.0/24)                                        │  │  │
│  │  │  ┌─────────────┐  ┌─────────────┐                                   │  │  │
│  │  │  │  Azure      │  │   API       │                                   │  │  │
│  │  │  │  Front Door │  │  Management │                                   │  │  │
│  │  │  └─────────────┘  └─────────────┘                                   │  │  │
│  │  └─────────────────────────────────────────────────────────────────────┘  │  │
│  │                                    │                                       │  │
│  │  ┌─────────────────────────────────────────────────────────────────────┐  │  │
│  │  │  APP SUBNET (10.0.2.0/24) - NSG: Allow 443 from Front Door          │  │  │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                  │  │  │
│  │  │  │  Container  │  │  Container  │  │  Container  │                  │  │  │
│  │  │  │  App (API)  │  │  App (API)  │  │  App (Worker)│                 │  │  │
│  │  │  └─────────────┘  └─────────────┘  └─────────────┘                  │  │  │
│  │  └─────────────────────────────────────────────────────────────────────┘  │  │
│  │                                    │                                       │  │
│  │  ┌─────────────────────────────────────────────────────────────────────┐  │  │
│  │  │  DATA SUBNET (10.0.3.0/24) - NSG: Allow from App Subnet only        │  │  │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                  │  │  │
│  │  │  │   Private   │  │   Private   │  │   Private   │                  │  │  │
│  │  │  │  Endpoint   │  │  Endpoint   │  │  Endpoint   │                  │  │  │
│  │  │  │  (SQL)      │  │  (Storage)  │  │  (Redis)    │                  │  │  │
│  │  │  └─────────────┘  └─────────────┘  └─────────────┘                  │  │  │
│  │  └─────────────────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Network Security Groups (NSG)

```yaml
nsg_rules:
  app_subnet:
    inbound:
      - name: AllowFrontDoor
        priority: 100
        source: AzureFrontDoor.Backend
        destination: VirtualNetwork
        port: 443
        protocol: TCP
        action: Allow
        
      - name: DenyAllInbound
        priority: 4096
        source: "*"
        destination: "*"
        port: "*"
        action: Deny
        
    outbound:
      - name: AllowDataSubnet
        priority: 100
        source: VirtualNetwork
        destination: 10.0.3.0/24
        port: [1433, 6380, 443]
        action: Allow
        
      - name: AllowAzureServices
        priority: 200
        source: VirtualNetwork
        destination: AzureCloud
        port: 443
        action: Allow
        
  data_subnet:
    inbound:
      - name: AllowAppSubnet
        priority: 100
        source: 10.0.2.0/24
        destination: VirtualNetwork
        port: [1433, 6380, 443]
        action: Allow
        
      - name: DenyAllInbound
        priority: 4096
        source: "*"
        destination: "*"
        port: "*"
        action: Deny
```

### 3.3 Web Application Firewall (WAF)

```yaml
waf_policy:
  mode: Prevention
  
  managed_rule_sets:
    - type: OWASP
      version: "3.2"
    - type: Microsoft_BotManagerRuleSet
      version: "1.0"
      
  custom_rules:
    - name: BlockSuspiciousUserAgents
      priority: 1
      match_conditions:
        - variable: RequestHeaders
          selector: User-Agent
          operator: Contains
          values: ["sqlmap", "nikto", "nessus", "scanner"]
      action: Block
      
    - name: RateLimitByIP
      priority: 2
      match_conditions:
        - variable: RemoteAddr
          operator: IPMatch
          values: ["0.0.0.0/0"]
      rate_limit:
        threshold: 1000
        duration: 60
      action: Block
      
    - name: GeoBlock
      priority: 3
      match_conditions:
        - variable: RemoteAddr
          operator: GeoMatch
          values: ["KP", "IR", "SY", "CU"]  # Sanctioned countries
      action: Block
```

---

## 4. Data Security

### 4.1 Encryption Strategy

| Data State | Method | Key Management |
|------------|--------|----------------|
| At Rest (SQL) | TDE + Always Encrypted | Azure Key Vault (CMK) |
| At Rest (Blob) | AES-256 | Azure Key Vault (CMK) |
| At Rest (Redis) | Encryption at rest | Azure-managed |
| In Transit | TLS 1.3 | Azure-managed certs |
| In Use | Always Encrypted (sensitive columns) | Column master keys in Key Vault |

### 4.2 Always Encrypted Configuration

```sql
-- Columns encrypted with Always Encrypted
-- These columns are encrypted client-side and stored as ciphertext

-- Candidate PII
ALTER TABLE candidates
ADD 
    ssn_encrypted VARBINARY(8000) 
        ENCRYPTED WITH (
            COLUMN_ENCRYPTION_KEY = CEK_Candidates,
            ENCRYPTION_TYPE = DETERMINISTIC,
            ALGORITHM = 'AEAD_AES_256_CBC_HMAC_SHA_256'
        ),
    date_of_birth_encrypted VARBINARY(8000)
        ENCRYPTED WITH (
            COLUMN_ENCRYPTION_KEY = CEK_Candidates,
            ENCRYPTION_TYPE = RANDOMIZED,
            ALGORITHM = 'AEAD_AES_256_CBC_HMAC_SHA_256'
        );

-- Salary information
ALTER TABLE compensation
ADD
    salary_encrypted VARBINARY(8000)
        ENCRYPTED WITH (
            COLUMN_ENCRYPTION_KEY = CEK_Compensation,
            ENCRYPTION_TYPE = RANDOMIZED,
            ALGORITHM = 'AEAD_AES_256_CBC_HMAC_SHA_256'
        );
```

### 4.3 Key Vault Configuration

```yaml
key_vault:
  name: hirefit-keyvault-prod
  sku: Premium  # HSM-backed
  
  access_policies:
    - tenant_id: {tenant}
      object_id: {app_service_principal}
      permissions:
        keys: [get, unwrapKey, wrapKey]
        secrets: [get]
        
    - tenant_id: {tenant}
      object_id: {security_admin_group}
      permissions:
        keys: [all]
        secrets: [all]
        certificates: [all]
        
  network_acls:
    default_action: Deny
    bypass: AzureServices
    virtual_network_rules:
      - subnet_id: /subscriptions/.../subnets/app-subnet
      
  keys:
    - name: sql-tde-key
      type: RSA
      size: 2048
      operations: [encrypt, decrypt, wrapKey, unwrapKey]
      
    - name: storage-encryption-key
      type: RSA
      size: 2048
      operations: [encrypt, decrypt, wrapKey, unwrapKey]
      
    - name: column-master-key-candidates
      type: RSA
      size: 2048
      operations: [encrypt, decrypt, sign, verify]
      
  secrets:
    - name: db-connection-string
      content_type: connection-string
      expiration: 90 days
      rotation: enabled
      
    - name: stripe-api-key
      content_type: api-key
      expiration: 365 days
      
    - name: openai-api-key
      content_type: api-key
      expiration: 365 days
```

### 4.4 Data Classification

| Classification | Description | Encryption | Access | Retention |
|----------------|-------------|------------|--------|-----------|
| Public | Non-sensitive | TLS | Any authenticated | Standard |
| Internal | Business data | TLS + TDE | Role-based | Standard |
| Confidential | Sensitive business | TLS + TDE + CMK | Need-to-know | Policy-driven |
| Restricted | PII, financial | Always Encrypted | Explicit grant | Compliance-driven |

### 4.5 Data Masking

```typescript
// Dynamic data masking rules
const maskingRules = {
  candidate: {
    email: {
      type: 'partial',
      show: 3,
      mask: '***',
      suffix: '@domain.com',
      roles: ['recruiter', 'hiring_manager'],  // Can see full
    },
    phone: {
      type: 'partial',
      showLast: 4,
      mask: '***-***-',
      roles: ['recruiter'],
    },
    ssn: {
      type: 'full',
      mask: '***-**-****',
      roles: [],  // No one sees in UI
    },
    salary_expectation: {
      type: 'range',
      ranges: [[0, 50000], [50000, 100000], [100000, 150000], [150000, Infinity]],
      roles: ['hr_admin', 'recruiter'],
    },
  },
};

// Masking middleware
function applyMasking(data: any, schema: string, userRoles: string[]): any {
  const rules = maskingRules[schema];
  if (!rules) return data;
  
  const masked = { ...data };
  for (const [field, rule] of Object.entries(rules)) {
    if (rule.roles.some(r => userRoles.includes(r))) continue;
    masked[field] = maskValue(data[field], rule);
  }
  return masked;
}
```

---

## 5. Application Security

### 5.1 Secure Development Practices

| Practice | Implementation |
|----------|----------------|
| Secure Coding Standards | OWASP guidelines, ESLint security plugins |
| Code Review | Required PR reviews, security checklist |
| Static Analysis | SonarQube, CodeQL in CI/CD |
| Dependency Scanning | Dependabot, npm audit |
| Secret Detection | GitLeaks, Azure DevOps secret scanning |
| Container Scanning | Microsoft Defender for Containers |

### 5.2 Input Validation

```typescript
// Validation schemas using Zod
import { z } from 'zod';

const candidateCreateSchema = z.object({
  firstName: z.string()
    .min(1).max(100)
    .regex(/^[a-zA-Z\s\-']+$/, 'Invalid characters'),
  lastName: z.string()
    .min(1).max(100)
    .regex(/^[a-zA-Z\s\-']+$/, 'Invalid characters'),
  email: z.string()
    .email()
    .max(255)
    .transform(s => s.toLowerCase()),
  phone: z.string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone format')
    .optional(),
  resume: z.object({
    filename: z.string().max(255),
    contentType: z.enum([
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]),
    size: z.number().max(10 * 1024 * 1024), // 10MB
  }),
});

// Sanitization
import DOMPurify from 'isomorphic-dompurify';

function sanitizeHtml(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: [],
  });
}

// SQL injection prevention (using Prisma ORM)
// Prisma uses parameterized queries by default
const candidate = await prisma.candidate.findMany({
  where: {
    email: userInput, // Automatically parameterized
  },
});
```

### 5.3 API Security

```typescript
// Rate limiting configuration
const rateLimitConfig = {
  global: {
    windowMs: 60 * 1000, // 1 minute
    max: 100, // requests per window
  },
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // login attempts
    skipSuccessfulRequests: true,
  },
  upload: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50, // uploads per hour
  },
  ai: {
    windowMs: 60 * 1000,
    max: 10, // AI requests per minute
  },
};

// CORS configuration
const corsConfig = {
  origin: [
    'https://app.hirefit.io',
    'https://admin.hirefit.io',
  ],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  exposedHeaders: ['X-Request-ID', 'X-RateLimit-Remaining'],
  credentials: true,
  maxAge: 86400,
};

// Security headers
const securityHeaders = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';",
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};
```

---

## 6. Observability & Monitoring

### 6.1 Logging Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              LOG SOURCES                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │   App    │  │   Azure  │  │   WAF    │  │   SQL    │  │  Storage │          │
│  │   Logs   │  │    AD    │  │   Logs   │  │   Audit  │  │   Logs   │          │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘          │
│       │             │             │             │             │                  │
└───────┼─────────────┼─────────────┼─────────────┼─────────────┼──────────────────┘
        │             │             │             │             │
        └─────────────┴─────────────┴──────┬──────┴─────────────┘
                                           │
                                           ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         LOG ANALYTICS WORKSPACE                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                    Centralized Log Storage                               │   │
│  │              (90 days hot, 2 years archive)                             │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                    │                                            │
│         ┌──────────────────────────┼──────────────────────────┐                │
│         ▼                          ▼                          ▼                │
│  ┌─────────────┐           ┌─────────────┐           ┌─────────────┐          │
│  │   Azure     │           │   Azure     │           │   Azure     │          │
│  │  Sentinel   │           │  Workbooks  │           │   Alerts    │          │
│  │   (SIEM)    │           │ (Dashboards)│           │             │          │
│  └─────────────┘           └─────────────┘           └─────────────┘          │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Application Insights Configuration

```typescript
// Application Insights setup
import { ApplicationInsights } from '@microsoft/applicationinsights-web';

const appInsights = new ApplicationInsights({
  config: {
    connectionString: process.env.APPINSIGHTS_CONNECTION_STRING,
    enableAutoRouteTracking: true,
    enableCorsCorrelation: true,
    enableRequestHeaderTracking: true,
    enableResponseHeaderTracking: true,
    disableFetchTracking: false,
  },
});

// Custom telemetry for security events
function trackSecurityEvent(event: SecurityEvent): void {
  appInsights.trackEvent({
    name: `Security.${event.type}`,
    properties: {
      userId: event.userId,
      tenantId: event.tenantId,
      action: event.action,
      resource: event.resource,
      result: event.result,
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
      correlationId: event.correlationId,
    },
  });
}

// Security event types
type SecurityEventType = 
  | 'Authentication'
  | 'Authorization'
  | 'DataAccess'
  | 'ConfigChange'
  | 'Export'
  | 'Delete';
```

### 6.3 Audit Logging

```typescript
// Audit log schema
interface AuditLog {
  id: string;
  timestamp: Date;
  
  // Actor
  userId: string;
  userEmail: string;
  userRoles: string[];
  tenantId: string;
  
  // Action
  action: AuditAction;
  resource: string;
  resourceId: string;
  
  // Context
  ipAddress: string;
  userAgent: string;
  requestId: string;
  sessionId: string;
  
  // Details
  oldValue?: Record<string, any>;
  newValue?: Record<string, any>;
  metadata?: Record<string, any>;
  
  // Result
  status: 'success' | 'failure';
  errorMessage?: string;
}

type AuditAction = 
  | 'CREATE' | 'READ' | 'UPDATE' | 'DELETE'
  | 'LOGIN' | 'LOGOUT' | 'LOGIN_FAILED'
  | 'PERMISSION_CHANGE' | 'CONFIG_CHANGE'
  | 'EXPORT' | 'BULK_OPERATION'
  | 'AI_DECISION';

// Audit middleware
async function auditMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const startTime = Date.now();
  
  res.on('finish', async () => {
    if (shouldAudit(req.method, req.path)) {
      await writeAuditLog({
        timestamp: new Date(),
        userId: req.user?.id,
        userEmail: req.user?.email,
        userRoles: req.user?.roles || [],
        tenantId: req.tenantId,
        action: mapMethodToAction(req.method),
        resource: extractResource(req.path),
        resourceId: extractResourceId(req.path),
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        requestId: req.headers['x-request-id'],
        sessionId: req.session?.id,
        status: res.statusCode < 400 ? 'success' : 'failure',
        metadata: {
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          duration: Date.now() - startTime,
        },
      });
    }
  });
  
  next();
}
```

### 6.4 Security Alerts

```yaml
security_alerts:
  - name: BruteForceAttack
    query: |
      SigninLogs
      | where TimeGenerated > ago(15m)
      | where ResultType != 0
      | summarize FailedAttempts = count() by UserPrincipalName, IPAddress
      | where FailedAttempts > 10
    severity: High
    frequency: 5m
    action: SecurityTeamNotification
    
  - name: SuspiciousDataExport
    query: |
      AuditLogs
      | where TimeGenerated > ago(1h)
      | where Action == "EXPORT"
      | summarize ExportCount = count(), TotalRecords = sum(RecordCount) by UserId
      | where ExportCount > 5 or TotalRecords > 10000
    severity: Medium
    frequency: 1h
    action: ComplianceTeamNotification
    
  - name: PrivilegeEscalation
    query: |
      AuditLogs
      | where TimeGenerated > ago(1h)
      | where Action == "PERMISSION_CHANGE"
      | where NewValue contains "admin"
    severity: High
    frequency: 15m
    action: ImmediateAlert
    
  - name: AfterHoursAccess
    query: |
      SigninLogs
      | where TimeGenerated > ago(1h)
      | extend Hour = datetime_part("hour", TimeGenerated)
      | where Hour < 6 or Hour > 22
      | where RiskLevel != "none"
    severity: Medium
    frequency: 1h
    action: ReviewQueue
```

---

## 7. Incident Response

### 7.1 Incident Classification

| Severity | Description | Response Time | Examples |
|----------|-------------|---------------|----------|
| Critical | Active breach, data loss | 15 minutes | Data breach, ransomware |
| High | Security vulnerability, service impact | 1 hour | Credential leak, DDoS |
| Medium | Potential threat, policy violation | 4 hours | Suspicious activity, failed audits |
| Low | Minor security event | 24 hours | Policy warnings, anomalies |

### 7.2 Incident Response Process

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Detect    │───▶│   Triage    │───▶│  Contain    │───▶│ Eradicate   │
│             │    │             │    │             │    │             │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                                                               │
┌─────────────┐    ┌─────────────┐    ┌─────────────┐          │
│   Close     │◀───│   Review    │◀───│   Recover   │◀─────────┘
│             │    │             │    │             │
└─────────────┘    └─────────────┘    └─────────────┘
```

### 7.3 Incident Playbooks

**Playbook: Potential Data Breach**
1. **Detect**: Alert from Sentinel or user report
2. **Triage**: Assess scope, affected data, timeline
3. **Contain**: 
   - Revoke compromised credentials
   - Block suspicious IPs
   - Isolate affected systems
4. **Eradicate**:
   - Remove attacker access
   - Patch vulnerabilities
   - Reset credentials
5. **Recover**:
   - Restore from clean backups
   - Verify system integrity
   - Resume operations
6. **Review**:
   - Root cause analysis
   - Documentation
   - Process improvements
7. **Notify**:
   - Regulatory notification (if required)
   - Customer notification (if required)

---

## 8. Compliance Roadmap

### 8.1 Compliance Timeline

```
Q1 2024                Q2 2024                Q3 2024                Q4 2024
    │                      │                      │                      │
    ▼                      ▼                      ▼                      ▼
┌─────────────┐      ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│ Foundation  │      │ SOC 2 Type I│      │ SOC 2 Type II      │ ISO 27001   │
│ - Policies  │      │ - Controls  │      │ - Audit     │      │ - Cert      │
│ - Controls  │      │ - Testing   │      │ - Report    │      │ - Maintain  │
│ - Training  │      │ - Gaps      │      │             │      │             │
└─────────────┘      └─────────────┘      └─────────────┘      └─────────────┘
```

### 8.2 Compliance Checklist

**SOC 2 Type II**
- [ ] Security policies documented
- [ ] Access control procedures
- [ ] Change management process
- [ ] Incident response plan
- [ ] Vendor management program
- [ ] Business continuity plan
- [ ] Security awareness training
- [ ] Vulnerability management
- [ ] Encryption standards
- [ ] Audit logging enabled

**GDPR**
- [ ] Data processing inventory
- [ ] Privacy impact assessments
- [ ] Consent management
- [ ] Data subject rights workflows
- [ ] Breach notification process
- [ ] Data protection officer (if required)
- [ ] Cross-border transfer mechanisms
- [ ] Retention policy implementation

**AI Compliance (EU AI Act)**
- [ ] AI system classification
- [ ] Risk assessment documentation
- [ ] Training data governance
- [ ] Bias testing procedures
- [ ] Human oversight mechanisms
- [ ] Transparency requirements
- [ ] Model documentation
- [ ] Conformity assessment (if required)

---

## 9. Security Governance

### 9.1 Security Organization

| Role | Responsibility |
|------|----------------|
| CISO | Security strategy, risk management, compliance |
| Security Architect | Security design, standards, architecture review |
| Security Engineer | Implementation, monitoring, incident response |
| Security Analyst | Threat analysis, vulnerability assessment |
| Compliance Manager | Audit coordination, policy management |
| DPO | Data privacy, GDPR compliance |

### 9.2 Security Reviews

| Review Type | Frequency | Participants |
|-------------|-----------|--------------|
| Security Architecture Review | Per feature | Security Architect, Dev Lead |
| Penetration Testing | Quarterly | Third-party, Security Team |
| Vulnerability Scanning | Weekly | Automated, Security Engineer |
| Access Review | Quarterly | Managers, HR, Security |
| Policy Review | Annual | CISO, Legal, Compliance |
| Incident Review | Per incident | Security Team, Affected Teams |

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-01-XX | HireFit Team | Initial security plan |

**Review Schedule**: Quarterly
**Classification**: Internal - Confidential


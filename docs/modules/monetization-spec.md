# Monetization & Feature Management - Functional Specification

## Overview

The Monetization module enables flexible feature packaging, subscription management, and usage-based billing. It supports tiered pricing, feature flags, and enterprise licensing to facilitate modular feature monetization.

---

## Current Implementation Status

### Implemented (Phase 1)

The following modular feature system components have been implemented:

| Component | Status | Location |
|-----------|--------|----------|
| FeatureDefinition table | ✅ Done | `apps/api/prisma/schema.prisma` |
| TenantFeature table | ✅ Done | `apps/api/prisma/schema.prisma` |
| Feature seed data | ✅ Done | `apps/api/prisma/seed.ts` |
| FeaturesService | ✅ Done | `apps/api/src/modules/features/features.service.ts` |
| FeaturesController | ✅ Done | `apps/api/src/modules/features/features.controller.ts` |
| @RequireFeature guard | ✅ Done | `apps/api/src/common/guards/feature.guard.ts` |
| useFeature hook | ✅ Done | `apps/web/src/hooks/use-feature.tsx` |
| FeatureGate component | ✅ Done | `apps/web/src/components/features/feature-gate.tsx` |
| featuresApi client | ✅ Done | `apps/web/src/lib/api/client.ts` |

### Feature Module Definitions

| ID | Module | Type | Default | Limit |
|----|--------|------|---------|-------|
| `core` | Core Platform | Standard | Always On | - |
| `ai_screening` | AI Resume Screening | Freemium | On | 20/mo (free) |
| `ai_interview` | AI Interview Eval | Premium | Off | 10/mo |
| `scheduler` | Interview Scheduler | Add-on | Off | - |
| `analytics` | Advanced Analytics | Premium | Off | - |
| `integrations` | ATS/HRIS Integrations | Enterprise | Off | - |

### Tier to Feature Mapping

```typescript
const TIER_FEATURES = {
  free: {
    features: ['core', 'ai_screening'],
    limits: { ai_screening: 20 },
  },
  pro: {
    features: ['core', 'ai_screening', 'scheduler'],
    limits: { ai_screening: 100 },
  },
  team: {
    features: ['core', 'ai_screening', 'scheduler', 'analytics', 'ai_interview'],
    limits: { ai_screening: 500, ai_interview: 50 },
  },
  enterprise: {
    features: ['core', 'ai_screening', 'scheduler', 'analytics', 'ai_interview', 'integrations'],
    limits: { /* unlimited */ },
  },
};
```

### Pending (Phase 3)

| Component | Status | Notes |
|-----------|--------|-------|
| Stripe integration | Pending | Connect billing to feature entitlements |
| Subscription lifecycle | Pending | Auto-update features on plan change |
| Invoice generation | Pending | - |
| Payment webhook handlers | Pending | - |

---

## 1. Module Scope

### 1.1 Core Capabilities

| Capability | Description | Priority |
|------------|-------------|----------|
| Subscription Plans | Define and manage subscription tiers | P0 |
| Feature Flags | Control feature access by plan | P0 |
| Usage Metering | Track and limit feature usage | P0 |
| Billing Integration | Connect to payment processors | P0 |
| Plan Management | Self-service plan changes | P1 |
| Add-on Features | A-la-carte feature purchases | P1 |
| Enterprise Licensing | Custom contracts and terms | P1 |
| Revenue Analytics | Billing and usage analytics | P1 |

### 1.2 Out of Scope (Phase 1)

- Multi-currency support (beyond USD/EUR)
- Marketplace for third-party integrations
- Reseller/partner billing
- Usage-based dynamic pricing

---

## 2. Pricing Model

### 2.1 Subscription Tiers

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SUBSCRIPTION TIERS                                 │
├─────────────────┬─────────────────┬─────────────────┬──────────────────────┤
│     STARTER     │   PROFESSIONAL  │    BUSINESS     │     ENTERPRISE       │
├─────────────────┼─────────────────┼─────────────────┼──────────────────────┤
│ $99/mo          │ $299/mo         │ $799/mo         │ Custom               │
│ 2 users         │ 10 users        │ 50 users        │ Unlimited users      │
│ 100 candidates  │ 500 candidates  │ 2000 candidates │ Unlimited            │
│ 5 active jobs   │ 25 active jobs  │ 100 active jobs │ Unlimited            │
├─────────────────┼─────────────────┼─────────────────┼──────────────────────┤
│ Core Features:  │ + Pro Features: │ + Biz Features: │ + Enterprise:        │
│ • Resume upload │ • AI scoring    │ • API access    │ • SSO/SAML           │
│ • Basic search  │ • Adv. search   │ • Integrations  │ • Custom contracts   │
│ • Evaluations   │ • Question gen  │ • Analytics     │ • SLA guarantees     │
│ • Email support │ • Priority sup  │ • Phone support │ • Dedicated CSM      │
│                 │ • Reports       │ • Audit logs    │ • On-premise option  │
└─────────────────┴─────────────────┴─────────────────┴──────────────────────┘
```

### 2.2 Add-on Features

| Add-on | Price | Description |
|--------|-------|-------------|
| Additional Users | $15/user/mo | Extra user seats |
| Candidate Pack | $49/500 candidates | Additional candidate storage |
| AI Credits Pack | $99/1000 credits | AI scoring/generation credits |
| Recording Storage | $29/50GB | Interview recording storage |
| Advanced Analytics | $149/mo | Enhanced reporting dashboards |
| API Access | $199/mo | REST API access (Business tier default) |
| White-label | $499/mo | Custom branding |

### 2.3 Usage Limits

| Resource | Starter | Professional | Business | Enterprise |
|----------|---------|--------------|----------|------------|
| Users | 2 | 10 | 50 | Custom |
| Candidates/mo | 100 | 500 | 2,000 | Unlimited |
| Active Jobs | 5 | 25 | 100 | Unlimited |
| AI Scores/mo | 50 | 500 | 2,000 | Custom |
| Question Gen/mo | 20 | 200 | 1,000 | Custom |
| Storage (GB) | 5 | 25 | 100 | Custom |
| API Calls/mo | - | - | 10,000 | Custom |

---

## 3. Functional Requirements

### 3.1 Subscription Management

#### FR-MON-001: Plan Selection
**Description**: System shall allow organizations to select and purchase subscription plans.

**Acceptance Criteria**:
- Display available plans with features comparison
- Support monthly and annual billing (20% discount for annual)
- Collect billing information securely
- Process payment through Stripe
- Provision tenant immediately after payment
- Send confirmation email with receipt
- Support plan preview/trial period

#### FR-MON-002: Plan Changes
**Description**: System shall allow plan upgrades and downgrades.

**Upgrade Flow**:
```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Select  │───▶│  Review  │───▶│  Confirm │───▶│ Activate │
│  Plan    │    │  Changes │    │  Payment │    │ Features │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
```

**Acceptance Criteria**:
- Allow upgrade at any time (pro-rated billing)
- Allow downgrade at end of billing cycle
- Show impact of plan change (features gained/lost)
- Warn if downgrade exceeds new limits
- Apply credit for unused time on upgrade
- Maintain data on downgrade (up to limit)

#### FR-MON-003: Billing Management
**Description**: System shall manage billing and payment methods.

**Acceptance Criteria**:
- Store payment methods securely (PCI compliant)
- Support credit card and ACH payments
- Generate invoices automatically
- Send payment reminders
- Handle failed payments (retry logic, dunning)
- Support billing contacts
- Provide invoice history

#### FR-MON-004: Cancellation
**Description**: System shall handle subscription cancellations.

**Acceptance Criteria**:
- Allow cancellation with reason capture
- Access continues until end of billing period
- Offer retention incentives (optional)
- Export data before account closure
- Soft delete with recovery period (30 days)
- Send confirmation and follow-up emails

### 3.2 Feature Flags

#### FR-MON-005: Feature Flag System
**Description**: System shall control feature access through flags.

**Flag Types**:
| Type | Description | Example |
|------|-------------|---------|
| Boolean | On/off feature | `ai_scoring_enabled` |
| Numeric | Limit-based | `max_active_jobs: 25` |
| Percentage | Gradual rollout | `new_ui: 50%` |
| User Segment | Targeted access | `beta_users` |

**Acceptance Criteria**:
- Define flags per feature
- Associate flags with plans
- Override flags per tenant
- Support gradual rollout
- Real-time flag evaluation
- Flag change audit logging

#### FR-MON-006: Feature Entitlements
**Description**: System shall enforce feature entitlements.

```typescript
// Entitlement check flow
interface EntitlementCheck {
  featureKey: string;
  tenantId: string;
  context?: {
    userId?: string;
    resourceType?: string;
    quantity?: number;
  };
}

interface EntitlementResult {
  allowed: boolean;
  reason?: 'enabled' | 'limit_reached' | 'plan_required' | 'trial_expired';
  limit?: number;
  used?: number;
  upgradeOptions?: Plan[];
}
```

**Acceptance Criteria**:
- Check entitlements before feature access
- Return actionable denial reasons
- Suggest upgrade paths
- Support graceful degradation
- Cache entitlements for performance

#### FR-MON-007: Feature Discovery
**Description**: System shall expose available features to UI.

**Acceptance Criteria**:
- List all features with access status
- Show locked features with upgrade CTAs
- Display usage vs limits
- Highlight new features
- Support feature tooltips

### 3.3 Usage Metering

#### FR-MON-008: Usage Tracking
**Description**: System shall track feature usage.

**Tracked Metrics**:
| Metric | Granularity | Reset |
|--------|-------------|-------|
| Active users | Daily peak | Never |
| Candidates created | Per candidate | Monthly |
| AI scores generated | Per score | Monthly |
| Questions generated | Per question | Monthly |
| Storage used | Per byte | Never |
| API calls | Per call | Monthly |

**Acceptance Criteria**:
- Track usage in real-time
- Aggregate by tenant, period
- Support usage reports
- Alert on approaching limits
- Historical usage retention

#### FR-MON-009: Usage Limits
**Description**: System shall enforce usage limits.

**Enforcement Modes**:
| Mode | Behavior |
|------|----------|
| Hard limit | Block action when limit reached |
| Soft limit | Allow overage, notify admin |
| Burst | Allow temporary overage, throttle later |

**Acceptance Criteria**:
- Check limits before actions
- Display warning at 80% usage
- Block or warn at 100%
- Allow admin to purchase more
- Support limit overrides for Enterprise

#### FR-MON-010: Usage Alerts
**Description**: System shall notify admins of usage events.

**Alert Types**:
- Approaching limit (80%)
- Limit reached (100%)
- Unusual usage spike
- Cost projection exceeded

**Acceptance Criteria**:
- Configure alert thresholds
- Send alerts via email/in-app
- Include usage context
- Provide action links

### 3.4 Billing Integration

#### FR-MON-011: Stripe Integration
**Description**: System shall integrate with Stripe for payments.

**Stripe Features Used**:
- Stripe Checkout for payments
- Stripe Billing for subscriptions
- Stripe Elements for card input
- Stripe Invoicing
- Stripe Tax (optional)
- Stripe Revenue Recognition (optional)

**Acceptance Criteria**:
- Secure payment processing
- Subscription lifecycle management
- Webhook handling for events
- Refund processing
- Dispute management
- PCI compliance

#### FR-MON-012: Invoice Generation
**Description**: System shall generate and manage invoices.

**Invoice Contents**:
- Organization details
- Billing period
- Plan charges
- Add-on charges
- Usage-based charges
- Taxes
- Total and payment status

**Acceptance Criteria**:
- Auto-generate monthly invoices
- Support manual invoice creation
- PDF export
- Email delivery
- Payment link inclusion
- Invoice numbering sequence

### 3.5 Enterprise Features

#### FR-MON-013: Custom Contracts
**Description**: System shall support custom enterprise agreements.

**Custom Terms**:
- Custom pricing
- Volume discounts
- Custom usage limits
- Custom SLA terms
- Payment terms (Net 30/60/90)
- Multi-year commitments

**Acceptance Criteria**:
- Override standard pricing
- Custom billing cycles
- Custom feature sets
- Contract expiration tracking
- Renewal management

#### FR-MON-014: Enterprise Billing
**Description**: System shall support enterprise billing requirements.

**Requirements**:
- Purchase order support
- Multi-entity billing
- Cost center allocation
- Detailed usage reporting
- Custom invoice formats
- Accounts payable integration

**Acceptance Criteria**:
- PO number on invoices
- Multiple billing contacts
- Consolidated invoicing
- Detailed usage exports
- Custom fields support

---

## 4. Data Model

### 4.1 Core Entities

```typescript
// Subscription Plan
interface Plan {
  id: string;
  name: string;
  description: string;
  tier: 'starter' | 'professional' | 'business' | 'enterprise';
  
  pricing: {
    monthly: number;
    annual: number;
    currency: string;
  };
  
  limits: {
    users: number;
    candidatesPerMonth: number;
    activeJobs: number;
    aiScoresPerMonth: number;
    questionsPerMonth: number;
    storageGb: number;
    apiCallsPerMonth: number;
  };
  
  features: FeatureFlag[];
  
  isActive: boolean;
  isPublic: boolean;  // Visible on pricing page
  
  stripeProductId: string;
  stripePriceIdMonthly: string;
  stripePriceIdAnnual: string;
  
  createdAt: Date;
  updatedAt: Date;
}

// Feature Flag
interface FeatureFlag {
  key: string;
  name: string;
  description: string;
  category: string;
  
  type: 'boolean' | 'numeric' | 'percentage';
  defaultValue: boolean | number;
  
  plans: {
    planId: string;
    enabled: boolean;
    value?: number;
  }[];
  
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Subscription
interface Subscription {
  id: string;
  tenantId: string;
  
  planId: string;
  status: SubscriptionStatus;
  
  billingCycle: 'monthly' | 'annual';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  
  // Stripe references
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  
  // Add-ons
  addOns: SubscriptionAddOn[];
  
  // Trial
  trialEndsAt?: Date;
  
  // Cancellation
  cancelledAt?: Date;
  cancelReason?: string;
  cancelsAt?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

type SubscriptionStatus = 
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'cancelled'
  | 'unpaid'
  | 'paused';

interface SubscriptionAddOn {
  addOnId: string;
  quantity: number;
  pricePerUnit: number;
  stripeItemId: string;
}

// Usage Record
interface UsageRecord {
  id: string;
  tenantId: string;
  
  metric: string;
  value: number;
  
  timestamp: Date;
  periodStart: Date;
  periodEnd: Date;
  
  metadata?: Record<string, any>;
}

// Usage Summary
interface UsageSummary {
  tenantId: string;
  period: string;  // YYYY-MM
  
  metrics: {
    metric: string;
    used: number;
    limit: number;
    percentUsed: number;
  }[];
  
  calculatedAt: Date;
}

// Invoice
interface Invoice {
  id: string;
  tenantId: string;
  
  stripeInvoiceId: string;
  
  number: string;
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
  
  periodStart: Date;
  periodEnd: Date;
  
  lineItems: InvoiceLineItem[];
  
  subtotal: number;
  tax: number;
  total: number;
  amountDue: number;
  amountPaid: number;
  
  currency: string;
  
  dueDate: Date;
  paidAt?: Date;
  
  hostedInvoiceUrl: string;
  invoicePdf: string;
  
  createdAt: Date;
}

interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  type: 'subscription' | 'addon' | 'usage' | 'credit';
}

// Entitlement Override
interface EntitlementOverride {
  id: string;
  tenantId: string;
  
  featureKey: string;
  overrideType: 'grant' | 'revoke' | 'limit';
  value?: number;
  
  reason: string;
  expiresAt?: Date;
  
  createdBy: string;
  createdAt: Date;
}
```

### 4.2 Database Schema

```sql
-- Plans table
CREATE TABLE plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    tier VARCHAR(20) NOT NULL,
    
    price_monthly DECIMAL(10,2) NOT NULL,
    price_annual DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    
    limit_users INTEGER NOT NULL,
    limit_candidates_per_month INTEGER NOT NULL,
    limit_active_jobs INTEGER NOT NULL,
    limit_ai_scores_per_month INTEGER NOT NULL,
    limit_questions_per_month INTEGER NOT NULL,
    limit_storage_gb INTEGER NOT NULL,
    limit_api_calls_per_month INTEGER,
    
    features JSONB NOT NULL DEFAULT '[]',
    
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_public BOOLEAN NOT NULL DEFAULT TRUE,
    
    stripe_product_id VARCHAR(100),
    stripe_price_id_monthly VARCHAR(100),
    stripe_price_id_annual VARCHAR(100),
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Feature flags table
CREATE TABLE feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    
    flag_type VARCHAR(20) NOT NULL,
    default_value JSONB NOT NULL,
    
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Plan features mapping
CREATE TABLE plan_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID NOT NULL REFERENCES plans(id),
    feature_flag_id UUID NOT NULL REFERENCES feature_flags(id),
    
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    value JSONB,
    
    UNIQUE(plan_id, feature_flag_id)
);

-- Subscriptions table
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    plan_id UUID NOT NULL REFERENCES plans(id),
    
    status VARCHAR(20) NOT NULL,
    billing_cycle VARCHAR(10) NOT NULL,
    
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    
    stripe_customer_id VARCHAR(100) NOT NULL,
    stripe_subscription_id VARCHAR(100) NOT NULL,
    
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancel_reason TEXT,
    cancels_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    UNIQUE(tenant_id)
);

-- Subscription add-ons
CREATE TABLE subscription_addons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL REFERENCES subscriptions(id),
    addon_id VARCHAR(50) NOT NULL,
    
    quantity INTEGER NOT NULL DEFAULT 1,
    price_per_unit DECIMAL(10,2) NOT NULL,
    
    stripe_item_id VARCHAR(100),
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Usage records table (partitioned by month)
CREATE TABLE usage_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    
    metric VARCHAR(50) NOT NULL,
    value BIGINT NOT NULL,
    
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    metadata JSONB
) PARTITION BY RANGE (period_start);

-- Create monthly partitions
CREATE TABLE usage_records_2024_01 PARTITION OF usage_records
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
-- ... more partitions

-- Usage summaries table
CREATE TABLE usage_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    period VARCHAR(7) NOT NULL, -- YYYY-MM
    
    metrics JSONB NOT NULL,
    
    calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    UNIQUE(tenant_id, period)
);

-- Entitlement overrides
CREATE TABLE entitlement_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    feature_key VARCHAR(100) NOT NULL,
    override_type VARCHAR(20) NOT NULL,
    override_value JSONB,
    
    reason TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    UNIQUE(tenant_id, feature_key)
);

-- Invoices table
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    stripe_invoice_id VARCHAR(100) NOT NULL UNIQUE,
    
    invoice_number VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL,
    
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    
    line_items JSONB NOT NULL,
    
    subtotal DECIMAL(10,2) NOT NULL,
    tax DECIMAL(10,2) NOT NULL DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    amount_due DECIMAL(10,2) NOT NULL,
    amount_paid DECIMAL(10,2) NOT NULL DEFAULT 0,
    
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    paid_at TIMESTAMP WITH TIME ZONE,
    
    hosted_invoice_url TEXT,
    invoice_pdf TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_usage_records_tenant_period ON usage_records(tenant_id, period_start);
CREATE INDEX idx_invoices_tenant ON invoices(tenant_id, created_at DESC);
```

---

## 5. API Specification

### 5.1 Subscription APIs

```yaml
# Get current subscription
GET /api/v1/billing/subscription
Response (200):
  subscription:
    id: string
    plan: Plan
    status: string
    billingCycle: string
    currentPeriodEnd: string
    addOns: AddOn[]
  usage: UsageSummary

# Change plan
POST /api/v1/billing/subscription/change
Request:
  planId: string
  billingCycle: "monthly" | "annual"
Response (200):
  subscription: Subscription
  changes:
    proratedCredit: number
    newChargeAmount: number
    effectiveDate: string

# Cancel subscription
POST /api/v1/billing/subscription/cancel
Request:
  reason: string
  feedback?: string
Response (200):
  subscription: Subscription
  cancelsAt: string

# Get available plans
GET /api/v1/billing/plans
Response (200):
  plans: Plan[]
  currentPlanId: string
```

### 5.2 Feature & Entitlement APIs

```yaml
# Check entitlement
GET /api/v1/entitlements/check?feature={featureKey}
Response (200):
  allowed: boolean
  reason: string
  limit?: number
  used?: number
  upgradeOptions?: Plan[]

# Get all entitlements
GET /api/v1/entitlements
Response (200):
  features:
    - key: string
      name: string
      allowed: boolean
      limit?: number
      used?: number
      category: string

# Get feature flags (for UI)
GET /api/v1/features
Response (200):
  flags:
    ai_scoring_enabled: boolean
    max_active_jobs: number
    ...
```

### 5.3 Usage APIs

```yaml
# Get usage summary
GET /api/v1/billing/usage?period={YYYY-MM}
Response (200):
  period: string
  metrics:
    - metric: string
      used: number
      limit: number
      percentUsed: number
      trend: "up" | "down" | "stable"

# Get usage history
GET /api/v1/billing/usage/history?metric={metric}&months={n}
Response (200):
  metric: string
  history:
    - period: string
      value: number
```

### 5.4 Billing APIs

```yaml
# Get invoices
GET /api/v1/billing/invoices?limit=&offset=
Response (200):
  invoices: Invoice[]
  pagination: { total, limit, offset }

# Get invoice detail
GET /api/v1/billing/invoices/{id}
Response (200):
  invoice: Invoice
  pdfUrl: string
  paymentUrl: string

# Update payment method
POST /api/v1/billing/payment-method
Request:
  paymentMethodId: string (Stripe PM ID)
Response (200):
  success: boolean
  last4: string
  brand: string

# Create checkout session
POST /api/v1/billing/checkout
Request:
  planId: string
  billingCycle: string
Response (200):
  checkoutUrl: string
  sessionId: string
```

---

## 6. Stripe Webhook Events

| Event | Handler Action |
|-------|----------------|
| `customer.subscription.created` | Create local subscription record |
| `customer.subscription.updated` | Update subscription status/plan |
| `customer.subscription.deleted` | Mark subscription cancelled |
| `invoice.paid` | Record payment, update status |
| `invoice.payment_failed` | Mark past due, send notification |
| `invoice.finalized` | Store invoice record |
| `checkout.session.completed` | Provision new tenant |

---

## 7. Non-Functional Requirements

### 7.1 Performance

| Metric | Target | Maximum |
|--------|--------|---------|
| Entitlement check | < 10ms | 50ms |
| Plan change | < 5s | 15s |
| Usage lookup | < 100ms | 500ms |
| Invoice generation | < 3s | 10s |

### 7.2 Availability

- 99.99% for entitlement checks (cached)
- Graceful degradation if Stripe unavailable
- Offline entitlement evaluation support

### 7.3 Security

- PCI DSS compliance (via Stripe)
- No card data stored locally
- Audit logging for billing changes
- Role-based billing admin access

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-01-XX | HireFit Team | Initial specification |


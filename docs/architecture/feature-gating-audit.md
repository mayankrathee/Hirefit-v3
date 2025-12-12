# Feature Gating Audit & Best Practices

**Last Updated**: December 11, 2024  
**Purpose**: Ensure all features are modular, individually activatable, and properly gated by subscription plans

---

## Overview

HireFit uses a **modular feature system** where each feature can be:
- ✅ Enabled/disabled per tenant
- ✅ Limited by usage quotas
- ✅ Mapped to subscription tiers
- ✅ Gated at API endpoint level
- ✅ Tracked for usage monitoring

---

## Feature Definitions

### Current Features

| Feature ID | Name | Type | Default | Usage Limited | Default Limit |
|------------|------|------|---------|---------------|---------------|
| `core` | Core Platform | Standard | Always On | No | N/A |
| `ai_screening` | AI Resume Screening | Freemium | Enabled | Yes | 20/month |
| `ai_interview` | AI Interview Evaluation | Premium | Disabled | Yes | 10/month |
| `scheduler` | Interview Scheduler | Add-on | Disabled | No | N/A |
| `analytics` | Advanced Analytics | Premium | Disabled | No | N/A |
| `integrations` | ATS/HRIS Integrations | Enterprise | Disabled | No | N/A |

### Feature Type Definitions

- **Standard**: Always included, cannot be disabled
- **Freemium**: Free with usage limits, enabled by default
- **Premium**: Paid feature, disabled by default
- **Add-on**: Optional paid add-on, disabled by default
- **Enterprise**: Enterprise-only feature, disabled by default

---

## Subscription Tier Mapping

| Tier | Features Included | Usage Limits |
|------|------------------|--------------|
| **Free** | `core`, `ai_screening` | `ai_screening`: 20/month |
| **Pro** | Free + `scheduler` | `ai_screening`: 100/month |
| **Team** | Pro + `analytics`, `ai_interview` | `ai_screening`: 500/month, `ai_interview`: 50/month |
| **Enterprise** | All features | Unlimited |

---

## API Endpoint Feature Gating

### ✅ Protected Endpoints

| Endpoint | Method | Feature | Usage Tracking | Status |
|----------|--------|---------|----------------|--------|
| `/api/jobs/:id/resumes` | POST | `ai_screening` | ✅ (in service) | ✅ Protected |
| `/api/jobs/:id/resumes/status` | GET | `ai_screening` | No | ⚠️ Should gate read access |

### ⚠️ Endpoints Needing Review

| Endpoint | Method | Feature | Recommendation |
|----------|--------|---------|----------------|
| `/api/jobs/:id/resumes/status` | GET | `ai_screening` | Add `@RequireFeature('ai_screening')` |
| Future: `/api/interviews` | POST | `scheduler` | Gate when implemented |
| Future: `/api/interviews/:id/evaluate` | POST | `ai_interview` | Gate when implemented |
| Future: `/api/analytics/*` | GET | `analytics` | Gate when implemented |

---

## Implementation Patterns

### Pattern 1: Endpoint-Level Gating (Recommended)

**Use when**: Feature access should be checked before any processing

```typescript
@Post(':id/resumes')
@RequireFeature({ featureId: 'ai_screening', trackUsage: false })
@Roles(Role.TENANT_ADMIN, Role.HR_ADMIN, Role.RECRUITER)
async uploadResumes() {
  // Feature is already checked by guard
  // Usage tracking happens in service layer
}
```

**Benefits**:
- Early rejection (better UX)
- Clear API contract
- Automatic error messages

### Pattern 2: Service-Level Gating (Current for AI)

**Use when**: Feature check needs to happen after some processing

```typescript
async scoreResume(resumeText: string, jobId: string, tenantId: string) {
  // Check feature access (will throw if not allowed)
  await this.featuresService.checkFeatureLimit(tenantId, 'ai_screening');
  
  // Process...
  
  // Increment usage after successful processing
  await this.featuresService.incrementUsage(tenantId, 'ai_screening');
}
```

**Benefits**:
- More control over when to check
- Can do partial processing before gating
- Usage tracking at point of consumption

### Pattern 3: Frontend Gating

**Use when**: Hiding UI elements based on feature access

```tsx
<FeatureGate feature="ai_screening">
  <ResumeUploadButton />
</FeatureGate>

// Or with hooks
const { canUse } = useFeature('ai_screening');
if (!canUse) return <UpgradePrompt />;
```

---

## Feature Gating Checklist

When adding a new feature, ensure:

- [ ] Feature definition added to `FeatureDefinition` table
- [ ] Feature mapped to subscription tiers in `TIER_FEATURES`
- [ ] API endpoints protected with `@RequireFeature` decorator
- [ ] Service methods check feature limits before processing
- [ ] Usage tracking implemented (if usage-limited)
- [ ] Frontend components gated with `<FeatureGate>` or `useFeature`
- [ ] Error messages provide upgrade path
- [ ] Documentation updated

---

## Current Implementation Status

### ✅ Fully Gated Features

#### `ai_screening` (AI Resume Screening)

**Backend**:
- ✅ Endpoint: `POST /api/jobs/:id/resumes` - Protected with `@RequireFeature`
- ✅ Service: `ResumeScoringAgentService.scoreResume()` - Checks limits
- ✅ Usage: Incremented after successful processing
- ⚠️ Endpoint: `GET /api/jobs/:id/resumes/status` - **Needs feature guard**

**Frontend**:
- ✅ Resume upload UI should use `<FeatureGate feature="ai_screening">`
- ✅ Usage display should show `ai_screening` usage

**Tier Mapping**:
- ✅ Free: 20/month
- ✅ Pro: 100/month
- ✅ Team: 500/month
- ✅ Enterprise: Unlimited

### ⏳ Planned Features (Not Yet Implemented)

#### `ai_interview` (AI Interview Evaluation)

**Planned Gating**:
- Endpoint: `POST /api/interviews/:id/evaluate` - Will use `@RequireFeature('ai_interview')`
- Service: Will check limits before AI processing
- Usage: Tracked per evaluation
- Tier: Team+ only, 50/month limit

#### `scheduler` (Interview Scheduler)

**Planned Gating**:
- Endpoints: `POST /api/interviews`, `PATCH /api/interviews/:id` - Will use `@RequireFeature('scheduler')`
- Service: Calendar integration gated
- Usage: Not limited (add-on feature)
- Tier: Pro+ only

#### `analytics` (Advanced Analytics)

**Planned Gating**:
- Endpoints: `GET /api/analytics/*` - Will use `@RequireFeature('analytics')`
- Service: Analytics queries gated
- Usage: Not limited
- Tier: Team+ only

#### `integrations` (ATS/HRIS Integrations)

**Planned Gating**:
- Endpoints: `POST /api/integrations/*` - Will use `@RequireFeature('integrations')`
- Service: Integration APIs gated
- Usage: Not limited
- Tier: Enterprise only

---

## Best Practices

### 1. Always Gate at Endpoint Level

```typescript
// ✅ Good: Gate at endpoint
@Post(':id/resumes')
@RequireFeature('ai_screening')
async uploadResumes() { ... }

// ❌ Bad: Only check in service
@Post(':id/resumes')
async uploadResumes() {
  // User can call endpoint, then gets error - poor UX
  await this.checkFeature(); 
}
```

### 2. Track Usage After Success

```typescript
// ✅ Good: Track after successful operation
try {
  const result = await this.process();
  await this.featuresService.incrementUsage(tenantId, 'ai_screening');
  return result;
} catch (error) {
  // Don't increment on failure
  throw error;
}
```

### 3. Provide Clear Error Messages

```typescript
// ✅ Good: Helpful error message
throw new ForbiddenException(
  `The 'AI Resume Screening' feature is not available on your current plan. ` +
  `Please upgrade to Pro ($29/mo) to access this feature.`
);
```

### 4. Use Feature Status for UI

```typescript
// ✅ Good: Check status before rendering
const { canUse, remaining, limit } = useFeature('ai_screening');
if (!canUse) {
  return <UpgradePrompt feature="ai_screening" />;
}
```

---

## Testing Feature Gating

### Test Cases

1. **Feature Disabled**:
   - Call endpoint → Should return 403 with upgrade message
   - Frontend should show upgrade prompt

2. **Feature Enabled, Limit Reached**:
   - Call endpoint → Should return 403 with limit message
   - Frontend should show usage limit warning

3. **Feature Enabled, Within Limit**:
   - Call endpoint → Should process normally
   - Usage counter should increment

4. **Tier Upgrade**:
   - Upgrade tier → Feature should auto-enable
   - Limits should update automatically

---

## Migration Guide for Existing Features

If you have an existing feature that needs gating:

1. **Add Feature Definition**:
   ```typescript
   // In database seed or migration
   await prisma.featureDefinition.create({
     data: {
       id: 'your_feature',
       name: 'Your Feature',
       type: 'premium',
       defaultEnabled: false,
       usageLimited: true,
       defaultLimit: 10,
     },
   });
   ```

2. **Add to Tier Mapping**:
   ```typescript
   // In features.service.ts
   const TIER_FEATURES = {
     pro: {
       features: ['core', 'ai_screening', 'your_feature'],
       limits: { your_feature: 10 },
     },
   };
   ```

3. **Gate Endpoints**:
   ```typescript
   @Post('your-endpoint')
   @RequireFeature('your_feature')
   async yourMethod() { ... }
   ```

4. **Track Usage**:
   ```typescript
   await this.featuresService.incrementUsage(tenantId, 'your_feature');
   ```

---

## Monitoring & Alerts

### Metrics to Track

- Feature enablement rate per tier
- Usage consumption per feature
- Upgrade conversion from feature gates
- Feature-specific error rates

### Alerts to Set Up

- Feature usage approaching limits (80% threshold)
- Unusual feature usage patterns
- Feature gate rejection rates

---

## Future Enhancements

1. **Feature Bundles**: Group related features (e.g., "AI Bundle")
2. **Trial Periods**: Temporary feature access for evaluation
3. **Usage Analytics**: Per-feature usage dashboards
4. **A/B Testing**: Feature flags for gradual rollouts
5. **Custom Limits**: Enterprise custom feature limits

---

## Related Documentation

- [Modular Feature System](../project/checkpoints/modular-feature-system.md)
- [Feature Service Implementation](../../apps/api/src/modules/features/features.service.ts)
- [Feature Guard Implementation](../../apps/api/src/common/guards/feature.guard.ts)
- [Monetization Spec](../modules/monetization-spec.md)

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-12-11 | AI Assistant | Initial feature gating audit |

**Review Schedule**: After each new feature addition


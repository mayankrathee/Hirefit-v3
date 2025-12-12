'use client';

import { ReactNode, useState } from 'react';
import { useFeature, useFeatures, FeatureId } from '@/hooks/use-feature';
import { Lock, Sparkles, ArrowRight, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

interface FeatureGateProps {
  /**
   * The feature ID to check
   */
  feature: FeatureId | string;
  
  /**
   * Children to render when feature is available
   */
  children: ReactNode;
  
  /**
   * Optional fallback content when feature is not available
   * If not provided, a default upgrade prompt will be shown
   */
  fallback?: ReactNode;
  
  /**
   * If true, renders nothing when feature is unavailable (no fallback)
   */
  hideWhenUnavailable?: boolean;
  
  /**
   * If true, checks only if feature is enabled (ignores usage limits)
   * Default is false (checks if feature can be used)
   */
  checkEnabledOnly?: boolean;
  
  /**
   * Optional callback when user clicks upgrade
   */
  onUpgradeClick?: () => void;
}

/**
 * Component that conditionally renders content based on feature availability
 * 
 * @example
 * // Basic usage - show children if feature available, upgrade prompt otherwise
 * <FeatureGate feature="ai_screening">
 *   <AIScreeningPanel />
 * </FeatureGate>
 * 
 * @example
 * // Custom fallback
 * <FeatureGate feature="analytics" fallback={<BasicAnalytics />}>
 *   <AdvancedAnalytics />
 * </FeatureGate>
 * 
 * @example
 * // Hide completely when unavailable
 * <FeatureGate feature="integrations" hideWhenUnavailable>
 *   <IntegrationsButton />
 * </FeatureGate>
 */
export function FeatureGate({
  feature,
  children,
  fallback,
  hideWhenUnavailable = false,
  checkEnabledOnly = false,
  onUpgradeClick,
}: FeatureGateProps) {
  const { isEnabled, canUse, status, isLoading } = useFeature(feature);

  // While loading, render nothing or a loading state
  if (isLoading) {
    return null;
  }

  // Check availability based on mode
  const isAvailable = checkEnabledOnly ? isEnabled : canUse;

  if (isAvailable) {
    return <>{children}</>;
  }

  // Feature not available
  if (hideWhenUnavailable) {
    return null;
  }

  // Show custom fallback if provided
  if (fallback) {
    return <>{fallback}</>;
  }

  // Show default upgrade prompt
  return (
    <FeatureUpgradePrompt
      featureName={status?.name || feature}
      featureDescription={status?.description}
      isEnabled={isEnabled}
      usageInfo={status?.usageLimited ? { used: status.used, limit: status.limit } : null}
      onUpgradeClick={onUpgradeClick}
    />
  );
}

interface FeatureUpgradePromptProps {
  featureName: string;
  featureDescription?: string;
  isEnabled: boolean;
  usageInfo: { used: number; limit: number | null } | null;
  onUpgradeClick?: () => void;
}

/**
 * Default upgrade prompt shown when a feature is not available
 */
function FeatureUpgradePrompt({
  featureName,
  featureDescription,
  isEnabled,
  usageInfo,
  onUpgradeClick,
}: FeatureUpgradePromptProps) {
  const isLimitReached = usageInfo && usageInfo.limit && usageInfo.used >= usageInfo.limit;

  return (
    <div className="rounded-xl border-2 border-dashed border-primary/20 bg-primary/5 p-6 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
        {isLimitReached ? (
          <AlertTriangle className="h-6 w-6 text-amber-500" />
        ) : (
          <Lock className="h-6 w-6 text-primary" />
        )}
      </div>

      <h3 className="mb-2 text-lg font-semibold">
        {isLimitReached ? `${featureName} Limit Reached` : `${featureName} Not Available`}
      </h3>

      <p className="mb-4 text-sm text-muted-foreground">
        {isLimitReached ? (
          <>
            You've used {usageInfo?.used} of {usageInfo?.limit} {featureName.toLowerCase()} this month.
            Upgrade to continue using this feature.
          </>
        ) : (
          featureDescription || `Upgrade your plan to unlock ${featureName.toLowerCase()}.`
        )}
      </p>

      <Link
        href="/dashboard/settings/billing"
        onClick={onUpgradeClick}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        <Sparkles className="h-4 w-4" />
        Upgrade Plan
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

/**
 * Component that shows usage information for a feature with limits
 */
interface FeatureUsageBarProps {
  feature: FeatureId | string;
  showLabel?: boolean;
  className?: string;
}

export function FeatureUsageBar({ feature, showLabel = true, className = '' }: FeatureUsageBarProps) {
  const { status, isLoading } = useFeature(feature);

  if (isLoading || !status?.usageLimited) {
    return null;
  }

  const { used, limit, remaining } = status;
  const percentage = limit ? Math.min(100, (used / limit) * 100) : 0;
  const isNearLimit = percentage >= 80;
  const isAtLimit = percentage >= 100;

  return (
    <div className={className}>
      {showLabel && (
        <div className="mb-1 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{status.name}</span>
          <span className={isAtLimit ? 'text-red-500 font-medium' : isNearLimit ? 'text-amber-500' : ''}>
            {used} / {limit ?? '∞'}
          </span>
        </div>
      )}
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full transition-all duration-300 ${
            isAtLimit
              ? 'bg-red-500'
              : isNearLimit
              ? 'bg-amber-500'
              : 'bg-primary'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {isAtLimit && (
        <p className="mt-1 text-xs text-red-500">
          Limit reached.{' '}
          <Link href="/dashboard/settings/billing" className="underline hover:no-underline">
            Upgrade
          </Link>{' '}
          for more.
        </p>
      )}
    </div>
  );
}

/**
 * Component that shows a badge indicating feature availability
 */
interface FeatureBadgeProps {
  feature: FeatureId | string;
  className?: string;
}

export function FeatureBadge({ feature, className = '' }: FeatureBadgeProps) {
  const { isEnabled, canUse, status, isLoading } = useFeature(feature);
  const { definitions } = useFeatures();

  if (isLoading) {
    return null;
  }

  const definition = definitions.find((d) => d.id === feature);
  const featureType = definition?.type || 'premium';

  if (canUse) {
    return null; // Don't show badge if feature is available
  }

  if (featureType === 'freemium' && isEnabled) {
    // Feature is enabled but at limit
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 ${className}`}
      >
        <AlertTriangle className="h-3 w-3" />
        Limit Reached
      </span>
    );
  }

  // Feature not enabled
  const typeLabels: Record<string, { label: string; className: string }> = {
    premium: { label: 'Pro', className: 'bg-purple-100 text-purple-700' },
    addon: { label: 'Add-on', className: 'bg-blue-100 text-blue-700' },
    enterprise: { label: 'Enterprise', className: 'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700' },
  };

  const { label, className: typeClassName } = typeLabels[featureType] || typeLabels.premium;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${typeClassName} ${className}`}
    >
      <Lock className="h-3 w-3" />
      {label}
    </span>
  );
}

/**
 * HOC to wrap a component with feature gating
 */
export function withFeatureGate<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  featureId: FeatureId | string,
  options?: Omit<FeatureGateProps, 'feature' | 'children'>
) {
  return function FeatureGatedComponent(props: P) {
    return (
      <FeatureGate feature={featureId} {...options}>
        <WrappedComponent {...props} />
      </FeatureGate>
    );
  };
}


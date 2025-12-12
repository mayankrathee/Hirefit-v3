'use client';

import { useState, useEffect, useCallback, useMemo, createContext, useContext, ReactNode } from 'react';
import { featuresApi, FeatureStatus, FeatureDefinition } from '@/lib/api/client';

// Known feature IDs for type safety
export type FeatureId = 
  | 'core'
  | 'ai_screening'
  | 'ai_interview'
  | 'scheduler'
  | 'analytics'
  | 'integrations';

interface FeaturesContextType {
  features: FeatureStatus[];
  definitions: FeatureDefinition[];
  isLoading: boolean;
  error: string | null;
  isFeatureEnabled: (featureId: FeatureId | string) => boolean;
  canUseFeature: (featureId: FeatureId | string) => boolean;
  getFeatureStatus: (featureId: FeatureId | string) => FeatureStatus | null;
  getFeatureUsage: (featureId: FeatureId | string) => { used: number; limit: number | null; remaining: number | null } | null;
  refresh: () => Promise<void>;
}

const FeaturesContext = createContext<FeaturesContextType | null>(null);

interface FeaturesProviderProps {
  children: ReactNode;
}

/**
 * Provider component that fetches and provides feature access throughout the app
 */
export function FeaturesProvider({ children }: FeaturesProviderProps) {
  const [features, setFeatures] = useState<FeatureStatus[]>([]);
  const [definitions, setDefinitions] = useState<FeatureDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFeatures = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [tenantFeatures, featureDefinitions] = await Promise.all([
        featuresApi.getTenantFeatures().catch(() => []),
        featuresApi.getDefinitions().catch(() => []),
      ]);

      setFeatures(tenantFeatures);
      setDefinitions(featureDefinitions);
    } catch (err: any) {
      setError(err.message || 'Failed to load features');
      console.error('Features fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeatures();
  }, [fetchFeatures]);

  const isFeatureEnabled = useCallback(
    (featureId: FeatureId | string): boolean => {
      const feature = features.find((f) => f.featureId === featureId);
      return feature?.enabled ?? false;
    },
    [features]
  );

  const canUseFeature = useCallback(
    (featureId: FeatureId | string): boolean => {
      const feature = features.find((f) => f.featureId === featureId);
      return feature?.canUse ?? false;
    },
    [features]
  );

  const getFeatureStatus = useCallback(
    (featureId: FeatureId | string): FeatureStatus | null => {
      return features.find((f) => f.featureId === featureId) ?? null;
    },
    [features]
  );

  const getFeatureUsage = useCallback(
    (featureId: FeatureId | string): { used: number; limit: number | null; remaining: number | null } | null => {
      const feature = features.find((f) => f.featureId === featureId);
      if (!feature || !feature.usageLimited) return null;
      return {
        used: feature.used,
        limit: feature.limit,
        remaining: feature.remaining,
      };
    },
    [features]
  );

  const value = useMemo<FeaturesContextType>(
    () => ({
      features,
      definitions,
      isLoading,
      error,
      isFeatureEnabled,
      canUseFeature,
      getFeatureStatus,
      getFeatureUsage,
      refresh: fetchFeatures,
    }),
    [features, definitions, isLoading, error, isFeatureEnabled, canUseFeature, getFeatureStatus, getFeatureUsage, fetchFeatures]
  );

  return <FeaturesContext.Provider value={value}>{children}</FeaturesContext.Provider>;
}

/**
 * Hook to access the features context
 */
export function useFeatures(): FeaturesContextType {
  const context = useContext(FeaturesContext);
  if (!context) {
    throw new Error('useFeatures must be used within a FeaturesProvider');
  }
  return context;
}

/**
 * Hook to check a specific feature's status
 */
export function useFeature(featureId: FeatureId | string) {
  const { isFeatureEnabled, canUseFeature, getFeatureStatus, getFeatureUsage, isLoading, error } = useFeatures();

  return {
    isEnabled: isFeatureEnabled(featureId),
    canUse: canUseFeature(featureId),
    status: getFeatureStatus(featureId),
    usage: getFeatureUsage(featureId),
    isLoading,
    error,
  };
}

/**
 * Hook to check if a feature can be used (for conditional rendering)
 */
export function useCanUseFeature(featureId: FeatureId | string): boolean {
  const { canUseFeature } = useFeatures();
  return canUseFeature(featureId);
}

/**
 * Hook to check if a feature is enabled (regardless of usage limits)
 */
export function useIsFeatureEnabled(featureId: FeatureId | string): boolean {
  const { isFeatureEnabled } = useFeatures();
  return isFeatureEnabled(featureId);
}

/**
 * Hook to get feature usage information
 */
export function useFeatureUsage(featureId: FeatureId | string) {
  const { getFeatureUsage, isLoading } = useFeatures();
  const usage = getFeatureUsage(featureId);

  return {
    isLoading,
    hasLimit: usage !== null,
    used: usage?.used ?? 0,
    limit: usage?.limit ?? null,
    remaining: usage?.remaining ?? null,
    percentUsed: usage && usage.limit ? Math.round((usage.used / usage.limit) * 100) : 0,
    isNearLimit: usage && usage.limit ? usage.used >= usage.limit * 0.8 : false,
    isAtLimit: usage && usage.limit ? usage.used >= usage.limit : false,
  };
}


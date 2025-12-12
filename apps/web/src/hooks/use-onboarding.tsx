'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth/auth-provider';

interface OnboardingProgress {
  currentStep: string;
  completedSteps: string[];
  isComplete: boolean;
  percentComplete: number;
  nextAction?: {
    title: string;
    description: string;
    actionUrl: string;
  };
}

interface FeaturePrompt {
  id: string;
  title: string;
  description: string;
  actionUrl?: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export function useOnboarding() {
  const { accessToken: token, user } = useAuth();
  const [progress, setProgress] = useState<OnboardingProgress | null>(null);
  const [featurePrompts, setFeaturePrompts] = useState<FeaturePrompt[]>([]);
  const [showTour, setShowTour] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProgress = useCallback(async () => {
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE}/onboarding/progress`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProgress(data);

        // Show tour if onboarding not complete and not dismissed
        if (!data.isComplete && data.currentStep === 'welcome') {
          setShowTour(true);
        }
      }
    } catch (error) {
      console.error('Failed to fetch onboarding progress:', error);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const fetchFeaturePrompts = useCallback(async () => {
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE}/onboarding/features/prompts`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setFeaturePrompts(data);
      }
    } catch (error) {
      console.error('Failed to fetch feature prompts:', error);
    }
  }, [token]);

  useEffect(() => {
    fetchProgress();
    fetchFeaturePrompts();
  }, [fetchProgress, fetchFeaturePrompts]);

  const completeTour = useCallback(async () => {
    if (!token) return;

    try {
      await fetch(`${API_BASE}/onboarding/complete`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      setShowTour(false);
      setProgress(prev => prev ? { ...prev, isComplete: true } : null);
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
    }
  }, [token]);

  const dismissTour = useCallback(async () => {
    if (!token) return;

    try {
      await fetch(`${API_BASE}/onboarding/dismiss`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      setShowTour(false);
    } catch (error) {
      console.error('Failed to dismiss onboarding:', error);
    }
  }, [token]);

  const dismissFeaturePrompt = useCallback(async (featureId: string) => {
    if (!token) return;

    try {
      await fetch(`${API_BASE}/onboarding/features/${featureId}/dismiss`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ featureId }),
      });

      setFeaturePrompts(prev => prev.filter(p => p.id !== featureId));
    } catch (error) {
      console.error('Failed to dismiss feature prompt:', error);
    }
  }, [token]);

  const markFeatureDiscovered = useCallback(async (featureId: string) => {
    if (!token) return;

    try {
      await fetch(`${API_BASE}/onboarding/features/${featureId}/discovered`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ featureId }),
      });

      setFeaturePrompts(prev => prev.filter(p => p.id !== featureId));
    } catch (error) {
      console.error('Failed to mark feature discovered:', error);
    }
  }, [token]);

  return {
    progress,
    featurePrompts,
    showTour,
    isLoading,
    completeTour,
    dismissTour,
    dismissFeaturePrompt,
    markFeatureDiscovered,
    refreshProgress: fetchProgress,
  };
}


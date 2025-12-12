'use client';

import { useState, useEffect } from 'react';
import { 
  Briefcase, 
  Users, 
  Zap, 
  User, 
  AlertTriangle,
  TrendingUp,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import { usageApi, UsageStats } from '@/lib/api/client';
import Link from 'next/link';

interface UsageBarProps {
  label: string;
  icon: React.ReactNode;
  current: number;
  max: number;
  percent: number;
  color: string;
}

function UsageBar({ label, icon, current, max, percent, color }: UsageBarProps) {
  const isNearLimit = percent >= 80;
  const isAtLimit = percent >= 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          {icon}
          <span>{label}</span>
        </div>
        <span className={`font-medium ${isAtLimit ? 'text-red-600' : isNearLimit ? 'text-amber-600' : 'text-foreground'}`}>
          {current} / {max === -1 ? '∞' : max}
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isAtLimit ? 'bg-red-500' : isNearLimit ? 'bg-amber-500' : color
          }`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
    </div>
  );
}

export function UsageDisplay() {
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const data = await usageApi.getUsage();
        setUsage(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUsage();
  }, []);

  if (loading) {
    return (
      <div className="bg-card border rounded-xl p-6 animate-pulse">
        <div className="h-6 w-32 bg-muted rounded mb-4" />
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-full bg-muted rounded" />
              <div className="h-2 w-full bg-muted rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !usage) {
    return null; // Silently fail - don't break the dashboard
  }

  const hasWarnings = usage.warnings.length > 0;
  const isPersonal = usage.workspaceType === 'personal';
  const isFree = usage.subscriptionTier === 'free';

  return (
    <div className="bg-card border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Usage</h3>
          {isFree && (
            <span className="px-2 py-0.5 text-xs font-medium bg-muted rounded-full">
              Free Plan
            </span>
          )}
        </div>
        {isPersonal && isFree && (
          <Link
            href="/dashboard/settings/billing"
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            Upgrade
            <ArrowUpRight className="w-3 h-3" />
          </Link>
        )}
      </div>

      {/* Usage bars */}
      <div className="p-6 space-y-5">
        <UsageBar
          label="Active Jobs"
          icon={<Briefcase className="w-4 h-4" />}
          current={usage.activeJobs}
          max={usage.maxJobs}
          percent={usage.jobsPercent}
          color="bg-blue-500"
        />

        <UsageBar
          label="Candidates"
          icon={<Users className="w-4 h-4" />}
          current={usage.totalCandidates}
          max={usage.maxCandidates}
          percent={usage.candidatesPercent}
          color="bg-green-500"
        />

        <UsageBar
          label="AI Scores (this month)"
          icon={<Zap className="w-4 h-4" />}
          current={usage.aiScoresThisMonth}
          max={usage.maxAiScoresPerMonth}
          percent={usage.aiScoresPercent}
          color="bg-purple-500"
        />

        {usage.workspaceType === 'company' && (
          <UsageBar
            label="Team Members"
            icon={<User className="w-4 h-4" />}
            current={usage.teamMembers}
            max={usage.maxTeamMembers}
            percent={usage.teamPercent}
            color="bg-orange-500"
          />
        )}
      </div>

      {/* Warnings */}
      {hasWarnings && (
        <div className="px-6 pb-6">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
              <div className="text-sm text-amber-800">
                {usage.warnings.map((warning, i) => (
                  <p key={i}>{warning}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade prompt for free users */}
      {isPersonal && isFree && (usage.jobsPercent >= 60 || usage.candidatesPercent >= 60 || usage.aiScoresPercent >= 60) && (
        <div className="px-6 pb-6">
          <Link
            href="/dashboard/settings/billing"
            className="block bg-gradient-to-r from-primary to-purple-600 text-white rounded-lg p-4 hover:opacity-90 transition-opacity"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Upgrade to Pro</p>
                <p className="text-sm text-white/80">Get 10x more jobs, candidates & AI scores</p>
              </div>
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}

export function UsageCompact() {
  const [usage, setUsage] = useState<UsageStats | null>(null);

  useEffect(() => {
    usageApi.getUsage().then(setUsage).catch(() => {});
  }, []);

  if (!usage) return null;

  const mostUsedPercent = Math.max(usage.jobsPercent, usage.candidatesPercent, usage.aiScoresPercent);
  const isNearLimit = mostUsedPercent >= 80;

  if (!isNearLimit) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-sm">
      <AlertTriangle className="w-4 h-4 text-amber-600" />
      <span className="text-amber-800">
        {usage.jobsPercent >= 80 && `${usage.jobsPercent}% jobs used`}
        {usage.candidatesPercent >= 80 && `${usage.candidatesPercent}% candidates used`}
        {usage.aiScoresPercent >= 80 && `${usage.aiScoresPercent}% AI scores used`}
      </span>
      <Link href="/dashboard/settings/billing" className="text-amber-800 font-medium hover:underline">
        Upgrade
      </Link>
    </div>
  );
}


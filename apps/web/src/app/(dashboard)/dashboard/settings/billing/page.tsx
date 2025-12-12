'use client';

import { useState, useEffect } from 'react';
import { 
  Check, 
  Sparkles, 
  Zap, 
  Building2,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { usageApi, UsageStats, PricingTier } from '@/lib/api/client';
import { ConvertToCompanyModal } from '@/components/usage/convert-to-company-modal';

export default function BillingPage() {
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [tiers, setTiers] = useState<PricingTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConvertModal, setShowConvertModal] = useState(false);

  useEffect(() => {
    Promise.all([
      usageApi.getUsage(),
      usageApi.getPricing(),
    ])
      .then(([usageData, tiersData]) => {
        setUsage(usageData);
        setTiers(tiersData);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-96 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const currentTier = tiers.find(t => t.id === usage?.subscriptionTier) || tiers[0];
  const isPersonal = usage?.workspaceType === 'personal';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Billing & Plans</h1>
        <p className="text-muted-foreground">
          Manage your subscription and view pricing options
        </p>
      </div>

      {/* Current Plan */}
      {usage && (
        <div className="bg-card border rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-lg font-semibold">Current Plan</h2>
                <span className="px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full">
                  {currentTier?.name || 'Free'}
                </span>
              </div>
              <p className="text-muted-foreground text-sm">
                {isPersonal ? 'Personal workspace' : 'Company workspace'}
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">
                {currentTier?.priceLabel || '$0'}
                {currentTier?.price && <span className="text-base font-normal text-muted-foreground">/mo</span>}
              </div>
            </div>
          </div>

          {/* Usage summary */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="text-sm text-muted-foreground mb-1">Jobs</div>
              <div className="text-xl font-semibold">
                {usage.activeJobs} / {usage.maxJobs === -1 ? '∞' : usage.maxJobs}
              </div>
            </div>
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="text-sm text-muted-foreground mb-1">Candidates</div>
              <div className="text-xl font-semibold">
                {usage.totalCandidates} / {usage.maxCandidates === -1 ? '∞' : usage.maxCandidates}
              </div>
            </div>
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="text-sm text-muted-foreground mb-1">AI Scores</div>
              <div className="text-xl font-semibold">
                {usage.aiScoresThisMonth} / {usage.maxAiScoresPerMonth === -1 ? '∞' : usage.maxAiScoresPerMonth}
              </div>
            </div>
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="text-sm text-muted-foreground mb-1">Team</div>
              <div className="text-xl font-semibold">
                {usage.teamMembers} / {usage.maxTeamMembers === -1 ? '∞' : usage.maxTeamMembers}
              </div>
            </div>
          </div>

          {/* Warnings */}
          {usage.warnings.length > 0 && (
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  {usage.warnings.map((warning, i) => (
                    <p key={i} className="text-sm text-amber-800">{warning}</p>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Pricing Tiers */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Available Plans</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {tiers.map((tier) => {
            const isCurrent = tier.id === usage?.subscriptionTier;
            const isUpgrade = tier.price !== null && tier.price > (currentTier?.price || 0);
            
            return (
              <div
                key={tier.id}
                className={`relative bg-card border-2 rounded-xl p-6 ${
                  tier.popular ? 'border-primary' : 'border-border'
                } ${isCurrent ? 'ring-2 ring-primary/20' : ''}`}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-white text-xs font-medium rounded-full">
                    Most Popular
                  </div>
                )}

                <div className="mb-4">
                  <h3 className="text-xl font-bold">{tier.name}</h3>
                  <p className="text-sm text-muted-foreground">{tier.description}</p>
                </div>

                <div className="mb-6">
                  <span className="text-4xl font-bold">{tier.priceLabel}</span>
                  {tier.price && <span className="text-muted-foreground">/month</span>}
                </div>

                {/* Limits */}
                <div className="mb-4 pb-4 border-b">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-muted-foreground">Jobs</div>
                    <div className="font-medium text-right">
                      {tier.limits.maxJobs === -1 ? 'Unlimited' : tier.limits.maxJobs}
                    </div>
                    <div className="text-muted-foreground">Candidates</div>
                    <div className="font-medium text-right">
                      {tier.limits.maxCandidates === -1 ? 'Unlimited' : tier.limits.maxCandidates.toLocaleString()}
                    </div>
                    <div className="text-muted-foreground">AI Scores/mo</div>
                    <div className="font-medium text-right">
                      {tier.limits.maxAiScoresPerMonth === -1 ? 'Unlimited' : tier.limits.maxAiScoresPerMonth}
                    </div>
                    <div className="text-muted-foreground">Team</div>
                    <div className="font-medium text-right">
                      {tier.limits.maxTeamMembers === -1 ? 'Unlimited' : tier.limits.maxTeamMembers}
                    </div>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-2 mb-6">
                  {tier.features.slice(0, 4).map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-600 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Action button */}
                {isCurrent ? (
                  <button
                    disabled
                    className="w-full py-2 rounded-lg border font-medium bg-muted text-muted-foreground cursor-not-allowed"
                  >
                    Current Plan
                  </button>
                ) : tier.id === 'enterprise' ? (
                  <button className="w-full py-2 rounded-lg border-2 border-primary text-primary font-medium hover:bg-primary/5 transition-colors flex items-center justify-center gap-2">
                    Contact Sales
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : isUpgrade ? (
                  <button className="w-full py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                    Upgrade
                    <Sparkles className="w-4 h-4" />
                  </button>
                ) : (
                  <button className="w-full py-2 rounded-lg border font-medium hover:bg-muted transition-colors">
                    Select
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Convert to company workspace */}
      {isPersonal && (
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center">
              <Building2 className="w-7 h-7" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">Need a team workspace?</h3>
              <p className="text-white/70">
                Convert to a company account to invite team members and collaborate on hiring
              </p>
            </div>
            <button 
              onClick={() => setShowConvertModal(true)}
              className="px-6 py-3 bg-white text-slate-900 rounded-lg font-medium hover:bg-white/90 transition-colors flex items-center gap-2"
            >
              <Zap className="w-4 h-4" />
              Convert to Team
            </button>
          </div>
        </div>
      )}

      {/* Convert Modal */}
      <ConvertToCompanyModal
        isOpen={showConvertModal}
        onClose={() => setShowConvertModal(false)}
      />

      {/* FAQ */}
      <div className="bg-card border rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Frequently Asked Questions</h2>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-1">How do AI scores work?</h4>
            <p className="text-sm text-muted-foreground">
              Each time you upload a resume to a job posting, our AI analyzes it and provides a match score. 
              This counts as one AI score usage.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-1">When do usage limits reset?</h4>
            <p className="text-sm text-muted-foreground">
              AI score limits reset on the 1st of each month. Jobs and candidates are lifetime limits.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-1">Can I downgrade my plan?</h4>
            <p className="text-sm text-muted-foreground">
              Yes, you can downgrade at any time. Your current usage will be preserved, but you won't be able to add more 
              items if you exceed the new plan's limits.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


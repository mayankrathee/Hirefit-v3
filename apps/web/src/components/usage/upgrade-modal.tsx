'use client';

import { useState, useEffect } from 'react';
import { X, Check, Sparkles, Zap } from 'lucide-react';
import { usageApi, PricingTier } from '@/lib/api/client';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason?: string;
}

export function UpgradeModal({ isOpen, onClose, reason }: UpgradeModalProps) {
  const [tiers, setTiers] = useState<PricingTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTier, setSelectedTier] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      usageApi.getPricing()
        .then(setTiers)
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const paidTiers = tiers.filter(t => t.id !== 'free' && t.id !== 'enterprise');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-muted rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="px-8 pt-8 pb-6 text-center border-b">
          <div className="w-14 h-14 bg-gradient-to-br from-primary to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Upgrade Your Plan</h2>
          {reason ? (
            <p className="text-muted-foreground">{reason}</p>
          ) : (
            <p className="text-muted-foreground">
              Unlock more jobs, candidates, and AI-powered features
            </p>
          )}
        </div>

        {/* Pricing tiers */}
        <div className="p-8">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {paidTiers.map((tier) => (
                <div
                  key={tier.id}
                  className={`relative border-2 rounded-xl p-6 cursor-pointer transition-all ${
                    selectedTier === tier.id
                      ? 'border-primary bg-primary/5 ring-4 ring-primary/10'
                      : 'border-border hover:border-primary/50'
                  } ${tier.popular ? 'md:-mt-4 md:mb-4' : ''}`}
                  onClick={() => setSelectedTier(tier.id)}
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

                  <ul className="space-y-3 mb-6">
                    {tier.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-600 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    className={`w-full py-3 rounded-lg font-medium transition-colors ${
                      selectedTier === tier.id
                        ? 'bg-primary text-white hover:bg-primary/90'
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                  >
                    {selectedTier === tier.id ? 'Selected' : 'Select Plan'}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Enterprise callout */}
          <div className="mt-8 bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl p-6 text-white">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Need more? Go Enterprise</h3>
                <p className="text-sm text-white/70">
                  Unlimited everything, SSO, API access, and dedicated support
                </p>
              </div>
              <button className="px-4 py-2 bg-white text-slate-900 rounded-lg font-medium hover:bg-white/90 transition-colors">
                Contact Sales
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-6 border-t bg-muted/30 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            All plans include unlimited resume uploads and 24/7 support
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border rounded-lg hover:bg-muted transition-colors"
            >
              Maybe Later
            </button>
            <button
              disabled={!selectedTier}
              className="px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Upgrade Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


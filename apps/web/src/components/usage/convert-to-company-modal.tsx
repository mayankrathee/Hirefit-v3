'use client';

import { useState, useCallback, useEffect } from 'react';
import { X, Building2, Users, Zap, Check, Loader2 } from 'lucide-react';
import { tenantsApi } from '@/lib/api/client';

interface ConvertToCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ConvertToCompanyModal({ isOpen, onClose, onSuccess }: ConvertToCompanyModalProps) {
  const [companyName, setCompanyName] = useState('');
  const [companySlug, setCompanySlug] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Generate slug from company name
  useEffect(() => {
    if (companyName) {
      const slug = companyName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 50);
      setCompanySlug(slug);
    }
  }, [companyName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!companyName.trim()) {
      setError('Company name is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await tenantsApi.convertToCompany(companyName, companySlug);
      setSuccess(true);
      
      // Refresh the page after a brief delay to show success state
      setTimeout(() => {
        onSuccess?.();
        window.location.reload();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to convert workspace');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const benefits = [
    { icon: Users, text: 'Invite up to 5 team members' },
    { icon: Zap, text: '500 AI resume scores per month' },
    { icon: Building2, text: 'Company branding & custom URL' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-muted rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {success ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Conversion Complete!</h2>
            <p className="text-muted-foreground">
              Your workspace is now a company account. Refreshing...
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="px-8 pt-8 pb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-slate-900 to-slate-700 rounded-xl flex items-center justify-center mb-4">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Convert to Company</h2>
              <p className="text-muted-foreground">
                Upgrade your personal workspace to a team account and unlock collaboration features.
              </p>
            </div>

            {/* Benefits */}
            <div className="px-8 pb-6">
              <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                {benefits.map((benefit, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                      <benefit.icon className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-sm">{benefit.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-8 pb-8">
              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Acme Inc."
                    className="w-full px-4 py-3 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Company URL
                  </label>
                  <div className="flex items-center">
                    <span className="px-3 py-3 bg-muted rounded-l-lg border border-r-0 text-sm text-muted-foreground">
                      hirefit.com/
                    </span>
                    <input
                      type="text"
                      value={companySlug}
                      onChange={(e) => setCompanySlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      placeholder="acme"
                      className="flex-1 px-4 py-3 rounded-r-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 rounded-lg border font-medium hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !companyName.trim()}
                  className="flex-1 py-3 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Convert Now
                      <Zap className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              <p className="text-xs text-muted-foreground text-center mt-4">
                All your existing data will be preserved. This action cannot be undone.
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}


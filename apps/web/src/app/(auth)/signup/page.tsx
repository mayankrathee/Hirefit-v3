'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Sparkles, 
  ArrowRight, 
  Mail, 
  User,
  Loader2,
  CheckCircle,
  Briefcase,
  Users,
  Zap,
  Building2,
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [workspaceInfo, setWorkspaceInfo] = useState<{
    slug: string;
    limits: { maxJobs: number; maxCandidates: number; maxAiScoresPerMonth: number };
  } | null>(null);
  
  // Check if user wants company registration
  const isCompanyMode = searchParams.get('type') === 'company';
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const validateForm = () => {
    if (!formData.firstName.trim()) {
      setError('First name is required');
      return false;
    }
    if (!formData.lastName.trim()) {
      setError('Last name is required');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/tenants/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Signup failed');
      }

      const data = await response.json();
      const result = data.data || data;
      
      setWorkspaceInfo({
        slug: result.workspace.slug,
        limits: result.limits,
      });
      setRegistrationComplete(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Success view
  if (registrationComplete && workspaceInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Welcome to HireFit!</h1>
          <p className="text-muted-foreground mb-6">
            Your personal workspace is ready. Start screening candidates with AI.
          </p>
          
          {/* Free tier info */}
          <div className="bg-slate-50 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-medium mb-2 text-sm">Your Free Plan includes:</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>✓ {workspaceInfo.limits.maxJobs} active job postings</li>
              <li>✓ {workspaceInfo.limits.maxCandidates} candidates</li>
              <li>✓ {workspaceInfo.limits.maxAiScoresPerMonth} AI resume scores/month</li>
              <li>✓ Unlimited resume uploads</li>
            </ul>
          </div>
          
          <div className="space-y-3">
            <Link
              href="/login"
              className="block w-full bg-primary text-primary-foreground py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              Sign In to Your Workspace
            </Link>
            <p className="text-xs text-muted-foreground">
              Need a team? <Link href="/signup?type=company" className="text-primary hover:underline">Upgrade anytime</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Redirect to company registration if in company mode
  if (isCompanyMode) {
    return <CompanySignup />;
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold">HireFit</span>
          </div>

          <h1 className="text-3xl font-bold mb-2">Start hiring smarter</h1>
          <p className="text-muted-foreground mb-8">
            Create your free account in seconds. No credit card required.
          </p>

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  First Name
                </label>
                <input
                  name="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  placeholder="John"
                  className="w-full px-4 py-3 rounded-lg border bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Last Name
                </label>
                <input
                  name="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  placeholder="Doe"
                  className="w-full px-4 py-3 rounded-lg border bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                Work Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="john@example.com"
                  className="w-full pl-10 pr-4 py-3 rounded-lg border bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Create Free Account
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </div>

          {/* Company signup link */}
          <div className="mt-8 pt-6 border-t">
            <Link
              href="/signup?type=company"
              className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Building2 className="w-4 h-4" />
              Creating an account for your company?
            </Link>
          </div>

          <p className="mt-6 text-xs text-muted-foreground text-center">
            By signing up, you agree to our{' '}
            <Link href="/terms" className="underline">Terms</Link>
            {' '}and{' '}
            <Link href="/privacy" className="underline">Privacy Policy</Link>
          </p>
        </div>
      </div>

      {/* Right side - Features */}
      <div className="hidden lg:flex flex-1 bg-gradient-primary items-center justify-center p-12">
        <div className="max-w-lg text-white">
          <h2 className="text-4xl font-bold mb-6">
            AI-powered hiring for HR professionals
          </h2>
          <p className="text-white/80 text-lg mb-8">
            Screen resumes in seconds, not hours. HireFit uses AI to match candidates to your requirements.
          </p>
          
          <div className="space-y-4">
            {[
              { icon: Zap, title: 'Instant AI Scoring', description: 'Upload resumes, get instant match scores' },
              { icon: Briefcase, title: 'Manage Job Postings', description: 'Create jobs and track applicants' },
              { icon: User, title: 'Built for Individuals', description: 'Perfect for recruiters & HR consultants' },
              { icon: Users, title: 'Upgrade Anytime', description: 'Add your team when you need to' },
            ].map((feature) => (
              <div key={feature.title} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-medium">{feature.title}</h3>
                  <p className="text-white/70 text-sm">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Free tier badge */}
          <div className="mt-8 inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm">Free forever • No credit card</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Company signup component (secondary flow)
function CompanySignup() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registrationComplete, setRegistrationComplete] = useState(false);

  const [formData, setFormData] = useState({
    companyName: '',
    companySlug: '',
    industry: '',
    companySize: '',
    adminFirstName: '',
    adminLastName: '',
    adminEmail: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  // Generate slug from company name
  useEffect(() => {
    if (formData.companyName && !formData.companySlug) {
      const slug = formData.companyName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 50);
      setFormData(prev => ({ ...prev, companySlug: slug }));
    }
  }, [formData.companyName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/tenants/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Registration failed');
      }

      setRegistrationComplete(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (registrationComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-purple-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-purple-600" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Company Account Created!</h1>
          <p className="text-muted-foreground mb-6">
            Your team workspace is ready. Invite your colleagues and start hiring together.
          </p>
          <Link
            href="/login"
            className="block w-full bg-primary text-primary-foreground py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const industries = ['Technology', 'Healthcare', 'Finance', 'Education', 'Retail', 'Manufacturing', 'Professional Services', 'Other'];
  const companySizes = [
    { value: '1-10', label: '1-10 employees' },
    { value: '11-50', label: '11-50 employees' },
    { value: '51-200', label: '51-200 employees' },
    { value: '201-500', label: '201-500 employees' },
    { value: '500+', label: '500+ employees' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-purple-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold">HireFit</span>
        </div>

        <h1 className="text-2xl font-bold mb-2">Create Company Account</h1>
        <p className="text-muted-foreground mb-6">
          Set up your team workspace for collaborative hiring.
        </p>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {step === 1 && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1.5">Company Name</label>
                <input
                  name="companyName"
                  type="text"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  placeholder="Acme Inc."
                  className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Industry</label>
                <select
                  name="industry"
                  value={formData.industry}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select industry</option>
                  {industries.map(ind => <option key={ind} value={ind}>{ind}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Company Size</label>
                <select
                  name="companySize"
                  value={formData.companySize}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select size</option>
                  {companySizes.map(size => <option key={size.value} value={size.value}>{size.label}</option>)}
                </select>
              </div>
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!formData.companyName}
                className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                Continue
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">First Name</label>
                  <input
                    name="adminFirstName"
                    type="text"
                    value={formData.adminFirstName}
                    onChange={handleInputChange}
                    placeholder="John"
                    className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Last Name</label>
                  <input
                    name="adminLastName"
                    type="text"
                    value={formData.adminLastName}
                    onChange={handleInputChange}
                    placeholder="Doe"
                    className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Work Email</label>
                <input
                  name="adminEmail"
                  type="email"
                  value={formData.adminEmail}
                  onChange={handleInputChange}
                  placeholder="john@company.com"
                  className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 border py-3 rounded-lg font-medium hover:bg-muted transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-primary text-primary-foreground py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Company'}
                </button>
              </div>
            </>
          )}
        </form>

        <div className="mt-6 text-center">
          <Link href="/signup" className="text-sm text-muted-foreground hover:text-foreground">
            ← Back to individual signup
          </Link>
        </div>
      </div>
    </div>
  );
}

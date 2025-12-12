'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Users, 
  Briefcase, 
  FileText, 
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { jobsApi, candidatesApi, tenantsApi } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/auth-provider';
import { UsageDisplay } from '@/components/usage/usage-display';

interface DashboardStats {
  jobs: { total: number; open: number; draft: number; closed: number };
  candidates: { total: number; thisMonth: number; bySource: { source: string; count: number }[] };
  tenant: { users: number; jobs: number; candidates: number };
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentCandidates, setRecentCandidates] = useState<any[]>([]);
  const [recentJobs, setRecentJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const [jobStats, candidateStats, tenantStats, candidatesList, jobsList] = await Promise.all([
        jobsApi.stats().catch((e) => { console.warn('Jobs stats failed:', e); return { total: 0, open: 0, draft: 0, closed: 0 }; }),
        candidatesApi.stats().catch((e) => { console.warn('Candidates stats failed:', e); return { total: 0, thisMonth: 0, bySource: [] }; }),
        tenantsApi.getStats().catch((e) => { console.warn('Tenant stats failed:', e); return { users: 0, jobs: 0, candidates: 0 }; }),
        candidatesApi.list({ page: 1 }).catch((e) => { console.warn('Candidates list failed:', e); return { items: [], total: 0, page: 1, pageSize: 20 }; }),
        jobsApi.list({ page: 1 }).catch((e) => { console.warn('Jobs list failed:', e); return { items: [], total: 0, page: 1, pageSize: 20 }; }),
      ]);

      setStats({
        jobs: jobStats || { total: 0, open: 0, draft: 0, closed: 0 },
        candidates: candidateStats || { total: 0, thisMonth: 0, bySource: [] },
        tenant: tenantStats || { users: 0, jobs: 0, candidates: 0 },
      });
      setRecentCandidates((candidatesList?.items || []).slice(0, 5));
      setRecentJobs((jobsList?.items || []).slice(0, 5));
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      // Don't show error if we have some data
      if (!stats) {
        setError('Failed to load dashboard data');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const statCards: Array<{
    name: string;
    value: number;
    change: string;
    trend: 'up' | 'down' | 'neutral';
    icon: typeof Users;
    href: string;
  }> = [
    {
      name: 'Total Candidates',
      value: stats?.candidates.total || 0,
      change: `+${stats?.candidates.thisMonth || 0} this month`,
      trend: 'up',
      icon: Users,
      href: '/dashboard/candidates',
    },
    {
      name: 'Active Jobs',
      value: stats?.jobs.open || 0,
      change: `${stats?.jobs.draft || 0} drafts`,
      trend: 'up',
      icon: Briefcase,
      href: '/dashboard/jobs',
    },
    {
      name: 'Total Jobs',
      value: stats?.jobs.total || 0,
      change: `${stats?.jobs.closed || 0} closed`,
      trend: 'neutral',
      icon: FileText,
      href: '/dashboard/jobs',
    },
    {
      name: 'Team Members',
      value: stats?.tenant.users || 0,
      change: 'Active users',
      trend: 'up',
      icon: TrendingUp,
      href: '/dashboard/settings',
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-48 bg-muted rounded animate-pulse" />
            <div className="h-4 w-64 bg-muted rounded animate-pulse mt-2" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-card rounded-xl border p-6">
              <div className="h-20 bg-muted rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.firstName || 'there'}! Here's what's happening with your hiring.
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={fetchDashboardData}
            className="p-2 rounded-lg border hover:bg-muted transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link
            href="/dashboard/jobs/new"
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Job
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Link
            key={stat.name}
            href={stat.href}
            className="bg-card rounded-xl border p-6 hover:border-primary/50 hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between">
              <stat.icon className="w-5 h-5 text-muted-foreground" />
              <span 
                className={`inline-flex items-center text-sm ${
                  stat.trend === 'up' ? 'text-green-600' : 
                  stat.trend === 'down' ? 'text-red-600' : 
                  'text-muted-foreground'
                }`}
              >
                {stat.change}
                {stat.trend === 'up' && <ArrowUpRight className="w-4 h-4 ml-1" />}
                {stat.trend === 'down' && <ArrowDownRight className="w-4 h-4 ml-1" />}
              </span>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-bold">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.name}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link
          href="/dashboard/jobs/new"
          className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-6 hover:from-blue-600 hover:to-blue-700 transition-all"
        >
          <Briefcase className="w-8 h-8 mb-3" />
          <h3 className="font-semibold text-lg">Post a Job</h3>
          <p className="text-white/80 text-sm mt-1">Create a new job posting and start receiving candidates</p>
        </Link>
        <Link
          href="/dashboard/candidates/new"
          className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-xl p-6 hover:from-emerald-600 hover:to-emerald-700 transition-all"
        >
          <Users className="w-8 h-8 mb-3" />
          <h3 className="font-semibold text-lg">Add Candidate</h3>
          <p className="text-white/80 text-sm mt-1">Manually add a candidate to your talent pool</p>
        </Link>
        <Link
          href="/dashboard/candidates"
          className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-6 hover:from-purple-600 hover:to-purple-700 transition-all"
        >
          <FileText className="w-8 h-8 mb-3" />
          <h3 className="font-semibold text-lg">Upload Resumes</h3>
          <p className="text-white/80 text-sm mt-1">Bulk upload resumes for AI-powered screening</p>
        </Link>
      </div>

      {/* Recent Activity & Usage */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Usage Display */}
        <div className="lg:col-span-1">
          <UsageDisplay />
        </div>
        
        {/* Recent Candidates */}
        <div className="bg-card rounded-xl border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Recent Candidates</h2>
            <Link href="/dashboard/candidates" className="text-sm text-primary hover:underline">
              View all →
            </Link>
          </div>
          {recentCandidates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No candidates yet</p>
              <Link href="/dashboard/candidates/new" className="text-primary hover:underline text-sm">
                Add your first candidate
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {recentCandidates.map((candidate) => (
                <Link
                  key={candidate.id}
                  href={`/dashboard/candidates/${candidate.id}`}
                  className="flex items-center justify-between py-3 border-b last:border-0 hover:bg-muted/50 -mx-2 px-2 rounded transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">
                        {candidate.firstName?.[0]}{candidate.lastName?.[0]}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium">{candidate.firstName} {candidate.lastName}</div>
                      <div className="text-sm text-muted-foreground">{candidate.email}</div>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {candidate.source || 'Direct'}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Jobs */}
        <div className="bg-card rounded-xl border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Recent Jobs</h2>
            <Link href="/dashboard/jobs" className="text-sm text-primary hover:underline">
              View all →
            </Link>
          </div>
          {recentJobs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No jobs posted yet</p>
              <Link href="/dashboard/jobs/new" className="text-primary hover:underline text-sm">
                Post your first job
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {recentJobs.map((job) => (
                <Link
                  key={job.id}
                  href={`/dashboard/jobs/${job.id}`}
                  className="flex items-center justify-between py-3 border-b last:border-0 hover:bg-muted/50 -mx-2 px-2 rounded transition-colors"
                >
                  <div>
                    <div className="font-medium">{job.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {job.department || 'No department'} • {job.location || 'Remote'}
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    job.status === 'open' ? 'bg-green-100 text-green-700' :
                    job.status === 'draft' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {job.status}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Source Distribution */}
      {stats?.candidates.bySource && stats.candidates.bySource.length > 0 && (
        <div className="bg-card rounded-xl border p-6">
          <h2 className="font-semibold mb-4">Candidate Sources</h2>
          <div className="grid gap-4 md:grid-cols-4">
            {stats.candidates.bySource.map((source) => (
              <div key={source.source} className="bg-muted/50 rounded-lg p-4">
                <div className="text-2xl font-bold">{source.count}</div>
                <div className="text-sm text-muted-foreground capitalize">
                  {source.source || 'Direct'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

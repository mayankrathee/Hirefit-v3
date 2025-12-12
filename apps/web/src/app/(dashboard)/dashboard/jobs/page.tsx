'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical,
  Briefcase,
  MapPin,
  Clock,
  Users,
  ChevronLeft,
  ChevronRight,
  Upload,
} from 'lucide-react';
import { jobsApi } from '@/lib/api/client';

interface Job {
  id: string;
  title: string;
  description: string;
  department: string | null;
  location: string | null;
  locationType: string;
  status: string;
  employmentType: string;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string;
  createdAt: string;
  _count?: {
    applications: number;
  };
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchJobs = async () => {
    setIsLoading(true);
    try {
      const params: any = { page: String(page) };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      
      const data = await jobsApi.list(params);
      setJobs(data?.items || []);
      setTotal(data?.total || 0);
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
      setJobs([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [page, statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchJobs();
  };

  const totalPages = Math.ceil(total / 20);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-700';
      case 'draft': return 'bg-yellow-100 text-yellow-700';
      case 'paused': return 'bg-orange-100 text-orange-700';
      case 'closed': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const formatSalary = (min: number | null, max: number | null, currency: string) => {
    if (!min && !max) return 'Not specified';
    const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 });
    if (min && max) return `${formatter.format(min)} - ${formatter.format(max)}`;
    if (min) return `From ${formatter.format(min)}`;
    if (max) return `Up to ${formatter.format(max)}`;
    return 'Not specified';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Jobs</h1>
          <p className="text-muted-foreground">Manage your job postings</p>
        </div>
        <Link
          href="/dashboard/jobs/new"
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Job
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <form onSubmit={handleSearch} className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search jobs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </form>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-4 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="open">Open</option>
            <option value="paused">Paused</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Jobs List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card rounded-xl border p-6">
              <div className="h-24 bg-muted rounded animate-pulse" />
            </div>
          ))}
        </div>
      ) : !jobs || jobs.length === 0 ? (
        <div className="bg-card rounded-xl border p-12 text-center">
          <Briefcase className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="text-lg font-semibold mb-2">No jobs found</h3>
          <p className="text-muted-foreground mb-4">
            {search || statusFilter ? 'Try adjusting your filters' : 'Create your first job posting to get started'}
          </p>
          <Link
            href="/dashboard/jobs/new"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Job
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="bg-card rounded-xl border p-6 hover:border-primary/50 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between">
                <Link href={`/dashboard/jobs/${job.id}`} className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold hover:text-primary transition-colors">{job.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                      {job.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    {job.department && (
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-4 h-4" />
                        {job.department}
                      </span>
                    )}
                    {job.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {job.location}
                        {job.locationType !== 'onsite' && ` (${job.locationType})`}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {job.employmentType.replace('_', ' ')}
                    </span>
                    {job._count && (
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {job._count.applications} applicants
                      </span>
                    )}
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
                    {job.description}
                  </p>
                </Link>
                <div className="flex items-start gap-3 ml-4">
                  {job.status === 'open' && (
                    <Link
                      href={`/dashboard/jobs/${job.id}#upload`}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
                      title="Upload resumes for this job"
                    >
                      <Upload className="w-4 h-4" />
                      Upload
                    </Link>
                  )}
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(job.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {((page - 1) * 20) + 1} - {Math.min(page * 20, total)} of {total} jobs
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 text-sm">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


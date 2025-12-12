'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Plus, 
  Search,
  Users,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Tag,
} from 'lucide-react';
import { candidatesApi } from '@/lib/api/client';

interface Candidate {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  linkedInUrl: string | null;
  source: string | null;
  tags: string;
  createdAt: string;
  _count?: {
    applications: number;
    resumes: number;
  };
}

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string>('');

  const fetchCandidates = async () => {
    setIsLoading(true);
    try {
      const params: any = { page: String(page) };
      if (search) params.search = search;
      if (sourceFilter) params.source = sourceFilter;
      
      const data = await candidatesApi.list(params);
      setCandidates(data?.items || []);
      setTotal(data?.total || 0);
    } catch (err) {
      console.error('Failed to fetch candidates:', err);
      setCandidates([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, [page, sourceFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchCandidates();
  };

  const totalPages = Math.ceil(total / 20);

  const parseTags = (tags: string): string[] => {
    try {
      return JSON.parse(tags || '[]');
    } catch {
      return [];
    }
  };

  const getSourceColor = (source: string | null) => {
    switch (source?.toLowerCase()) {
      case 'linkedin': return 'bg-blue-100 text-blue-700';
      case 'indeed': return 'bg-purple-100 text-purple-700';
      case 'referral': return 'bg-green-100 text-green-700';
      case 'direct': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Candidates</h1>
          <p className="text-muted-foreground">Manage your candidate pipeline</p>
        </div>
        <Link
          href="/dashboard/candidates/new"
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Candidate
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <form onSubmit={handleSearch} className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </form>
        <select
          value={sourceFilter}
          onChange={(e) => { setSourceFilter(e.target.value); setPage(1); }}
          className="px-4 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">All Sources</option>
          <option value="linkedin">LinkedIn</option>
          <option value="indeed">Indeed</option>
          <option value="referral">Referral</option>
          <option value="direct">Direct</option>
        </select>
      </div>

      {/* Candidates List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card rounded-xl border p-6">
              <div className="h-20 bg-muted rounded animate-pulse" />
            </div>
          ))}
        </div>
      ) : !candidates || candidates.length === 0 ? (
        <div className="bg-card rounded-xl border p-12 text-center">
          <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="text-lg font-semibold mb-2">No candidates found</h3>
          <p className="text-muted-foreground mb-4">
            {search || sourceFilter ? 'Try adjusting your filters' : 'Add your first candidate to get started'}
          </p>
          <Link
            href="/dashboard/candidates/new"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Candidate
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {candidates.map((candidate) => (
            <Link
              key={candidate.id}
              href={`/dashboard/candidates/${candidate.id}`}
              className="block bg-card rounded-xl border p-6 hover:border-primary/50 hover:shadow-md transition-all"
            >
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg font-semibold text-primary">
                    {candidate.firstName?.[0]}{candidate.lastName?.[0]}
                  </span>
                </div>

                {/* Main Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-semibold">
                      {candidate.firstName} {candidate.lastName}
                    </h3>
                    {candidate.source && (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getSourceColor(candidate.source)}`}>
                        {candidate.source}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      {candidate.email}
                    </span>
                    {candidate.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-4 h-4" />
                        {candidate.phone}
                      </span>
                    )}
                    {(candidate.city || candidate.state || candidate.country) && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {[candidate.city, candidate.state, candidate.country].filter(Boolean).join(', ')}
                      </span>
                    )}
                    {candidate.linkedInUrl && (
                      <span className="flex items-center gap-1 text-blue-600">
                        <Linkedin className="w-4 h-4" />
                        LinkedIn
                      </span>
                    )}
                  </div>

                  {/* Tags */}
                  {parseTags(candidate.tags).length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {parseTags(candidate.tags).slice(0, 5).map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-muted text-xs"
                        >
                          <Tag className="w-3 h-3" />
                          {tag}
                        </span>
                      ))}
                      {parseTags(candidate.tags).length > 5 && (
                        <span className="text-xs text-muted-foreground">
                          +{parseTags(candidate.tags).length - 5} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="text-right text-sm">
                  <div className="text-muted-foreground">
                    {candidate._count?.applications || 0} applications
                  </div>
                  <div className="text-muted-foreground">
                    {candidate._count?.resumes || 0} resumes
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    Added {new Date(candidate.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {((page - 1) * 20) + 1} - {Math.min(page * 20, total)} of {total} candidates
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


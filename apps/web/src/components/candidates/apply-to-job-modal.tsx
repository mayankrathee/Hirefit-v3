'use client';

import { useState, useEffect } from 'react';
import { X, Briefcase, Loader2, Check, Search } from 'lucide-react';
import { jobsApi, applicationsApi } from '@/lib/api/client';

interface ApplyToJobModalProps {
  candidateId: string;
  candidateName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface Job {
  id: string;
  title: string;
  department: string | null;
  location: string | null;
  status: string;
}

export function ApplyToJobModal({
  candidateId,
  candidateName,
  isOpen,
  onClose,
  onSuccess,
}: ApplyToJobModalProps) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchJobs();
    }
  }, [isOpen]);

  const fetchJobs = async () => {
    setIsLoading(true);
    try {
      const response = await jobsApi.list({ status: 'open' });
      setJobs(response.items || []);
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
      setError('Failed to load available jobs');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedJobId) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await applicationsApi.create({
        candidateId,
        jobId: selectedJobId,
        coverLetter: notes || undefined,
      });
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create application');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredJobs = jobs.filter(
    (job) =>
      job.title.toLowerCase().includes(search.toLowerCase()) ||
      job.department?.toLowerCase().includes(search.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-card border rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-lg font-semibold">Apply to Job</h2>
            <p className="text-sm text-muted-foreground">
              Link {candidateName} to a job opening
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search jobs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Job List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Briefcase className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No open jobs found</p>
              <p className="text-sm">Create a job posting first</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredJobs.map((job) => (
                <button
                  key={job.id}
                  onClick={() => setSelectedJobId(job.id)}
                  className={`
                    w-full flex items-center justify-between p-4 rounded-lg border text-left transition-all
                    ${
                      selectedJobId === job.id
                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                        : 'hover:border-primary/50 hover:bg-muted/50'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`
                      w-10 h-10 rounded-lg flex items-center justify-center
                      ${selectedJobId === job.id ? 'bg-primary text-primary-foreground' : 'bg-muted'}
                    `}
                    >
                      <Briefcase className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-medium">{job.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {[job.department, job.location].filter(Boolean).join(' • ')}
                      </div>
                    </div>
                  </div>
                  {selectedJobId === job.id && (
                    <Check className="w-5 h-5 text-primary" />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Notes */}
          {selectedJobId && (
            <div className="mt-4">
              <label className="block text-sm font-medium mb-2">
                Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about this application..."
                rows={3}
                className="w-full px-4 py-3 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-muted/30">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg font-medium hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedJobId || isSubmitting}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Application'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}


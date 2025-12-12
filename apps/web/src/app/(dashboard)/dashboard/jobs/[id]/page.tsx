'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Play, 
  Pause, 
  XCircle,
  Briefcase,
  MapPin,
  Clock,
  DollarSign,
  Users,
  Calendar,
  MoreVertical,
  Loader2,
} from 'lucide-react';
import { jobsApi, applicationsApi } from '@/lib/api/client';
import { JobResumeUpload } from '@/components/jobs/job-resume-upload';

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
  requirements: string;
  scoringRubric: string;
  pipelineStages: string;
  publishedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  _count?: {
    applications: number;
    interviews: number;
  };
}

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [applicants, setApplicants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const fetchJob = async () => {
    try {
      const [jobData, applicantsData] = await Promise.all([
        jobsApi.get(params.id as string),
        applicationsApi.list({ jobId: params.id as string }).catch(() => ({ items: [] })),
      ]);
      setJob(jobData);
      setApplicants(applicantsData.items || []);
    } catch (err) {
      console.error('Failed to fetch job:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJob();
  }, [params.id]);

  const handlePublish = async () => {
    if (!job) return;
    setIsActionLoading(true);
    try {
      await jobsApi.publish(job.id);
      fetchJob();
    } catch (err) {
      console.error('Failed to publish:', err);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handlePause = async () => {
    if (!job) return;
    setIsActionLoading(true);
    try {
      await jobsApi.pause(job.id);
      fetchJob();
    } catch (err) {
      console.error('Failed to pause:', err);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleClose = async () => {
    if (!job) return;
    setIsActionLoading(true);
    try {
      await jobsApi.close(job.id);
      fetchJob();
    } catch (err) {
      console.error('Failed to close:', err);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!job) return;
    setIsActionLoading(true);
    try {
      await jobsApi.delete(job.id);
      router.push('/dashboard/jobs');
    } catch (err) {
      console.error('Failed to delete:', err);
      setIsActionLoading(false);
    }
  };

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-2">Job not found</h2>
        <Link href="/dashboard/jobs" className="text-primary hover:underline">
          Back to Jobs
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link 
            href="/dashboard/jobs" 
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Jobs
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{job.title}</h1>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(job.status)}`}>
              {job.status}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
            {job.department && (
              <span className="flex items-center gap-1">
                <Briefcase className="w-4 h-4" />
                {job.department}
              </span>
            )}
            {job.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {job.location} ({job.locationType})
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {job.employmentType.replace('_', ' ')}
            </span>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-2">
          {job.status === 'draft' && (
            <button
              onClick={handlePublish}
              disabled={isActionLoading}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <Play className="w-4 h-4" />
              Publish
            </button>
          )}
          {job.status === 'open' && (
            <button
              onClick={handlePause}
              disabled={isActionLoading}
              className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-700 transition-colors disabled:opacity-50"
            >
              <Pause className="w-4 h-4" />
              Pause
            </button>
          )}
          {job.status === 'paused' && (
            <button
              onClick={handlePublish}
              disabled={isActionLoading}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <Play className="w-4 h-4" />
              Resume
            </button>
          )}
          {(job.status === 'open' || job.status === 'paused') && (
            <button
              onClick={handleClose}
              disabled={isActionLoading}
              className="flex items-center gap-2 border px-4 py-2 rounded-lg font-medium hover:bg-muted transition-colors disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" />
              Close
            </button>
          )}
          <Link
            href={`/dashboard/jobs/${job.id}/edit`}
            className="flex items-center gap-2 border px-4 py-2 rounded-lg font-medium hover:bg-muted transition-colors"
          >
            <Edit className="w-4 h-4" />
            Edit
          </Link>
          {job.status === 'draft' && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 border border-red-200 text-red-600 px-4 py-2 rounded-lg font-medium hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="bg-card rounded-xl border p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Users className="w-4 h-4" />
            <span className="text-sm">Applicants</span>
          </div>
          <div className="text-2xl font-bold">{job._count?.applications || 0}</div>
        </div>
        <div className="bg-card rounded-xl border p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">Interviews</span>
          </div>
          <div className="text-2xl font-bold">{job._count?.interviews || 0}</div>
        </div>
        <div className="bg-card rounded-xl border p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <DollarSign className="w-4 h-4" />
            <span className="text-sm">Salary Range</span>
          </div>
          <div className="text-lg font-bold">
            {formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency)}
          </div>
        </div>
        <div className="bg-card rounded-xl border p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">Posted</span>
          </div>
          <div className="text-lg font-bold">
            {job.publishedAt 
              ? new Date(job.publishedAt).toLocaleDateString()
              : 'Not published'
            }
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="bg-card rounded-xl border p-6">
        <h2 className="font-semibold mb-4">Job Description</h2>
        <div className="prose prose-sm max-w-none whitespace-pre-wrap">
          {job.description}
        </div>
      </div>

      {/* Upload Resumes */}
      {job.status === 'open' && (
        <div className="bg-card rounded-xl border p-6">
          <h2 className="font-semibold mb-4">Upload Resumes for AI Evaluation</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Upload candidate resumes to automatically evaluate them against this job. 
            AI will parse the resume, create the candidate, and score them.
          </p>
          <JobResumeUpload jobId={job.id} onUploadComplete={fetchJob} />
        </div>
      )}

      {/* Applicants */}
      <div className="bg-card rounded-xl border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Applicants ({applicants.length})</h2>
        </div>
        {applicants.length > 0 ? (
          <div className="space-y-3">
            {applicants.map((app) => (
              <div
                key={app.id}
                className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors group"
              >
                <Link 
                  href={`/dashboard/candidates/${app.candidate?.id}`}
                  className="flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary">
                      {app.candidate?.firstName?.[0]}{app.candidate?.lastName?.[0]}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium hover:text-primary">
                      {app.candidate?.firstName} {app.candidate?.lastName}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {app.candidate?.email}
                    </div>
                  </div>
                </Link>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    app.status === 'hired' ? 'bg-green-100 text-green-700' :
                    app.status === 'rejected' ? 'bg-red-100 text-red-700' :
                    app.status === 'interviewing' ? 'bg-purple-100 text-purple-700' :
                    app.status === 'offer' ? 'bg-orange-100 text-orange-700' :
                    app.status === 'screening' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {app.status}
                  </span>
                  <select
                    value={app.status}
                    onChange={async (e) => {
                      try {
                        await applicationsApi.updateStatus(app.id, e.target.value);
                        fetchJob();
                      } catch (err) {
                        console.error('Failed to update status:', err);
                      }
                    }}
                    className="text-sm border rounded px-2 py-1 bg-background opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <option value="new">New</option>
                    <option value="screening">Screening</option>
                    <option value="interviewing">Interviewing</option>
                    <option value="offer">Offer</option>
                    <option value="hired">Hired</option>
                    <option value="rejected">Rejected</option>
                    <option value="withdrawn">Withdrawn</option>
                  </select>
                  <span className="text-xs text-muted-foreground">
                    Applied {new Date(app.appliedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No applicants yet</p>
            <p className="text-sm">Candidates who apply will appear here</p>
          </div>
        )}
      </div>

      {/* Meta Info */}
      <div className="bg-card rounded-xl border p-6">
        <h2 className="font-semibold mb-4">Additional Information</h2>
        <div className="grid gap-4 md:grid-cols-2 text-sm">
          <div>
            <span className="text-muted-foreground">Created by:</span>
            <span className="ml-2 font-medium">
              {job.createdBy ? `${job.createdBy.firstName} ${job.createdBy.lastName}` : 'Unknown'}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Created:</span>
            <span className="ml-2 font-medium">{new Date(job.createdAt).toLocaleString()}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Last updated:</span>
            <span className="ml-2 font-medium">{new Date(job.updatedAt).toLocaleString()}</span>
          </div>
          {job.closedAt && (
            <div>
              <span className="text-muted-foreground">Closed:</span>
              <span className="ml-2 font-medium">{new Date(job.closedAt).toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">Delete Job?</h3>
            <p className="text-muted-foreground mb-4">
              Are you sure you want to delete this job? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 rounded-lg border hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isActionLoading}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isActionLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


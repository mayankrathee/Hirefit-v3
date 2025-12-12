'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Edit, 
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Globe,
  Tag,
  Briefcase,
  FileText,
  Calendar,
  Plus,
  X,
  Loader2,
  Trash2,
} from 'lucide-react';
import { candidatesApi, resumesApi } from '@/lib/api/client';
import { ResumeUpload } from '@/components/candidates/resume-upload';
import { ApplyToJobModal } from '@/components/candidates/apply-to-job-modal';

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
  websiteUrl: string | null;
  source: string | null;
  sourceDetails: string | null;
  tags: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  resumes?: any[];
  applications?: any[];
  createdBy?: {
    firstName: string;
    lastName: string;
  };
}

export default function CandidateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tagInput, setTagInput] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);

  const fetchCandidate = async () => {
    try {
      const data = await candidatesApi.get(params.id as string);
      setCandidate(data);
    } catch (err) {
      console.error('Failed to fetch candidate:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidate();
  }, [params.id]);

  const parseTags = (tags: string): string[] => {
    try {
      return JSON.parse(tags || '[]');
    } catch {
      return [];
    }
  };

  const handleAddTag = async () => {
    if (!candidate || !tagInput.trim()) return;
    
    setIsAddingTag(true);
    try {
      await candidatesApi.addTags(candidate.id, [tagInput.trim().toLowerCase()]);
      fetchCandidate();
      setTagInput('');
    } catch (err) {
      console.error('Failed to add tag:', err);
    } finally {
      setIsAddingTag(false);
    }
  };

  const handleRemoveTag = async (tag: string) => {
    if (!candidate) return;
    
    try {
      await candidatesApi.removeTags(candidate.id, [tag]);
      fetchCandidate();
    } catch (err) {
      console.error('Failed to remove tag:', err);
    }
  };

  const getSourceColor = (source: string | null) => {
    switch (source?.toLowerCase()) {
      case 'linkedin': return 'bg-blue-100 text-blue-700';
      case 'indeed': return 'bg-purple-100 text-purple-700';
      case 'referral': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-2">Candidate not found</h2>
        <Link href="/dashboard/candidates" className="text-primary hover:underline">
          Back to Candidates
        </Link>
      </div>
    );
  }

  const tags = parseTags(candidate.tags);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link 
            href="/dashboard/candidates" 
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Candidates
          </Link>
          
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-2xl font-bold text-primary">
                {candidate.firstName?.[0]}{candidate.lastName?.[0]}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold">
                {candidate.firstName} {candidate.lastName}
              </h1>
              <div className="flex items-center gap-3 mt-1">
                {candidate.source && (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getSourceColor(candidate.source)}`}>
                    via {candidate.source}
                  </span>
                )}
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${candidate.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {candidate.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/candidates/${candidate.id}/edit`}
            className="flex items-center gap-2 border px-4 py-2 rounded-lg font-medium hover:bg-muted transition-colors"
          >
            <Edit className="w-4 h-4" />
            Edit
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Info */}
          <div className="bg-card rounded-xl border p-6">
            <h2 className="font-semibold mb-4">Contact Information</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  <Mail className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Email</div>
                  <a href={`mailto:${candidate.email}`} className="font-medium hover:text-primary">
                    {candidate.email}
                  </a>
                </div>
              </div>
              
              {candidate.phone && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                    <Phone className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Phone</div>
                    <a href={`tel:${candidate.phone}`} className="font-medium hover:text-primary">
                      {candidate.phone}
                    </a>
                  </div>
                </div>
              )}
              
              {(candidate.city || candidate.state || candidate.country) && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Location</div>
                    <div className="font-medium">
                      {[candidate.city, candidate.state, candidate.country].filter(Boolean).join(', ')}
                    </div>
                  </div>
                </div>
              )}
              
              {candidate.linkedInUrl && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Linkedin className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">LinkedIn</div>
                    <a 
                      href={candidate.linkedInUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="font-medium text-blue-600 hover:underline"
                    >
                      View Profile
                    </a>
                  </div>
                </div>
              )}
              
              {candidate.websiteUrl && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                    <Globe className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Website</div>
                    <a 
                      href={candidate.websiteUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="font-medium hover:text-primary"
                    >
                      {new URL(candidate.websiteUrl).hostname}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Applications */}
          <div className="bg-card rounded-xl border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Applications</h2>
              <button 
                onClick={() => setShowApplyModal(true)}
                className="flex items-center gap-1 text-sm text-primary hover:underline"
              >
                <Plus className="w-4 h-4" />
                Apply to Job
              </button>
            </div>
            {candidate.applications && candidate.applications.length > 0 ? (
              <div className="space-y-3">
                {candidate.applications.map((app: any) => (
                  <Link
                    key={app.id}
                    href={`/dashboard/jobs/${app.job?.id}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Briefcase className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{app.job?.title || 'Unknown Job'}</div>
                        <div className="text-sm text-muted-foreground">{app.job?.department}</div>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      app.status === 'hired' ? 'bg-green-100 text-green-700' :
                      app.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {app.status}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Briefcase className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No applications yet</p>
              </div>
            )}
          </div>

          {/* Resumes */}
          <div className="bg-card rounded-xl border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Resumes</h2>
              <button 
                onClick={() => setShowUpload(!showUpload)}
                className="flex items-center gap-1 text-sm text-primary hover:underline"
              >
                <Plus className="w-4 h-4" />
                {showUpload ? 'Hide Upload' : 'Upload Resume'}
              </button>
            </div>
            
            {showUpload && (
              <div className="mb-4">
                <ResumeUpload 
                  candidateId={candidate.id} 
                  onUploadComplete={() => {
                    fetchCandidate();
                    setTimeout(() => setShowUpload(false), 1500);
                  }} 
                />
              </div>
            )}

            {candidate.resumes && candidate.resumes.length > 0 ? (
              <div className="space-y-3">
                {candidate.resumes.map((resume: any) => (
                  <div
                    key={resume.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 group"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {resume.originalFileName}
                          {resume.isPrimary && (
                            <span className="px-1.5 py-0.5 rounded text-xs bg-primary/10 text-primary">Primary</span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(resume.uploadedAt).toLocaleDateString()} • {(resume.fileSizeBytes / 1024).toFixed(0)} KB
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        resume.processingStatus === 'completed' ? 'bg-green-100 text-green-700' :
                        resume.processingStatus === 'failed' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {resume.processingStatus}
                      </span>
                      <div className="hidden group-hover:flex items-center gap-1">
                        <a
                          href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/candidates/${candidate.id}/resumes/${resume.id}/file`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                          title="Download"
                        >
                          <FileText className="w-4 h-4" />
                        </a>
                        <button
                          onClick={async () => {
                            if (confirm('Delete this resume?')) {
                              await resumesApi.delete(candidate.id, resume.id);
                              fetchCandidate();
                            }
                          }}
                          className="p-1.5 hover:bg-red-100 rounded-lg transition-colors text-muted-foreground hover:text-red-600"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : !showUpload ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No resumes uploaded</p>
                <button 
                  onClick={() => setShowUpload(true)}
                  className="mt-2 text-sm text-primary hover:underline"
                >
                  Upload your first resume
                </button>
              </div>
            ) : null}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Tags */}
          <div className="bg-card rounded-xl border p-6">
            <h2 className="font-semibold mb-4">Tags</h2>
            <div className="flex flex-wrap gap-2 mb-4">
              {tags.length > 0 ? (
                tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm group"
                  >
                    <Tag className="w-3 h-3" />
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="opacity-0 group-hover:opacity-100 hover:bg-primary/20 rounded-full p-0.5 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No tags added</p>
              )}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                placeholder="Add tag..."
                className="flex-1 px-3 py-1.5 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                onClick={handleAddTag}
                disabled={isAddingTag}
                className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm hover:bg-primary/90 disabled:opacity-50"
              >
                Add
              </button>
            </div>
          </div>

          {/* Source */}
          {candidate.source && (
            <div className="bg-card rounded-xl border p-6">
              <h2 className="font-semibold mb-4">Source</h2>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSourceColor(candidate.source)}`}>
                    {candidate.source}
                  </span>
                </div>
                {candidate.sourceDetails && (
                  <p className="text-sm text-muted-foreground">{candidate.sourceDetails}</p>
                )}
              </div>
            </div>
          )}

          {/* Meta */}
          <div className="bg-card rounded-xl border p-6">
            <h2 className="font-semibold mb-4">Details</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>Added {new Date(candidate.createdAt).toLocaleDateString()}</span>
              </div>
              {candidate.createdBy && (
                <div className="text-muted-foreground">
                  By {candidate.createdBy.firstName} {candidate.createdBy.lastName}
                </div>
              )}
              <div className="text-muted-foreground">
                Last updated {new Date(candidate.updatedAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Apply to Job Modal */}
      <ApplyToJobModal
        candidateId={candidate.id}
        candidateName={`${candidate.firstName} ${candidate.lastName}`}
        isOpen={showApplyModal}
        onClose={() => setShowApplyModal(false)}
        onSuccess={() => {
          fetchCandidate();
        }}
      />
    </div>
  );
}


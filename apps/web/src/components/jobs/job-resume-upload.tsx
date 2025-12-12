'use client';

import { useState, useCallback, useEffect } from 'react';
import { Upload, FileText, X, Check, AlertCircle, Loader2, User, Star, RefreshCw } from 'lucide-react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface UploadedResume {
  id: string;
  fileName: string;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  error?: string;
  candidate?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  score?: number;
}

interface JobResumeUploadProps {
  jobId: string;
  onUploadComplete?: () => void;
}

export function JobResumeUpload({ jobId, onUploadComplete }: JobResumeUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploads, setUploads] = useState<UploadedResume[]>([]);
  const [isPolling, setIsPolling] = useState(false);

  // Poll for processing status
  useEffect(() => {
    const processingUploads = uploads.filter(u => u.status === 'processing');
    
    if (processingUploads.length === 0) {
      setIsPolling(false);
      return;
    }

    setIsPolling(true);
    const interval = setInterval(async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const userData = localStorage.getItem('user');
        const headers: HeadersInit = {
          'Authorization': `Bearer ${token}`,
        };
        
        if (userData) {
          try {
            const user = JSON.parse(userData);
            if (user.tenantId) {
              headers['x-tenant-id'] = user.tenantId;
            }
          } catch {}
        }

        const response = await fetch(`${API_URL}/api/jobs/${jobId}/resumes/status`, {
          headers,
        });

        if (response.ok) {
          const data = await response.json();
          const statuses = data.data || data;

          setUploads(prev => prev.map(upload => {
            const serverStatus = statuses.find((s: any) => s.resumeId === upload.id);
            if (serverStatus) {
              if (serverStatus.status === 'completed' && upload.status !== 'completed') {
                // Trigger refresh when a resume completes
                onUploadComplete?.();
              }
              return {
                ...upload,
                status: serverStatus.status,
                error: serverStatus.error,
                candidate: serverStatus.candidate,
                score: serverStatus.score,
              };
            }
            return upload;
          }));
        }
      } catch (err) {
        console.error('Failed to poll status:', err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [uploads, jobId, onUploadComplete]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const uploadFiles = async (files: File[]) => {
    const token = localStorage.getItem('accessToken');
    const userData = localStorage.getItem('user');
    
    const headers: HeadersInit = {
      'Authorization': `Bearer ${token}`,
    };

    if (userData) {
      try {
        const user = JSON.parse(userData);
        if (user.tenantId) {
          headers['x-tenant-id'] = user.tenantId;
        }
      } catch {}
    }

    // Create upload entries
    const newUploads: UploadedResume[] = files.map(file => ({
      id: `temp-${Date.now()}-${Math.random()}`,
      fileName: file.name,
      status: 'uploading' as const,
    }));

    setUploads(prev => [...prev, ...newUploads]);

    // Upload all files
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    try {
      const response = await fetch(`${API_URL}/api/jobs/${jobId}/resumes`, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Upload failed' }));
        throw new Error(error.message || 'Upload failed');
      }

      const result = await response.json();
      const uploadResults = result.data?.uploads || result.uploads || [];

      // Update upload entries with actual IDs and status
      setUploads(prev => {
        const updated = [...prev];
        newUploads.forEach((upload, index) => {
          const serverResult = uploadResults[index];
          const idx = updated.findIndex(u => u.id === upload.id);
          if (idx !== -1 && serverResult) {
            updated[idx] = {
              ...updated[idx],
              id: serverResult.resumeId,
              status: serverResult.status === 'processing' ? 'processing' : 'uploading',
            };
          }
        });
        return updated;
      });
    } catch (error: any) {
      // Mark all as failed
      setUploads(prev => prev.map(u => 
        newUploads.find(n => n.id === u.id)
          ? { ...u, status: 'failed' as const, error: error.message }
          : u
      ));
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      file => /\.(pdf|doc|docx)$/i.test(file.name)
    );

    if (droppedFiles.length > 0) {
      uploadFiles(droppedFiles);
    }
  }, [jobId]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files ? Array.from(e.target.files) : [];
    if (selectedFiles.length > 0) {
      uploadFiles(selectedFiles);
    }
    e.target.value = '';
  }, [jobId]);

  const removeUpload = (id: string) => {
    setUploads(prev => prev.filter(u => u.id !== id));
  };

  const clearCompleted = () => {
    setUploads(prev => prev.filter(u => u.status !== 'completed' && u.status !== 'failed'));
  };

  const getStatusIcon = (status: UploadedResume['status']) => {
    switch (status) {
      case 'uploading':
        return <Loader2 className="w-5 h-5 animate-spin text-blue-500" />;
      case 'processing':
        return <RefreshCw className="w-5 h-5 animate-spin text-purple-500" />;
      case 'completed':
        return <Check className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const getStatusText = (upload: UploadedResume) => {
    switch (upload.status) {
      case 'uploading':
        return 'Uploading...';
      case 'processing':
        return 'AI analyzing resume...';
      case 'completed':
        return upload.candidate 
          ? `${upload.candidate.firstName} ${upload.candidate.lastName}` 
          : 'Processed';
      case 'failed':
        return upload.error || 'Processing failed';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const hasUploads = uploads.length > 0;
  const hasCompleted = uploads.some(u => u.status === 'completed' || u.status === 'failed');

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer
          ${isDragging 
            ? 'border-primary bg-primary/5 scale-[1.01]' 
            : 'border-border hover:border-primary/50 hover:bg-muted/30'
          }
        `}
      >
        <input
          type="file"
          accept=".pdf,.doc,.docx"
          multiple
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        <div className="flex flex-col items-center gap-2">
          <div className={`
            w-12 h-12 rounded-full flex items-center justify-center transition-colors
            ${isDragging ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}
          `}>
            <Upload className="w-6 h-6" />
          </div>
          
          <div>
            <p className="font-medium text-foreground">
              {isDragging ? 'Drop resumes here' : 'Upload resumes for AI evaluation'}
            </p>
            <p className="text-sm text-muted-foreground mt-0.5">
              Drag & drop or <span className="text-primary">browse</span> • PDF, DOC, DOCX (max 10MB)
            </p>
          </div>
        </div>
      </div>

      {/* Upload List */}
      {hasUploads && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-muted-foreground">
              {isPolling ? 'Processing resumes...' : 'Uploaded resumes'}
            </h4>
            {hasCompleted && (
              <button
                onClick={clearCompleted}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Clear completed
              </button>
            )}
          </div>

          <div className="space-y-2">
            {uploads.map(upload => (
              <div
                key={upload.id}
                className={`
                  flex items-center gap-3 p-3 rounded-lg border transition-all
                  ${upload.status === 'completed' ? 'bg-green-50/50 border-green-200' :
                    upload.status === 'failed' ? 'bg-red-50/50 border-red-200' :
                    'bg-card border-border'}
                `}
              >
                {/* Status Icon */}
                <div className="flex-shrink-0">
                  {getStatusIcon(upload.status)}
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{upload.fileName}</p>
                  <p className={`text-xs ${upload.status === 'failed' ? 'text-red-600' : 'text-muted-foreground'}`}>
                    {getStatusText(upload)}
                  </p>
                </div>

                {/* Score Badge */}
                {upload.status === 'completed' && upload.score !== undefined && (
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(upload.score)}`}>
                    <Star className="w-3 h-3" />
                    {upload.score}%
                  </div>
                )}

                {/* Candidate Link */}
                {upload.status === 'completed' && upload.candidate && (
                  <Link
                    href={`/dashboard/candidates/${upload.candidate.id}`}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-muted text-xs font-medium hover:bg-muted/80 transition-colors"
                  >
                    <User className="w-3 h-3" />
                    View
                  </Link>
                )}

                {/* Remove Button */}
                {(upload.status === 'completed' || upload.status === 'failed') && (
                  <button
                    onClick={() => removeUpload(upload.id)}
                    className="p-1 hover:bg-muted rounded transition-colors"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


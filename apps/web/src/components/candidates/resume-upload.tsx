'use client';

import { useState, useCallback } from 'react';
import { Upload, FileText, X, Check, AlertCircle, Loader2 } from 'lucide-react';
import { resumesApi } from '@/lib/api/client';

interface ResumeUploadProps {
  candidateId: string;
  onUploadComplete?: () => void;
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
}

export function ResumeUpload({ candidateId, onUploadComplete }: ResumeUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>([]);

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

  const uploadFile = async (file: File) => {
    const tempId = `temp-${Date.now()}-${Math.random()}`;
    
    setFiles(prev => [...prev, {
      id: tempId,
      name: file.name,
      size: file.size,
      status: 'uploading',
    }]);

    try {
      const result = await resumesApi.upload(candidateId, file);
      
      setFiles(prev => prev.map(f => 
        f.id === tempId 
          ? { ...f, id: result.id, status: 'success' }
          : f
      ));

      onUploadComplete?.();
    } catch (error: any) {
      setFiles(prev => prev.map(f => 
        f.id === tempId 
          ? { ...f, status: 'error', error: error.message }
          : f
      ));
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    droppedFiles.forEach(uploadFile);
  }, [candidateId]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files ? Array.from(e.target.files) : [];
    selectedFiles.forEach(uploadFile);
    e.target.value = ''; // Reset input
  }, [candidateId]);

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center transition-all
          ${isDragging 
            ? 'border-primary bg-primary/5 scale-[1.02]' 
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
        
        <div className="flex flex-col items-center gap-3">
          <div className={`
            w-14 h-14 rounded-full flex items-center justify-center transition-colors
            ${isDragging ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}
          `}>
            <Upload className="w-7 h-7" />
          </div>
          
          <div>
            <p className="font-medium text-foreground">
              {isDragging ? 'Drop files here' : 'Drag & drop resumes here'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              or <span className="text-primary hover:underline cursor-pointer">browse files</span>
            </p>
          </div>
          
          <p className="text-xs text-muted-foreground">
            Supports PDF, DOC, DOCX (max 10MB)
          </p>
        </div>
      </div>

      {/* Uploaded Files */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map(file => (
            <div
              key={file.id}
              className="flex items-center gap-3 p-3 bg-card border rounded-lg"
            >
              <div className={`
                w-10 h-10 rounded-lg flex items-center justify-center
                ${file.status === 'success' ? 'bg-green-100 text-green-600' :
                  file.status === 'error' ? 'bg-red-100 text-red-600' :
                  'bg-muted text-muted-foreground'}
              `}>
                {file.status === 'uploading' ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : file.status === 'success' ? (
                  <Check className="w-5 h-5" />
                ) : file.status === 'error' ? (
                  <AlertCircle className="w-5 h-5" />
                ) : (
                  <FileText className="w-5 h-5" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {file.status === 'uploading' && 'Uploading...'}
                  {file.status === 'success' && 'Uploaded successfully'}
                  {file.status === 'error' && (file.error || 'Upload failed')}
                  {file.status !== 'uploading' && file.status !== 'error' && formatFileSize(file.size)}
                </p>
              </div>

              <button
                onClick={() => removeFile(file.id)}
                className="p-1.5 hover:bg-muted rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getHeaders(skipAuth = false): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (!skipAuth && typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      const userData = localStorage.getItem('user');

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      if (userData) {
        try {
          const user = JSON.parse(userData);
          if (user.tenantId) {
            headers['x-tenant-id'] = user.tenantId;
          }
        } catch (e) {
          console.error('Failed to parse user data:', e);
        }
      }
    }

    return headers;
  }

  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { skipAuth, ...fetchOptions } = options;
    
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      ...this.getHeaders(skipAuth),
      ...fetchOptions.headers,
    };

    const response = await fetch(url, {
      ...fetchOptions,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      console.error('[API] Error response:', error);
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    
    // Handle wrapped response from backend
    // Backend returns: { success, data: [...items], meta: { pagination: { total, ... } } }
    // We need to transform paginated responses to: { items: [...], total, page, pageSize }
    if (data.data !== undefined) {
      const items = data.data;
      const meta = data.meta;
      
      // If it's a paginated list response with meta.pagination
      if (meta?.pagination && Array.isArray(items)) {
        return {
          items,
          total: meta.pagination.total || 0,
          page: meta.pagination.page || 1,
          pageSize: meta.pagination.pageSize || 20,
          totalPages: meta.pagination.totalPages || 1,
        } as T;
      }
      
      // For single item or non-paginated responses
      return items as T;
    }
    
    return data as T;
  }

  async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async patch<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  async uploadFile<T>(endpoint: string, file: File, fieldName = 'file'): Promise<T> {
    const formData = new FormData();
    formData.append(fieldName, file);

    const headers: HeadersInit = {};
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      const userData = localStorage.getItem('user');

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      if (userData) {
        try {
          const user = JSON.parse(userData);
          if (user.tenantId) {
            headers['x-tenant-id'] = user.tenantId;
          }
        } catch (e) {
          console.error('Failed to parse user data:', e);
        }
      }
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Upload failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.data !== undefined ? data.data : data;
  }
}

export const api = new ApiClient(API_URL + '/api');

// API endpoint helpers
export const jobsApi = {
  list: (params?: { page?: number; status?: string; search?: string }) => 
    api.get<{ items: any[]; total: number; page: number; pageSize: number }>(
      '/jobs' + (params ? '?' + new URLSearchParams(params as any).toString() : '')
    ),
  get: (id: string) => api.get<any>(`/jobs/${id}`),
  create: (data: any) => api.post<any>('/jobs', data),
  update: (id: string, data: any) => api.patch<any>(`/jobs/${id}`, data),
  delete: (id: string) => api.delete(`/jobs/${id}`),
  publish: (id: string) => api.post(`/jobs/${id}/publish`),
  pause: (id: string) => api.post(`/jobs/${id}/pause`),
  close: (id: string) => api.post(`/jobs/${id}/close`),
  stats: () => api.get<{ total: number; open: number; draft: number; closed: number }>('/jobs/stats'),
};

export const candidatesApi = {
  list: (params?: { page?: number; source?: string; search?: string }) => 
    api.get<{ items: any[]; total: number; page: number; pageSize: number }>(
      '/candidates' + (params ? '?' + new URLSearchParams(params as any).toString() : '')
    ),
  get: (id: string) => api.get<any>(`/candidates/${id}`),
  create: (data: any) => api.post<any>('/candidates', data),
  update: (id: string, data: any) => api.patch<any>(`/candidates/${id}`, data),
  addTags: (id: string, tags: string[]) => api.post(`/candidates/${id}/tags`, { tags }),
  removeTags: (id: string, tags: string[]) => api.delete(`/candidates/${id}/tags`),
  deactivate: (id: string) => api.post(`/candidates/${id}/deactivate`),
  stats: () => api.get<{ total: number; thisMonth: number; bySource: any[] }>('/candidates/stats'),
};

export const tenantsApi = {
  getCurrent: () => api.get<any>('/tenants/current'),
  getStats: () => api.get<{ users: number; jobs: number; candidates: number }>('/tenants/current/stats'),
  updateSettings: (settings: any) => api.patch('/tenants/current/settings', settings),
  convertToCompany: (companyName: string, companySlug?: string) => 
    api.post<{ success: boolean; tenant: any; newLimits: any }>('/tenants/current/convert-to-company', { companyName, companySlug }),
};

export const usersApi = {
  list: () => api.get<any[]>('/users'),
  get: (id: string) => api.get<any>(`/users/${id}`),
  getMe: () => api.get<any>('/users/me'),
  create: (data: any) => api.post<any>('/users', data),
  update: (id: string, data: any) => api.patch<any>(`/users/${id}`, data),
};

export const resumesApi = {
  list: (candidateId: string) => api.get<any[]>(`/candidates/${candidateId}/resumes`),
  get: (candidateId: string, id: string) => api.get<any>(`/candidates/${candidateId}/resumes/${id}`),
  upload: (candidateId: string, file: File) => api.uploadFile<any>(`/candidates/${candidateId}/resumes`, file),
  delete: (candidateId: string, id: string) => api.delete(`/candidates/${candidateId}/resumes/${id}`),
  setPrimary: (candidateId: string, id: string) => api.post(`/candidates/${candidateId}/resumes/${id}/set-primary`),
  getDownloadUrl: (candidateId: string, id: string) => api.get<{ url: string }>(`/candidates/${candidateId}/resumes/${id}/download`),
};

export const applicationsApi = {
  list: (params?: { jobId?: string; candidateId?: string; status?: string }) => 
    api.get<{ items: any[]; total: number }>('/applications' + (params ? '?' + new URLSearchParams(params as any).toString() : '')),
  get: (id: string) => api.get<any>(`/applications/${id}`),
  create: (data: { jobId: string; candidateId: string; coverLetter?: string }) => api.post<any>('/applications', data),
  updateStatus: (id: string, status: string, notes?: string) => api.patch(`/applications/${id}/status`, { status, notes }),
  moveStage: (id: string, stage: string) => api.patch(`/applications/${id}/stage`, { stage }),
};

export interface UsageStats {
  activeJobs: number;
  totalCandidates: number;
  aiScoresThisMonth: number;
  teamMembers: number;
  maxJobs: number;
  maxCandidates: number;
  maxAiScoresPerMonth: number;
  maxTeamMembers: number;
  jobsPercent: number;
  candidatesPercent: number;
  aiScoresPercent: number;
  teamPercent: number;
  workspaceType: 'personal' | 'company';
  subscriptionTier: string;
  warnings: string[];
}

export interface PricingTier {
  id: string;
  name: string;
  price: number | null;
  priceLabel: string;
  description: string;
  limits: {
    maxJobs: number;
    maxCandidates: number;
    maxAiScoresPerMonth: number;
    maxTeamMembers: number;
  };
  features: string[];
  popular?: boolean;
}

export const usageApi = {
  getUsage: () => api.get<UsageStats>('/usage'),
  checkJobLimit: () => api.get<{ allowed: boolean; reason?: string; currentUsage: number; limit: number; percentUsed: number }>('/usage/limits/jobs'),
  checkCandidateLimit: () => api.get<{ allowed: boolean; reason?: string; currentUsage: number; limit: number; percentUsed: number }>('/usage/limits/candidates'),
  checkAiScoreLimit: () => api.get<{ allowed: boolean; reason?: string; currentUsage: number; limit: number; percentUsed: number }>('/usage/limits/ai-scores'),
  getPricing: () => api.get<PricingTier[]>('/usage/pricing', { skipAuth: true }),
};

// Feature status type
export interface FeatureStatus {
  featureId: string;
  name: string;
  description: string;
  enabled: boolean;
  usageLimited: boolean;
  limit: number | null;
  used: number;
  remaining: number | null;
  canUse: boolean;
}

// Feature definition type
export interface FeatureDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  type: string;
  defaultEnabled: boolean;
  usageLimited: boolean;
  defaultLimit: number | null;
  sortOrder: number;
  isActive: boolean;
}

// Tier configuration type
export interface TierConfig {
  name: string;
  features: string[];
  limits?: Record<string, number>;
}

export const featuresApi = {
  // Get all feature definitions (public)
  getDefinitions: () => api.get<FeatureDefinition[]>('/features/definitions', { skipAuth: true }),
  
  // Get a specific feature definition (public)
  getDefinition: (featureId: string) => api.get<FeatureDefinition>(`/features/definitions/${featureId}`, { skipAuth: true }),
  
  // Get all tier configurations (public)
  getTiers: () => api.get<TierConfig[]>('/features/tiers', { skipAuth: true }),
  
  // Get a specific tier configuration (public)
  getTier: (tier: string) => api.get<TierConfig>(`/features/tiers/${tier}`, { skipAuth: true }),
  
  // Get all feature statuses for current tenant
  getTenantFeatures: () => api.get<FeatureStatus[]>('/features/tenant'),
  
  // Get only enabled features for current tenant
  getEnabledFeatures: () => api.get<FeatureStatus[]>('/features/tenant/enabled'),
  
  // Get status of a specific feature for current tenant
  getFeatureStatus: (featureId: string) => api.get<FeatureStatus>(`/features/tenant/${featureId}`),
  
  // Check if current tenant can use a feature
  canUseFeature: (featureId: string) => api.get<{ canUse: boolean }>(`/features/tenant/${featureId}/can-use`),
};


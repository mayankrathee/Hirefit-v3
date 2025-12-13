'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  tenantId: string;
  tenantName: string;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, tenantSlug?: string) => Promise<void>;
  loginWithGoogle: (tenantSlug?: string) => void;
  loginWithMicrosoft: (tenantSlug?: string) => void;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Check for existing session on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const userData = localStorage.getItem('user');
      
      if (!token || !userData) {
        setIsLoading(false);
        return;
      }

      // Restore user from localStorage
      setAccessToken(token);
      setUser(JSON.parse(userData));

      // Optionally verify token with backend
      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'x-tenant-id': JSON.parse(userData).tenantId,
        },
      });

      if (!response.ok) {
        // Token invalid, try refresh
        await refreshTokenFunc();
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      // Keep the user logged in from localStorage even if verification fails
      // This allows offline-first experience
    } finally {
      setIsLoading(false);
    }
  };

  const login = useCallback(async (email: string, password: string, tenantSlug?: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, tenantSlug }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }

      const data = await response.json();
      const result = data.data || data; // Handle wrapped or unwrapped response

      // Store tokens and user
      localStorage.setItem('accessToken', result.accessToken);
      localStorage.setItem('refreshToken', result.refreshToken);
      localStorage.setItem('user', JSON.stringify(result.user));
      
      setAccessToken(result.accessToken);
      setUser(result.user);
      
      router.push('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  const loginWithGoogle = useCallback((tenantSlug?: string) => {
    const params = new URLSearchParams({
      redirect_uri: `${window.location.origin}/auth/callback`,
    });
    
    if (tenantSlug) {
      params.set('tenant', tenantSlug);
    }

    window.location.href = `${API_URL}/api/auth/google/login?${params.toString()}`;
  }, []);

  const loginWithMicrosoft = useCallback((tenantSlug?: string) => {
    const params = new URLSearchParams({
      redirect_uri: `${window.location.origin}/auth/callback`,
    });
    
    if (tenantSlug) {
      params.set('tenant', tenantSlug);
    }

    window.location.href = `${API_URL}/api/auth/azure-ad/login?${params.toString()}`;
  }, []);

  const logout = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const userData = localStorage.getItem('user');
      
      if (token && userData) {
        const user = JSON.parse(userData);
        await fetch(`${API_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'x-tenant-id': user.tenantId,
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setAccessToken(null);
      setUser(null);
      router.push('/login');
    }
  }, [router]);

  const refreshTokenFunc = useCallback(async () => {
    try {
      const refresh = localStorage.getItem('refreshToken');
      if (!refresh) {
        throw new Error('No refresh token');
      }

      const response = await fetch(`${API_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: refresh }),
      });

      if (response.ok) {
        const data = await response.json();
        const result = data.data || data;
        
        localStorage.setItem('accessToken', result.accessToken);
        localStorage.setItem('refreshToken', result.refreshToken);
        localStorage.setItem('user', JSON.stringify(result.user));
        
        setAccessToken(result.accessToken);
        setUser(result.user);
      } else {
        throw new Error('Token refresh failed');
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setAccessToken(null);
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isLoading,
        isAuthenticated: !!user,
        login,
        loginWithGoogle,
        loginWithMicrosoft,
        logout,
        refreshToken: refreshTokenFunc,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

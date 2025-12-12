'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const handleCallback = async () => {
      // Check for error in URL
      const error = searchParams.get('error');
      if (error) {
        setStatus('error');
        setErrorMessage(error);
        return;
      }

      // Get tokens from URL
      const accessToken = searchParams.get('accessToken');
      const refreshToken = searchParams.get('refreshToken');
      const userBase64 = searchParams.get('user');

      if (!accessToken || !refreshToken || !userBase64) {
        setStatus('error');
        setErrorMessage('Missing authentication data. Please try logging in again.');
        return;
      }

      try {
        // Decode user data
        const user = JSON.parse(atob(userBase64));

        // Store in localStorage
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(user));

        setStatus('success');

        // Redirect to dashboard after a brief delay
        setTimeout(() => {
          router.push('/dashboard');
        }, 1000);
      } catch (err: any) {
        setStatus('error');
        setErrorMessage('Failed to process authentication data.');
      }
    };

    handleCallback();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 w-full max-w-md text-center border border-white/20">
        {status === 'processing' && (
          <>
            <Loader2 className="w-16 h-16 text-blue-400 animate-spin mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-white mb-2">
              Completing Sign In
            </h1>
            <p className="text-slate-400">
              Please wait while we verify your credentials...
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-white mb-2">
              Sign In Successful
            </h1>
            <p className="text-slate-400">
              Redirecting to your dashboard...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-white mb-2">
              Sign In Failed
            </h1>
            <p className="text-slate-400 mb-6">
              {errorMessage}
            </p>
            <button
              onClick={() => router.push('/login')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Return to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
}


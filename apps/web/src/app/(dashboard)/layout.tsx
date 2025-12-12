'use client';

import { useAuth } from '@/lib/auth/auth-provider';
import { PermissionsProvider } from '@/lib/auth/permissions';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { redirect } from 'next/navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    redirect('/login');
  }

  return (
    <PermissionsProvider>
      <div className="min-h-screen flex">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 p-6 bg-muted/30">
            {children}
          </main>
        </div>
      </div>
    </PermissionsProvider>
  );
}


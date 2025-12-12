'use client';

import Link from 'next/link';
import { 
  CreditCard, 
  User, 
  Bell, 
  Shield, 
  Building2,
  Palette,
  ChevronRight,
  Settings,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-provider';

interface SettingsSection {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  badge?: string;
}

export default function SettingsPage() {
  const { user } = useAuth();

  const sections: SettingsSection[] = [
    {
      title: 'Billing & Plans',
      description: 'View usage, manage subscription, and upgrade your plan',
      icon: CreditCard,
      href: '/dashboard/settings/billing',
      badge: 'Free Plan',
    },
    {
      title: 'Profile',
      description: 'Update your personal information and preferences',
      icon: User,
      href: '/dashboard/settings/profile',
    },
    {
      title: 'Notifications',
      description: 'Configure email and in-app notification preferences',
      icon: Bell,
      href: '/dashboard/settings/notifications',
    },
    {
      title: 'Security',
      description: 'Manage password, two-factor authentication, and sessions',
      icon: Shield,
      href: '/dashboard/settings/security',
    },
    {
      title: 'Workspace',
      description: 'Workspace settings, team members, and branding',
      icon: Building2,
      href: '/dashboard/settings/workspace',
    },
    {
      title: 'Appearance',
      description: 'Customize theme, colors, and display preferences',
      icon: Palette,
      href: '/dashboard/settings/appearance',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
          <Settings className="w-5 h-5 text-muted-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account, workspace, and preferences
          </p>
        </div>
      </div>

      {/* User info card */}
      <div className="bg-card border rounded-xl p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-2xl font-bold text-primary">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </span>
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold">
              {user?.firstName} {user?.lastName}
            </h2>
            <p className="text-muted-foreground">{user?.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full">
                {user?.role?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </span>
            </div>
          </div>
          <Link
            href="/dashboard/settings/profile"
            className="px-4 py-2 border rounded-lg hover:bg-muted transition-colors text-sm font-medium"
          >
            Edit Profile
          </Link>
        </div>
      </div>

      {/* Settings sections */}
      <div className="grid gap-4">
        {sections.map((section) => (
          <Link
            key={section.title}
            href={section.href}
            className="bg-card border rounded-xl p-5 hover:border-primary/50 hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                <section.icon className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{section.title}</h3>
                  {section.badge && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-muted rounded-full">
                      {section.badge}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{section.description}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </Link>
        ))}
      </div>

      {/* Help section */}
      <div className="bg-muted/50 border rounded-xl p-6 text-center">
        <h3 className="font-semibold mb-2">Need Help?</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Check our documentation or contact support for assistance
        </p>
        <div className="flex justify-center gap-3">
          <Link
            href="/docs"
            className="px-4 py-2 border rounded-lg hover:bg-muted transition-colors text-sm font-medium"
          >
            Documentation
          </Link>
          <Link
            href="/support"
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
          >
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
}


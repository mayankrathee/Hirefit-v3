'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  FileText, 
  Calendar,
  Settings,
  Sparkles,
  ChevronLeft,
  BarChart3,
  Shield,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { usePermissions, Permission, Role } from '@/lib/auth/permissions';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: Permission;
  atLeastRole?: Role;
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Jobs', href: '/dashboard/jobs', icon: Briefcase, permission: Permission.JOBS_VIEW },
  { name: 'Candidates', href: '/dashboard/candidates', icon: Users, permission: Permission.CANDIDATES_VIEW },
  { name: 'Interviews', href: '/dashboard/interviews', icon: Calendar, permission: Permission.INTERVIEWS_VIEW },
  { name: 'Reports', href: '/dashboard/reports', icon: BarChart3, permission: Permission.REPORTS_VIEW },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings, permission: Permission.SETTINGS_VIEW },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { hasPermission, isAtLeast, role } = usePermissions();

  // Filter navigation items based on permissions
  const visibleNavigation = navigation.filter(item => {
    if (!item.permission && !item.atLeastRole) return true;
    if (item.permission && !hasPermission(item.permission)) return false;
    if (item.atLeastRole && !isAtLeast(item.atLeastRole)) return false;
    return true;
  });

  return (
    <aside 
      className={cn(
        'flex flex-col border-r bg-card transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          {!collapsed && <span className="text-lg font-bold">HireFit</span>}
        </Link>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-accent transition-colors"
        >
          <ChevronLeft className={cn(
            'w-4 h-4 transition-transform',
            collapsed && 'rotate-180'
          )} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {visibleNavigation.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Upgrade CTA */}
      {!collapsed && (
        <div className="p-3">
          <div className="rounded-lg bg-gradient-primary p-4 text-white">
            <h4 className="font-medium mb-1">Upgrade to Pro</h4>
            <p className="text-xs text-white/80 mb-3">
              Get AI scoring and advanced analytics
            </p>
            <button className="w-full bg-white text-primary text-sm font-medium py-2 rounded-lg hover:bg-white/90 transition-colors">
              Upgrade Now
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}


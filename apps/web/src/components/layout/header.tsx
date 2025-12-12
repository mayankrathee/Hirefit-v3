'use client';

import { Bell, Search, Moon, Sun, LogOut, User, Settings, Shield } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useAuth } from '@/lib/auth/auth-provider';
import { usePermissions, Role, ROLE_DISPLAY_NAMES, ROLE_COLORS } from '@/lib/auth/permissions';
import { useState } from 'react';

export function Header() {
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const { role } = usePermissions();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const roleDisplayName = role ? ROLE_DISPLAY_NAMES[role] : user?.role;
  const roleColor = role ? ROLE_COLORS[role] : 'bg-gray-100 text-gray-700';

  return (
    <header className="h-16 border-b bg-card px-6 flex items-center justify-between">
      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search candidates, jobs..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 rounded-lg hover:bg-accent transition-colors"
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </button>

        {/* Notifications */}
        <button className="p-2 rounded-lg hover:bg-accent transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-accent transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-medium text-primary">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </span>
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-sm font-medium">
                {user?.firstName} {user?.lastName}
              </div>
              <div className={`text-xs px-1.5 py-0.5 rounded ${roleColor}`}>
                {roleDisplayName}
              </div>
            </div>
          </button>

          {showUserMenu && (
            <>
              <div 
                className="fixed inset-0 z-40"
                onClick={() => setShowUserMenu(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-56 bg-card border rounded-lg shadow-lg z-50 py-1">
                <div className="px-3 py-2 border-b">
                  <div className="font-medium">{user?.firstName} {user?.lastName}</div>
                  <div className="text-sm text-muted-foreground">{user?.email}</div>
                  <div className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded mt-1.5 ${roleColor}`}>
                    <Shield className="w-3 h-3" />
                    {roleDisplayName}
                  </div>
                </div>
                <a
                  href="/dashboard/settings/profile"
                  className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors"
                >
                  <User className="w-4 h-4" />
                  Profile
                </a>
                <a
                  href="/dashboard/settings"
                  className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </a>
                <div className="border-t my-1" />
                <button
                  onClick={logout}
                  className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors w-full text-left text-red-600"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}


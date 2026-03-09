import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Hexagon, Shield, LogOut } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { navItems } from '../lib/nav-items';

export default function Sidebar({ user }) {
  const location = useLocation();
  const isAdmin = user?.role === 'admin';

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-sidebar text-sidebar-foreground flex flex-col z-30">
      <div className="p-6 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-sidebar-primary flex items-center justify-center">
          <Hexagon className="w-5 h-5 text-sidebar-primary-foreground" />
        </div>
        <span className="text-xl font-bold tracking-tight">TestHive</span>
      </div>

      <nav className="flex-1 px-3 mt-2 space-y-1">
        {navItems.map(item => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
        {isAdmin && (
          <Link
            to="/DevMode"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
              location.pathname === '/DevMode'
                ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                : 'text-red-400/70 hover:bg-sidebar-accent hover:text-red-400'
            }`}
          >
            <Shield className="w-4 h-4" />
            Dev Mode
          </Link>
        )}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center text-xs font-semibold text-sidebar-accent-foreground">
            {user?.full_name?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.full_name || 'User'}</p>
            <p className="text-xs text-sidebar-foreground/50 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={() => base44.auth.logout('/Landing')}
          className="flex items-center gap-2 px-3 py-2 w-full text-sm text-sidebar-foreground/50 hover:text-sidebar-foreground rounded-lg hover:bg-sidebar-accent transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Search, Upload, Hexagon, Menu, X, Shield } from 'lucide-react';

const navItems = [
  { path: '/Dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/BrowseApps', label: 'Browse', icon: Search },
  { path: '/UploadApp', label: 'Upload', icon: Upload },
];

export default function MobileNav({ user }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const isAdmin = user?.role === 'admin';

  return (
    <>
      <div className="fixed top-0 left-0 right-0 h-14 bg-card border-b border-border flex items-center justify-between px-4 z-30">
        <div className="flex items-center gap-2">
          <Hexagon className="w-5 h-5 text-primary" />
          <span className="font-bold">TestHive</span>
        </div>
        <button onClick={() => setOpen(!open)}>
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>
      {open && (
        <div className="fixed inset-0 top-14 bg-background z-20 p-4 space-y-2">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${
                location.pathname === item.path ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}
          {isAdmin && (
            <Link to="/DevMode" onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-muted">
              <Shield className="w-4 h-4" />
              Dev Mode
            </Link>
          )}
        </div>
      )}
      <div className="h-14" />
    </>
  );
}
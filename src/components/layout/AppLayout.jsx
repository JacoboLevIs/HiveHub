import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';

export default function AppLayout() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <div className="hidden md:block">
        <Sidebar user={user} />
      </div>
      <div className="md:hidden">
        <MobileNav user={user} />
      </div>
      <main className="md:ml-64 min-h-screen">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
          <Outlet context={{ user }} />
        </div>
      </main>
    </div>
  );
}

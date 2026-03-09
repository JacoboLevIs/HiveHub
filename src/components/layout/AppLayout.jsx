import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';

export default function AppLayout() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(u => setUser(u)).catch(() => {});
  }, []);

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
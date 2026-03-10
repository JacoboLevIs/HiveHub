import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Loader2 } from 'lucide-react';
import AppCard from '../components/apps/AppCard';

export default function BrowseApps() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: apps = [], isLoading } = useQuery({
    queryKey: ['all-apps'],
    queryFn: () => base44.entities.App.list('-created_date'),
  });

  const filteredApps = apps.filter(app => {
    const matchesSearch = !search || app.app_name?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Browse Apps</h1>
        <p className="text-muted-foreground mt-1">Find apps that need testers</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search apps..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="WAITING_FOR_TESTERS">Waiting</TabsTrigger>
            <TabsTrigger value="TESTING">Testing</TabsTrigger>
            <TabsTrigger value="COMPLETED">Done</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : filteredApps.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-muted-foreground">No apps found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredApps.map(app => <AppCard key={app.id} app={app} />)}
        </div>
      )}
    </div>
  );
}

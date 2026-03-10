import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/api/supabaseClient';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FlaskConical, Upload, Loader2, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

const sessionStatusBadge = {
  PENDING_GOOGLE_VERIFICATION: { label: 'Pending', color: 'bg-amber-100 text-amber-700' },
  ENROLLED: { label: 'Active', color: 'bg-blue-100 text-blue-700' },
  COMPLETED: { label: 'Completed', color: 'bg-green-100 text-green-700' },
  LEFT: { label: 'Left', color: 'bg-gray-100 text-gray-500' },
};

const appStatusBadge = {
  WAITING_FOR_TESTERS: { label: 'Waiting', color: 'bg-amber-100 text-amber-700' },
  TESTING: { label: 'Testing', color: 'bg-blue-100 text-blue-700' },
  COMPLETED: { label: 'Completed', color: 'bg-green-100 text-green-700' },
};

export default function HistoryPage() {
  const { user } = useAuth();

  const { data: sessions = [], isLoading: loadingSessions } = useQuery({
    queryKey: ['history-sessions', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('test_sessions').select('*').eq('tester_id', user.id);
      return data || [];
    },
    enabled: !!user?.id,
  });

  const { data: myApps = [], isLoading: loadingApps } = useQuery({
    queryKey: ['history-apps', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('apps').select('*').eq('owner_id', user.id);
      return data || [];
    },
    enabled: !!user?.id,
  });

  const sortedSessions = [...sessions].sort(
    (a, b) => new Date(b.joined_at || b.created_date) - new Date(a.joined_at || a.created_date)
  );

  const sortedApps = [...myApps].sort(
    (a, b) => new Date(b.created_date) - new Date(a.created_date)
  );

  const isLoading = loadingSessions || loadingApps;

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">History</h1>
        <p className="text-muted-foreground mt-1">Your complete activity on TestHive</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <SummaryCard label="Total Tests" value={sessions.length} icon={FlaskConical} />
        <SummaryCard label="Completed" value={sessions.filter(s => s.status === 'COMPLETED').length} icon={FlaskConical} />
        <SummaryCard label="Apps Uploaded" value={myApps.length} icon={Upload} />
        <SummaryCard label="Credits Earned" value={user?.tests_completed_total || 0} icon={FlaskConical} />
      </div>

      <Tabs defaultValue="tests">
        <TabsList>
          <TabsTrigger value="tests">Test Sessions ({sessions.length})</TabsTrigger>
          <TabsTrigger value="apps">My Apps ({myApps.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="tests" className="mt-4">
          {sortedSessions.length === 0 ? (
            <EmptyState message="You haven't joined any tests yet." />
          ) : (
            <div className="bg-card rounded-2xl border border-border overflow-hidden divide-y divide-border">
              {sortedSessions.map((session) => {
                const st = sessionStatusBadge[session.status] || sessionStatusBadge.ENROLLED;
                const dateStr = session.joined_at || session.created_date;
                return (
                  <Link key={session.id} to={`/app/${session.app_id}`} className="flex items-center justify-between px-5 py-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                        {session.app_name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{session.app_name || 'App'}</p>
                        <p className="text-xs text-muted-foreground">{dateStr ? format(new Date(dateStr), 'MMM d, yyyy') : 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={st.color}>{st.label}</Badge>
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="apps" className="mt-4">
          {sortedApps.length === 0 ? (
            <EmptyState message="You haven't uploaded any apps yet." />
          ) : (
            <div className="bg-card rounded-2xl border border-border overflow-hidden divide-y divide-border">
              {sortedApps.map((app) => {
                const st = appStatusBadge[app.status] || appStatusBadge.WAITING_FOR_TESTERS;
                return (
                  <Link key={app.id} to={`/app/${app.id}`} className="flex items-center justify-between px-5 py-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                        {app.app_name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{app.app_name}</p>
                        <p className="text-xs text-muted-foreground">{app.testers_enrolled || 0}/12 testers</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={st.color}>{st.label}</Badge>
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SummaryCard({ label, value, icon: Icon }) {
  return (
    <div className="bg-card rounded-2xl border border-border p-4 text-center">
      <Icon className="w-5 h-5 text-primary mx-auto mb-2" />
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div className="text-center py-16">
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}

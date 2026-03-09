import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { FlaskConical, Upload, CheckCircle2, Clock } from 'lucide-react';
import StatCard from '../components/dashboard/StatCard';
import UploadProgress from '../components/dashboard/UploadProgress';
import AppCard from '../components/apps/AppCard';

export default function Dashboard() {
  const { user } = useOutletContext();
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const { data: mySessions = [] } = useQuery({
    queryKey: ['my-sessions', currentUser?.id],
    queryFn: () => base44.entities.TestSession.filter({ tester_id: currentUser.id }),
    enabled: !!currentUser?.id,
  });

  const { data: myApps = [] } = useQuery({
    queryKey: ['my-apps', currentUser?.id],
    queryFn: () => base44.entities.App.filter({ owner_id: currentUser.id }),
    enabled: !!currentUser?.id,
  });

  const activeSessions = mySessions.filter(s => s.status === 'ENROLLED');
  const completedSessions = mySessions.filter(s => s.status === 'COMPLETED');

  const testsCompletedSinceUpload = currentUser?.tests_completed_since_last_upload || 0;
  const totalCompleted = currentUser?.tests_completed_total || 0;
  const appsUploaded = currentUser?.apps_uploaded_total || 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back{currentUser?.full_name ? `, ${currentUser.full_name.split(' ')[0]}` : ''}
        </h1>
        <p className="text-muted-foreground mt-1">Here's your TestHive overview</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FlaskConical} label="Active Tests" value={activeSessions.length} sublabel="Currently enrolled" />
        <StatCard icon={CheckCircle2} label="Tests Completed" value={totalCompleted} sublabel="All time" />
        <StatCard icon={Upload} label="Apps Uploaded" value={appsUploaded} sublabel="Total" />
        <StatCard icon={Clock} label="Pending" value={mySessions.filter(s => s.status === 'PENDING_GOOGLE_VERIFICATION').length} sublabel="Awaiting verification" />
      </div>

      <UploadProgress completedSinceLastUpload={testsCompletedSinceUpload} />

      {activeSessions.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Your Active Tests</h2>
          <div className="space-y-3">
            {activeSessions.map(session => (
              <ActiveTestRow key={session.id} session={session} />
            ))}
          </div>
        </div>
      )}

      {myApps.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Your Apps</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myApps.map(app => <AppCard key={app.id} app={app} />)}
          </div>
        </div>
      )}
    </div>
  );
}

function ActiveTestRow({ session }) {
  const enrolledDate = session.enrolled_at ? new Date(session.enrolled_at) : null;
  const daysIn = enrolledDate ? Math.floor((Date.now() - enrolledDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;
  const daysLeft = Math.max(14 - daysIn, 0);

  return (
    <div className="bg-card rounded-xl border border-border p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-600">
          {session.app_name?.[0]?.toUpperCase() || '?'}
        </div>
        <div>
          <p className="font-medium text-sm">{session.app_name || 'App'}</p>
          <p className="text-xs text-muted-foreground">Day {daysIn} of 14</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold">{daysLeft}d left</p>
        <div className="w-20 h-1.5 bg-muted rounded-full mt-1">
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${Math.min((daysIn / 14) * 100, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
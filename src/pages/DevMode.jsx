import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Shield, Zap, Clock, UserCheck, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function DevMode() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isLoadingAuth } = useAuth();

  const isAdmin = user?.role === 'admin';

  const { data: apps = [] } = useQuery({
    queryKey: ['dev-apps'],
    queryFn: () => base44.entities.App.list('-created_date'),
    enabled: !isLoadingAuth && isAdmin,
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ['dev-sessions'],
    queryFn: () => base44.entities.TestSession.list('-created_date'),
    enabled: !isLoadingAuth && isAdmin,
  });

  const { data: users = [] } = useQuery({
    queryKey: ['dev-users'],
    queryFn: () => base44.entities.User.list(),
    enabled: !isLoadingAuth && isAdmin,
  });

  if (isLoadingAuth) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  if (!isAdmin) {
    navigate('/Dashboard');
    return null;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
          <Shield className="w-5 h-5 text-red-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dev Mode</h1>
          <p className="text-sm text-red-500">Admin only — simulation tools</p>
        </div>
      </div>

      <SimulateCompletion sessions={sessions} apps={apps} users={users} queryClient={queryClient} />
      <ForceSessionState sessions={sessions} queryClient={queryClient} />
      <SimulateTime apps={apps} sessions={sessions} queryClient={queryClient} />
      <BypassUpload users={users} queryClient={queryClient} />
    </div>
  );
}

function SimulateCompletion({ sessions, apps, users, queryClient }) {
  const [selectedSession, setSelectedSession] = useState('');
  const [processing, setProcessing] = useState(false);

  const enrolledSessions = sessions.filter(s => s.status === 'ENROLLED');

  const handleComplete = async () => {
    if (!selectedSession) return;
    setProcessing(true);

    try {
      const session = enrolledSessions.find(s => s.id === selectedSession);
      if (!session) return;

      await base44.entities.TestSession.update(session.id, {
        status: 'COMPLETED',
        completed_at: new Date().toISOString(),
      });

      const tester = users.find(u => u.id === session.tester_id);
      if (tester) {
        await base44.entities.User.update(tester.id, {
          tests_completed_total: (tester.tests_completed_total || 0) + 1,
          tests_completed_since_last_upload: (tester.tests_completed_since_last_upload || 0) + 1,
        });
      }

      queryClient.invalidateQueries({ queryKey: ['dev-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['dev-users'] });
      toast.success('Test session marked as completed');
      setSelectedSession('');
    } catch (error) {
      toast.error('Failed to complete session.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Zap className="w-4 h-4 text-amber-500" />
        <h3 className="font-semibold">Simulate Test Completion</h3>
      </div>
      <div className="flex gap-3">
        <Select value={selectedSession} onValueChange={setSelectedSession}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Select an enrolled session" />
          </SelectTrigger>
          <SelectContent>
            {enrolledSessions.map(s => (
              <SelectItem key={s.id} value={s.id}>
                {s.tester_email} → {s.app_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={handleComplete} disabled={!selectedSession || processing}>
          {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Complete'}
        </Button>
      </div>
    </div>
  );
}

function ForceSessionState({ sessions, queryClient }) {
  const [selectedSession, setSelectedSession] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleForce = async () => {
    if (!selectedSession || !newStatus) return;
    setProcessing(true);

    try {
      const update = { status: newStatus };
      if (newStatus === 'ENROLLED') update.enrolled_at = new Date().toISOString();
      if (newStatus === 'COMPLETED') update.completed_at = new Date().toISOString();
      if (newStatus === 'LEFT') update.left_at = new Date().toISOString();

      await base44.entities.TestSession.update(selectedSession, update);
      queryClient.invalidateQueries({ queryKey: ['dev-sessions'] });
      toast.success('Session state updated');
      setSelectedSession('');
      setNewStatus('');
    } catch (error) {
      toast.error('Failed to update session state.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
      <div className="flex items-center gap-2">
        <UserCheck className="w-4 h-4 text-blue-500" />
        <h3 className="font-semibold">Force Session State</h3>
      </div>
      <div className="flex gap-3">
        <Select value={selectedSession} onValueChange={setSelectedSession}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Select session" />
          </SelectTrigger>
          <SelectContent>
            {sessions.map(s => (
              <SelectItem key={s.id} value={s.id}>
                {s.tester_email} → {s.app_name} ({s.status})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={newStatus} onValueChange={setNewStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="New status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PENDING_GOOGLE_VERIFICATION">Pending</SelectItem>
            <SelectItem value="ENROLLED">Enrolled</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="LEFT">Left</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={handleForce} disabled={!selectedSession || !newStatus || processing}>
          {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Force'}
        </Button>
      </div>
    </div>
  );
}

function SimulateTime({ apps, sessions, queryClient }) {
  const [selectedApp, setSelectedApp] = useState('');
  const [days, setDays] = useState('14');
  const [processing, setProcessing] = useState(false);

  const handleSimulate = async () => {
    if (!selectedApp) return;
    setProcessing(true);

    try {
      const app = apps.find(a => a.id === selectedApp);
      if (app && app.testing_start_date) {
        const shiftMs = parseInt(days) * 24 * 60 * 60 * 1000;
        const pastDate = new Date(new Date(app.testing_start_date).getTime() - shiftMs);
        await base44.entities.App.update(app.id, {
          testing_start_date: pastDate.toISOString(),
        });

        const appSessions = sessions.filter(s => s.app_id === app.id && s.enrolled_at);
        await Promise.all(appSessions.map(s => {
          const pastEnrolled = new Date(new Date(s.enrolled_at).getTime() - shiftMs);
          return base44.entities.TestSession.update(s.id, { enrolled_at: pastEnrolled.toISOString() });
        }));
      }

      queryClient.invalidateQueries({ queryKey: ['dev-apps'] });
      queryClient.invalidateQueries({ queryKey: ['dev-sessions'] });
      toast.success(`Simulated ${days} days passing`);
    } catch (error) {
      toast.error('Failed to simulate time.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 text-purple-500" />
        <h3 className="font-semibold">Simulate Time Passing</h3>
      </div>
      <div className="flex gap-3">
        <Select value={selectedApp} onValueChange={setSelectedApp}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Select app" />
          </SelectTrigger>
          <SelectContent>
            {apps.filter(a => a.status === 'TESTING').map(a => (
              <SelectItem key={a.id} value={a.id}>{a.app_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input type="number" value={days} onChange={e => setDays(e.target.value)} className="w-24" placeholder="Days" />
        <Button onClick={handleSimulate} disabled={!selectedApp || processing}>
          {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Simulate'}
        </Button>
      </div>
    </div>
  );
}

function BypassUpload({ users, queryClient }) {
  const [selectedUser, setSelectedUser] = useState('');
  const [credits, setCredits] = useState('3');
  const [processing, setProcessing] = useState(false);

  const handleBypass = async () => {
    if (!selectedUser) return;
    setProcessing(true);

    try {
      const u = users.find(usr => usr.id === selectedUser);
      if (u) {
        await base44.entities.User.update(u.id, {
          tests_completed_since_last_upload: (u.tests_completed_since_last_upload || 0) + parseInt(credits),
          tests_completed_total: (u.tests_completed_total || 0) + parseInt(credits),
        });
      }
      queryClient.invalidateQueries({ queryKey: ['dev-users'] });
      toast.success(`Added ${credits} test credits`);
    } catch (error) {
      toast.error('Failed to add credits.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Shield className="w-4 h-4 text-red-500" />
        <h3 className="font-semibold">Bypass Test Requirement</h3>
      </div>
      <div className="flex gap-3">
        <Select value={selectedUser} onValueChange={setSelectedUser}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Select user" />
          </SelectTrigger>
          <SelectContent>
            {users.map(u => (
              <SelectItem key={u.id} value={u.id}>{u.email} ({u.tests_completed_since_last_upload || 0} credits)</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input type="number" value={credits} onChange={e => setCredits(e.target.value)} className="w-24" placeholder="Credits" />
        <Button onClick={handleBypass} disabled={!selectedUser || processing}>
          {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Credits'}
        </Button>
      </div>
    </div>
  );
}

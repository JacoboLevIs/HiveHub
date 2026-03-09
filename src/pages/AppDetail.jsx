import React, { useState } from 'react';
import { useNavigate, useOutletContext, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Users, Clock, ExternalLink, ArrowLeft, Loader2 } from 'lucide-react';
import { differenceInDays, format } from 'date-fns';
import { toast } from 'sonner';
import LeaveTestModal from '../components/apps/LeaveTestModal';
import TesterList from '../components/apps/TesterList';
import { appStatusConfig } from '../components/lib/status-config';
import { REQUIRED_TESTERS, TESTING_PERIOD_DAYS } from '../components/lib/constants';

export default function AppDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useOutletContext();
  const [searchParams] = useSearchParams();
  const appId = searchParams.get('id');
  const [joining, setJoining] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  const { data: app, isLoading: loadingApp } = useQuery({
    queryKey: ['app', appId],
    queryFn: async () => {
      const apps = await base44.entities.App.filter({ id: appId });
      return apps[0];
    },
    enabled: !!appId,
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ['app-sessions', appId],
    queryFn: () => base44.entities.TestSession.filter({ app_id: appId }),
    enabled: !!appId,
  });

  const mySession = sessions.find(s => s.tester_id === user?.id && s.status !== 'LEFT');
  const enrolledCount = sessions.filter(s => s.status === 'ENROLLED' || s.status === 'COMPLETED').length;
  const isOwner = app?.owner_id === user?.id;

  const daysElapsed = app?.testing_start_date
    ? differenceInDays(new Date(), new Date(app.testing_start_date))
    : 0;
  const daysRemaining = app?.status === 'TESTING' ? Math.max(TESTING_PERIOD_DAYS - daysElapsed, 0) : null;

  const handleJoinTest = async () => {
    if (isOwner) {
      toast.error("You can't test your own app");
      return;
    }
    if (mySession) {
      toast.error('You are already enrolled in this test.');
      return;
    }
    setJoining(true);
    try {
      await base44.entities.TestSession.create({
        app_id: appId,
        app_name: app.app_name,
        tester_id: user.id,
        tester_email: user.email,
        status: 'PENDING_GOOGLE_VERIFICATION',
        joined_at: new Date().toISOString(),
      });

      queryClient.invalidateQueries({ queryKey: ['app-sessions', appId] });
      navigate(`/Verification?app_id=${appId}`);
    } catch (err) {
      toast.error('Failed to join test.');
    } finally {
      setJoining(false);
    }
  };

  const handleLeave = async () => {
    if (!mySession) return;
    try {
      await base44.entities.TestSession.update(mySession.id, {
        status: 'LEFT',
        left_at: new Date().toISOString(),
      });

      const newEnrolled = Math.max((app.testers_enrolled || 0) - 1, 0);
      await base44.entities.App.update(appId, { testers_enrolled: newEnrolled });

      queryClient.invalidateQueries({ queryKey: ['app-sessions', appId] });
      queryClient.invalidateQueries({ queryKey: ['app', appId] });
      setShowLeaveModal(false);
      toast.success('You have left the test.');
    } catch (err) {
      toast.error('Failed to leave test.');
    }
  };

  if (loadingApp) {
    return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  if (!app) {
    return <div className="text-center py-20 text-muted-foreground">App not found</div>;
  }

  const status = appStatusConfig[app.status] || appStatusConfig.WAITING_FOR_TESTERS;

  return (
    <div className="space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-xl font-bold text-primary shrink-0">
              {app.app_name?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <h1 className="text-xl font-bold">{app.app_name}</h1>
              <p className="text-sm text-muted-foreground mt-1">{app.description || 'No description provided'}</p>
              <div className="flex items-center gap-2 mt-3">
                <Badge className={status.color}>{status.label}</Badge>
                {app.is_bootstrap && <Badge variant="outline" className="text-xs">Bootstrap</Badge>}
              </div>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            {app.playstore_link && (
              <a href={app.playstore_link} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">
                  <ExternalLink className="w-4 h-4 mr-1" /> Play Store
                </Button>
              </a>
            )}
            {!isOwner && !mySession && app.status !== 'COMPLETED' && (
              <Button onClick={handleJoinTest} disabled={joining} size="sm">
                {joining ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                Join Test
              </Button>
            )}
            {mySession && mySession.status === 'ENROLLED' && (
              <Button variant="destructive" size="sm" onClick={() => setShowLeaveModal(true)}>
                Leave Test
              </Button>
            )}
            {mySession && mySession.status === 'PENDING_GOOGLE_VERIFICATION' && (
              <Button size="sm" onClick={() => navigate(`/Verification?app_id=${appId}`)}>
                Complete Verification
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Users className="w-4 h-4" /> Testers
          </div>
          <p className="text-2xl font-bold">{enrolledCount} / {REQUIRED_TESTERS}</p>
          <Progress value={Math.min((enrolledCount / REQUIRED_TESTERS) * 100, 100)} className="h-1.5 mt-2" />
        </div>
        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Clock className="w-4 h-4" /> Testing Period
          </div>
          <p className="text-2xl font-bold">
            {daysRemaining !== null ? `${daysRemaining}d left` : app.status === 'COMPLETED' ? 'Done' : 'Not started'}
          </p>
          {daysRemaining !== null && <Progress value={(daysElapsed / TESTING_PERIOD_DAYS) * 100} className="h-1.5 mt-2" />}
        </div>
        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            Google Requirement
          </div>
          <p className={`text-2xl font-bold ${enrolledCount >= REQUIRED_TESTERS && daysElapsed >= TESTING_PERIOD_DAYS ? 'text-green-600' : ''}`}>
            {enrolledCount >= REQUIRED_TESTERS && daysElapsed >= TESTING_PERIOD_DAYS ? 'Met ✓' : 'In Progress'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">{REQUIRED_TESTERS} testers × {TESTING_PERIOD_DAYS} days</p>
        </div>
      </div>

      <TesterList sessions={sessions} />

      <LeaveTestModal
        open={showLeaveModal}
        onClose={() => setShowLeaveModal(false)}
        onLeave={handleLeave}
        canLeave={enrolledCount > REQUIRED_TESTERS}
      />
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, Lock, AlertCircle, Loader2 } from 'lucide-react';
import UploadProgress from '../components/dashboard/UploadProgress';
import { toast } from 'sonner';

const BOOTSTRAP_LIMIT = 20;

export default function UploadApp() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ app_name: '', playstore_link: '', description: '' });

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: totalApps = [] } = useQuery({
    queryKey: ['total-apps-count'],
    queryFn: () => base44.entities.App.list(),
  });

  const isBootstrap = totalApps.length < BOOTSTRAP_LIMIT;
  const completedSinceUpload = user?.tests_completed_since_last_upload || 0;
  const canUpload = isBootstrap || completedSinceUpload >= 3;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canUpload) return;
    setSubmitting(true);

    const appData = {
      ...form,
      owner_id: user.id,
      owner_email: user.email,
      status: 'WAITING_FOR_TESTERS',
      testers_enrolled: 0,
      is_bootstrap: isBootstrap,
    };

    await base44.entities.App.create(appData);

    const newCompletedSince = isBootstrap ? completedSinceUpload : completedSinceUpload - 3;
    const newAppsTotal = (user.apps_uploaded_total || 0) + 1;

    await base44.auth.updateMe({
      tests_completed_since_last_upload: Math.max(newCompletedSince, 0),
      apps_uploaded_total: newAppsTotal,
    });

    queryClient.invalidateQueries();
    toast.success('App uploaded successfully!');
    navigate('/Dashboard');
    setSubmitting(false);
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Upload App</h1>
        <p className="text-muted-foreground mt-1">Submit your app for closed testing</p>
      </div>

      {isBootstrap && (
        <Alert className="border-primary/30 bg-primary/5">
          <AlertCircle className="h-4 w-4 text-primary" />
          <AlertDescription className="text-sm">
            <strong>Bootstrap period:</strong> The first {BOOTSTRAP_LIMIT} apps don't require prior tests. ({totalApps.length}/{BOOTSTRAP_LIMIT} slots used)
          </AlertDescription>
        </Alert>
      )}

      {!isBootstrap && <UploadProgress completedSinceLastUpload={completedSinceUpload} />}

      {!canUpload ? (
        <div className="bg-card rounded-2xl border border-border p-8 text-center">
          <Lock className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-semibold text-lg">Upload Locked</h3>
          <p className="text-muted-foreground text-sm mt-1">
            Complete {3 - completedSinceUpload} more test{3 - completedSinceUpload !== 1 ? 's' : ''} to unlock a new app upload.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-card rounded-2xl border border-border p-6 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="app_name">App Name</Label>
            <Input
              id="app_name"
              placeholder="My Awesome App"
              value={form.app_name}
              onChange={e => setForm({ ...form, app_name: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="playstore_link">Google Play Testing Link</Label>
            <Input
              id="playstore_link"
              placeholder="https://play.google.com/apps/testing/..."
              value={form.playstore_link}
              onChange={e => setForm({ ...form, playstore_link: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Tell testers what your app does..."
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              rows={4}
            />
          </div>
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
            Upload App
          </Button>
        </form>
      )}
    </div>
  );
}
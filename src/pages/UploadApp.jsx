import React, { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, Lock, AlertCircle, Loader2 } from 'lucide-react';
import UploadProgress from '../components/dashboard/UploadProgress';
import { toast } from 'sonner';
import { BOOTSTRAP_LIMIT, TESTS_REQUIRED_FOR_UPLOAD } from '@/lib/constants';

export default function UploadApp() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useOutletContext();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ app_name: '', playstore_link: '', description: '' });

  const { data: appCount = 0 } = useQuery({
    queryKey: ['total-apps-count'],
    queryFn: async () => {
      const { count } = await supabase.from('apps').select('*', { count: 'exact', head: true });
      return count || 0;
    },
  });

  const isBootstrap = appCount < BOOTSTRAP_LIMIT;
  const completedSinceUpload = user?.tests_completed_since_last_upload || 0;
  const canUpload = isBootstrap || completedSinceUpload >= TESTS_REQUIRED_FOR_UPLOAD;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canUpload || !user) return;
    setSubmitting(true);

    try {
      await supabase.from('apps').insert({
        ...form,
        owner_id: user.id,
        owner_email: user.email,
        status: 'WAITING_FOR_TESTERS',
        testers_enrolled: 0,
        is_bootstrap: isBootstrap,
      });

      const newCompletedSince = isBootstrap ? completedSinceUpload : completedSinceUpload - TESTS_REQUIRED_FOR_UPLOAD;
      const newAppsTotal = (user.apps_uploaded_total || 0) + 1;

      await supabase.from('profiles').update({
        tests_completed_since_last_upload: Math.max(newCompletedSince, 0),
        apps_uploaded_total: newAppsTotal,
      }).eq('id', user.id);

      queryClient.invalidateQueries({ queryKey: ['my-apps'] });
      queryClient.invalidateQueries({ queryKey: ['total-apps-count'] });
      queryClient.invalidateQueries({ queryKey: ['all-apps'] });
      toast.success('App uploaded successfully!');
      navigate('/Dashboard');
    } catch (error) {
      toast.error(error.message || 'Failed to upload app. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const remaining = TESTS_REQUIRED_FOR_UPLOAD - completedSinceUpload;

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
            <strong>Bootstrap period:</strong> The first {BOOTSTRAP_LIMIT} apps don't require prior tests. ({appCount}/{BOOTSTRAP_LIMIT} slots used)
          </AlertDescription>
        </Alert>
      )}

      {!isBootstrap && <UploadProgress completedSinceLastUpload={completedSinceUpload} />}

      {!canUpload ? (
        <div className="bg-card rounded-2xl border border-border p-8 text-center">
          <Lock className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-semibold text-lg">Upload Locked</h3>
          <p className="text-muted-foreground text-sm mt-1">
            Complete {remaining} more test{remaining !== 1 ? 's' : ''} to unlock a new app upload.
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

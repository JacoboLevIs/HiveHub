import React, { useState } from 'react';
import { useNavigate, useOutletContext, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, CheckCircle2, XCircle, Loader2, ExternalLink, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const CONFIRMATION_PHRASES = [
  "you're now a tester",
  "become a tester",
  "join the testing program",
  "you are now a tester",
  "accepted into the testing program",
  "you have joined",
  "tester for this app",
  "now a tester for",
  "joined the test",
  "you've joined",
  "testing program for",
];

function fuzzyMatch(text, target) {
  const normalize = s => s.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
  const normalizedText = normalize(text);
  const normalizedTarget = normalize(target);
  if (normalizedText.includes(normalizedTarget)) return true;
  const targetWords = normalizedTarget.split(' ');
  const matchCount = targetWords.filter(w => w.length > 2 && normalizedText.includes(w)).length;
  return targetWords.length > 0 && (matchCount / targetWords.length) >= 0.6;
}

export default function Verification() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useOutletContext();
  const [searchParams] = useSearchParams();
  const appId = searchParams.get('app_id');
  const [file, setFile] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const { data: app } = useQuery({
    queryKey: ['app-for-verification', appId],
    queryFn: async () => {
      const apps = await base44.entities.App.filter({ id: appId });
      return apps[0];
    },
    enabled: !!appId,
  });

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setError(null);
    }
  };

  const handleVerify = async () => {
    if (!file || !app || !user) return;
    setVerifying(true);
    setError(null);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      const extractedText = await base44.integrations.Core.InvokeLLM({
        prompt: `Extract ALL text visible in this screenshot. Return the complete text as-is, including any app names, confirmation messages, buttons, and UI text. Do not summarize or interpret.`,
        file_urls: [file_url],
        response_json_schema: {
          type: "object",
          properties: {
            extracted_text: { type: "string" }
          }
        }
      });

      const text = extractedText.extracted_text || '';
      const hasConfirmation = CONFIRMATION_PHRASES.some(phrase => fuzzyMatch(text, phrase));
      const hasAppName = fuzzyMatch(text, app.app_name);

      if (hasConfirmation && hasAppName) {
        const sessions = await base44.entities.TestSession.filter({
          app_id: appId,
          tester_id: user.id,
        });
        const pendingSession = sessions.find(s => s.status === 'PENDING_GOOGLE_VERIFICATION');

        if (pendingSession) {
          const now = new Date().toISOString();
          await base44.entities.TestSession.update(pendingSession.id, {
            status: 'ENROLLED',
            enrolled_at: now,
          });

          const newEnrolled = (app.testers_enrolled || 0) + 1;
          const updateData = { testers_enrolled: newEnrolled };
          if (app.status === 'WAITING_FOR_TESTERS') {
            updateData.status = 'TESTING';
            updateData.testing_start_date = now;
          }
          await base44.entities.App.update(appId, updateData);
        }

        queryClient.invalidateQueries({ queryKey: ['app-sessions', appId] });
        queryClient.invalidateQueries({ queryKey: ['app', appId] });
        setSuccess(true);
        toast.success('Verification successful! You are now enrolled.');
      } else {
        let msg = 'The uploaded screenshot does not appear to be the Google Play tester confirmation page for this app.';
        if (!hasConfirmation) msg += ' Could not find a Google Play tester confirmation message.';
        if (!hasAppName) msg += ` Could not find the app name "${app.app_name}" in the screenshot.`;
        setError(msg);
      }
    } catch (err) {
      toast.error('Verification failed. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-lg mx-auto text-center py-20 space-y-4">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-xl font-bold">Verification Successful!</h2>
        <p className="text-muted-foreground">You are now enrolled as a tester for <strong>{app?.app_name}</strong>.</p>
        <p className="text-sm text-muted-foreground">Your 14-day testing period has started.</p>
        <Button onClick={() => navigate(`/AppDetail?id=${appId}`)}>View App</Button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Verify Google Play Enrollment</h1>
        <p className="text-muted-foreground mt-1">Confirm that you've joined the testing program</p>
      </div>

      <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
        <h3 className="font-semibold">Steps to verify:</h3>
        <ol className="space-y-3 text-sm text-muted-foreground">
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">1</span>
            <div>
              Open the Google Play testing link below and accept the invitation
              {app?.playstore_link && (
                <a href={app.playstore_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary mt-1 font-medium">
                  <ExternalLink className="w-3.5 h-3.5" /> Open Testing Link
                </a>
              )}
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">2</span>
            <span>Google Play will show a confirmation page saying you are now a tester</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">3</span>
            <span>Take a screenshot of that confirmation page</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">4</span>
            <span>Upload the screenshot below for verification</span>
          </li>
        </ol>

        <div className="border-2 border-dashed border-border rounded-xl p-6 text-center">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            id="screenshot-upload"
          />
          <label htmlFor="screenshot-upload" className="cursor-pointer">
            <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm font-medium">{file ? file.name : 'Click to upload screenshot'}</p>
            <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 10MB</p>
          </label>
        </div>

        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">{error}</AlertDescription>
          </Alert>
        )}

        <Button onClick={handleVerify} disabled={!file || verifying} className="w-full">
          {verifying ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Verifying screenshot...
            </>
          ) : (
            'Verify Screenshot'
          )}
        </Button>
      </div>
    </div>
  );
}
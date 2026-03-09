import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Lock, Unlock } from 'lucide-react';
import { TESTS_REQUIRED_FOR_UPLOAD } from '../lib/constants';

export default function UploadProgress({ completedSinceLastUpload = 0 }) {
  const progress = Math.min(completedSinceLastUpload, TESTS_REQUIRED_FOR_UPLOAD);
  const percentage = (progress / TESTS_REQUIRED_FOR_UPLOAD) * 100;
  const unlocked = progress >= TESTS_REQUIRED_FOR_UPLOAD;

  return (
    <div className="bg-card rounded-2xl border border-border p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Upload Progress</p>
          <p className="text-lg font-semibold mt-0.5">
            {unlocked ? 'Ready to upload!' : `${progress} / ${TESTS_REQUIRED_FOR_UPLOAD} tests completed`}
          </p>
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${unlocked ? 'bg-green-500/10' : 'bg-muted'}`}>
          {unlocked
            ? <Unlock className="w-5 h-5 text-green-600" />
            : <Lock className="w-5 h-5 text-muted-foreground" />
          }
        </div>
      </div>
      <Progress value={percentage} className="h-2" />
      <p className="text-xs text-muted-foreground mt-2">
        {unlocked
          ? 'You can upload a new app to TestHive'
          : `Complete ${TESTS_REQUIRED_FOR_UPLOAD - progress} more test${TESTS_REQUIRED_FOR_UPLOAD - progress !== 1 ? 's' : ''} to unlock`
        }
      </p>
    </div>
  );
}
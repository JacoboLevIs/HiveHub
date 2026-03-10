import React from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { AlertTriangle, Loader2 } from 'lucide-react';

export default function LeaveTestModal({ open, onClose, onLeave, canLeave, loading }) {
  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <AlertDialogTitle>Are you sure you want to leave?</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="mt-2">
            {canLeave
              ? "Leaving this test could cause the number of testers to fall below the Google Play requirement."
              : "This test currently has the minimum number of testers required by Google Play. A replacement tester must join before you can leave."
            }
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Stay in Test</AlertDialogCancel>
          {canLeave && (
            <AlertDialogAction
              onClick={onLeave}
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
              Leave Anyway
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

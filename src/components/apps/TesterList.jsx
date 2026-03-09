import React from 'react';
import { Badge } from '@/components/ui/badge';
import { format, differenceInDays } from 'date-fns';
import { sessionStatusConfig } from '../lib/status-config';
import { TESTING_PERIOD_DAYS } from '../lib/constants';

export default function TesterList({ sessions }) {
  const activeSessions = sessions.filter(s => s.status !== 'LEFT');

  if (activeSessions.length === 0) {
    return (
      <div className="bg-card rounded-2xl border border-border p-6 text-center text-muted-foreground">
        No testers yet. Be the first to join!
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <div className="px-5 py-3 border-b border-border">
        <h3 className="font-semibold text-sm">Testers ({activeSessions.length})</h3>
      </div>
      <div className="divide-y divide-border">
        {activeSessions.map(session => {
          const st = sessionStatusConfig[session.status] || sessionStatusConfig.ENROLLED;
          const daysIn = session.enrolled_at ? differenceInDays(new Date(), new Date(session.enrolled_at)) : 0;

          return (
            <div key={session.id} className="px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold">
                  {session.tester_email?.[0]?.toUpperCase() || '?'}
                </div>
                <div>
                  <p className="text-sm font-medium">{session.tester_email}</p>
                  <p className="text-xs text-muted-foreground">
                    Joined {session.joined_at ? format(new Date(session.joined_at), 'MMM d, yyyy') : 'N/A'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {session.status === 'ENROLLED' && (
                  <span className="text-xs text-muted-foreground">Day {daysIn}/{TESTING_PERIOD_DAYS}</span>
                )}
                <Badge className={st.color}>{st.label}</Badge>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
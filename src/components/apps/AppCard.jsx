import React from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Users, Clock, CheckCircle2 } from 'lucide-react';
import { differenceInDays } from 'date-fns';
import { appStatusConfig } from '@/lib/status-config';
import { REQUIRED_TESTERS, TESTING_PERIOD_DAYS } from '@/lib/constants';

export default function AppCard({ app }) {
  const status = appStatusConfig[app.status] || appStatusConfig.WAITING_FOR_TESTERS;
  const daysElapsed = app.testing_start_date
    ? differenceInDays(new Date(), new Date(app.testing_start_date))
    : 0;
  const daysRemaining = app.status === 'TESTING' ? Math.max(TESTING_PERIOD_DAYS - daysElapsed, 0) : null;

  return (
    <Link
      to={`/app/${app.id}`}
      className="block bg-card rounded-2xl border border-border p-5 hover:shadow-lg hover:border-primary/30 transition-all duration-200 group"
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-lg font-bold text-primary shrink-0">
          {app.app_name?.[0]?.toUpperCase() || '?'}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base truncate group-hover:text-primary transition-colors">
            {app.app_name}
          </h3>
          <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{app.description || 'No description'}</p>
          <div className="flex flex-wrap items-center gap-3 mt-3">
            <Badge variant="outline" className={`text-xs font-medium ${status.color} ${status.borderColor}`}>
              {status.label}
            </Badge>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="w-3.5 h-3.5" />
              {app.testers_enrolled || 0} / {REQUIRED_TESTERS} testers
            </span>
            {daysRemaining !== null && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3.5 h-3.5" />
                {daysRemaining}d remaining
              </span>
            )}
            {app.status === 'COMPLETED' && (
              <span className="flex items-center gap-1 text-xs text-green-600">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Done
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

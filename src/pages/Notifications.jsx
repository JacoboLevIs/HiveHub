import React from 'react';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/api/supabaseClient';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Bell, CheckCheck, UserPlus, Award, PartyPopper, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const typeIcons = {
  tester_joined: UserPlus,
  test_completed: Award,
  app_requirement_met: PartyPopper,
  default: Bell,
};

const typeColors = {
  tester_joined: 'bg-blue-100 text-blue-600',
  test_completed: 'bg-green-100 text-green-600',
  app_requirement_met: 'bg-amber-100 text-amber-600',
  default: 'bg-muted text-muted-foreground',
};

export default function Notifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['all-notifications', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('notifications').select('*').eq('user_id', user.id);
      return data || [];
    },
    enabled: !!user?.id,
  });

  const sorted = [...notifications].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );

  const unreadCount = sorted.filter((n) => !n.read).length;

  const markAllRead = async () => {
    try {
      const unread = sorted.filter((n) => !n.read);
      await Promise.all(
        unread.map((n) =>
          supabase.from('notifications').update({ read: true }).eq('id', n.id)
        )
      );
      queryClient.invalidateQueries({ queryKey: ['all-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-notifications'] });
    } catch { /* silent */ }
  };

  const markOneRead = async (id) => {
    try {
      await supabase.from('notifications').update({ read: true }).eq('id', id);
      queryClient.invalidateQueries({ queryKey: ['all-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-notifications'] });
    } catch { /* silent */ }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground mt-1">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead}>
            <CheckCheck className="w-4 h-4 mr-1" /> Mark all read
          </Button>
        )}
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-20">
          <Bell className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No notifications yet</p>
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border overflow-hidden divide-y divide-border">
          {sorted.map((notification) => {
            const Icon = typeIcons[notification.type] || typeIcons.default;
            const colorClass = typeColors[notification.type] || typeColors.default;
            const timeAgo = notification.created_at
              ? formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })
              : '';
            return (
              <div
                key={notification.id}
                className={`px-5 py-4 flex items-start gap-4 transition-colors ${!notification.read ? 'bg-primary/[0.03]' : ''}`}
                onClick={() => !notification.read && markOneRead(notification.id)}
                role="button"
                tabIndex={0}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${colorClass}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${!notification.read ? 'font-medium' : 'text-muted-foreground'}`}>
                    {notification.message}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{timeAgo}</p>
                </div>
                {!notification.read && (
                  <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

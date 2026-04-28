import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

export interface LandlordNotification {
  id: string;
  landlord_id: string;
  type: string;
  title: string;
  body: string;
  metadata: any;
  is_read: boolean;
  created_at: string;
}

/**
 * useNotifications Hook
 *
 * WHAT IT DOES: Fetches and manages the landlord's notification list.
 * ANALOGY: Like checking your email inbox, but for REHWAS alerts.
 *
 * SUPABASE REALTIME:
 * ANALOGY: Like push notifications on your phone — instead of refreshing every
 * minute to check for new messages, the server pushes them to you the instant they arrive.
 */
export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<LandlordNotification[]>([]);
  const [loading, setLoading] = useState(true);
  // Stable ref so the useEffect doesn't re-run when fetchNotifications re-creates
  const fetchRef = useRef<(() => Promise<void>) | null>(null);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  /**
   * Fetches all notifications for the current landlord.
   */
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('landlord_notifications')
        .select('*')
        .eq('landlord_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code === '42P01') {
          console.warn('landlord_notifications table not found. Please run the migrations.');
        } else {
          console.error('Error fetching notifications:', error);
        }
        return;
      }

      if (data) {
        setNotifications(data);
      }
    } catch (err) {
      console.error('Unexpected error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Keep fetchRef in sync without adding it as an effect dependency
  fetchRef.current = fetchNotifications;

  /**
   * Marks a specific notification as read.
   */
  const markAsRead = async (id: string) => {
    const { error } = await supabase
      .from('landlord_notifications')
      .update({ is_read: true })
      .eq('id', id);

    if (!error) {
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
    }
  };

  /**
   * Marks all notifications for the landlord as read.
   */
  const markAllRead = async () => {
    if (!user) return;

    const { error } = await supabase
      .from('landlord_notifications')
      .update({ is_read: true })
      .eq('landlord_id', user.id)
      .eq('is_read', false);

    if (!error) {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    }
  };

  useEffect(() => {
    if (!user?.id) return;

    // Call fetch via ref so this effect only re-runs when user.id changes,
    // not every time fetchNotifications is recreated by useCallback.
    fetchRef.current?.();

    /**
     * Use a unique channel name per user to prevent Supabase from
     * reusing a stale "joining" channel instance across re-renders.
     * All .on() listeners must be chained BEFORE .subscribe().
     */
    const channelName = `landlord-notifications-${user.id}`;

    // Guard: remove any stale channel Supabase may still hold (e.g. after HMR
    // hot-reload or React Strict Mode double-invocation) before re-subscribing.
    const stale = supabase.getChannels().find(c => c.topic === `realtime:${channelName}`);
    if (stale) supabase.removeChannel(stale);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'landlord_notifications',
          filter: `landlord_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new) {
            setNotifications(prev => [payload.new as LandlordNotification, ...prev]);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'landlord_notifications',
          filter: `landlord_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new) {
            const updated = payload.new as LandlordNotification;
            setNotifications(prev =>
              prev.map(n => n.id === updated.id ? updated : n)
            );
          }
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.warn('Realtime subscription error for notifications. Table might be missing.');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]); // Only re-run when the user ID changes, not on every render

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllRead,
    fetchNotifications,
  };
}

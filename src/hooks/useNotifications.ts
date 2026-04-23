import { useState, useEffect, useCallback } from 'react';
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

  const unreadCount = notifications.filter(n => !n.is_read).length;

  /**
   * Fetches all notifications for the current landlord.
   */
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    
    const { data, error } = await supabase
      .from('landlord_notifications')
      .select('*')
      .eq('landlord_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setNotifications(data);
    }
    setLoading(false);
  }, [user]);

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
    if (!user) return;

    fetchNotifications();

    /**
     * Subscribe to Realtime changes on landlord_notifications table.
     * This ensures the UI stays in sync with the database without manual polling.
     */
    const channel = supabase
      .channel('landlord-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'landlord_notifications',
          filter: `landlord_id=eq.${user.id}`,
        },
        (payload) => {
          setNotifications(prev => [payload.new as LandlordNotification, ...prev]);
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
          const updated = payload.new as LandlordNotification;
          setNotifications(prev => 
            prev.map(n => n.id === updated.id ? updated : n)
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllRead,
    fetchNotifications
  };
}

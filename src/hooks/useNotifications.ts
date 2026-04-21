import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import type { Notification } from '@/types';

/**
 * useNotifications Hook
 * 
 * WHAT IT DOES: Manages the lifecycle of user notifications, including real-time synchronization.
 * 
 * PUB/SUB PATTERN: 
 * Think of this like a "Mailbox" that notifies you the moment a letter arrives. 
 * Instead of checking the mailbox every 5 minutes (polling), we establish a "Real-time" 
 * connection (WebSocket) with Supabase. 
 * 
 * When a notification is inserted into the DB, Supabase "pushes" it to this hook instantly. 
 * This creates a magical SaaS experience where badges increment live without page refreshes.
 */
export const useNotifications = () => {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const unreadCount = notifications.filter(n => !n.read).length;

  /**
   * Loads initial notification history from Supabase.
   */
  const fetchNotifications = async () => {
    if (!profile) return;
    setLoading(true);
    
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching notifications:', error);
    } else {
      setNotifications(data || []);
    }
    setLoading(false);
  };

  /**
   * Marks a specific notification as read.
   */
  const markAsRead = async (id: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id);

    if (!error) {
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
    }
  };

  /**
   * Marks all unread notifications for the user as read.
   */
  const markAllRead = async () => {
    if (!profile) return;
    
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', profile.id)
      .eq('read', false);

    if (!error) {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }
  };

  useEffect(() => {
    if (!profile) return;

    fetchNotifications();

    // Subscribe to REALTIME notifications for the current user
    const channel = supabase
      .channel(`user-notifications-${profile.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${profile.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setNotifications(prev => [payload.new as Notification, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as Notification;
            setNotifications(prev => 
              prev.map(n => n.id === updated.id ? updated : n)
            );
          } else if (payload.eventType === 'DELETE') {
            setNotifications(prev => prev.filter(n => n.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllRead,
    fetchNotifications
  };
};

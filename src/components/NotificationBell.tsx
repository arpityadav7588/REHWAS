import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Bell, X, IndianRupee, MessageSquare, Mail } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'react-hot-toast';

/**
 * NotificationBell Component
 *
 * The drawer is rendered via React Portal directly into document.body.
 * This is essential because the bell icon lives inside a CSS `fixed` sidebar,
 * which creates a new stacking context. Any child `fixed` element inside that
 * sidebar would be positioned relative to the sidebar, not the viewport.
 * Portal bypasses this entirely — the drawer always anchors to the true viewport.
 */
export const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllRead } = useNotifications();

  const drawer = (
    <>
      {/* Backdrop — always mounted, fades in/out via opacity */}
      <div
        onClick={() => setIsOpen(false)}
        className={`
          fixed inset-0 bg-black/30 backdrop-blur-[2px] z-[9998]
          transition-opacity duration-300
          ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        `}
        aria-hidden="true"
      />

      {/* Drawer — slides in from the RIGHT edge of the viewport */}
      <aside
        aria-label="Notifications panel"
        className={`
          fixed top-0 right-0 h-full w-full max-w-sm bg-white shadow-2xl z-[9999]
          flex flex-col transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between shrink-0">
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Notifications</h2>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                Mark all read
              </button>
            )}
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-50 transition-all"
              aria-label="Close notifications"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center">
                <Mail className="text-slate-300" size={32} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 mb-1">No notifications yet</h3>
                <p className="text-sm text-slate-400 font-medium">
                  You'll see rent reminders and important alerts here.
                </p>
              </div>
            </div>
          ) : (
            notifications.map((notif) => (
              <NotificationCard
                key={notif.id}
                notification={notif}
                onRead={() => markAsRead(notif.id)}
              />
            ))
          )}
        </div>
      </aside>
    </>
  );

  return (
    <>
      {/* Bell trigger button — stays wherever it's placed in the DOM */}
      <button
        onClick={() => setIsOpen(true)}
        className="relative p-2 hover:bg-slate-100 rounded-xl transition-all group"
        aria-label="Open notifications"
      >
        <Bell className="w-6 h-6 text-slate-500 group-hover:text-slate-900 transition-colors" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500 text-white text-[9px] font-black items-center justify-center border border-white">
              {unreadCount}
            </span>
          </span>
        )}
      </button>

      {/* Portal: renders drawer at document.body, escaping any stacking context */}
      {createPortal(drawer, document.body)}
    </>
  );
};

// ─── Notification Card ───────────────────────────────────────────────────────

const NotificationCard = ({
  notification,
  onRead,
}: {
  notification: any;
  onRead: () => void;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const metadata = notification.metadata;

  const handleExpand = () => {
    if (!isExpanded && !notification.is_read) onRead();
    setIsExpanded(!isExpanded);
  };

  const sendAllReminders = (e: React.MouseEvent) => {
    e.stopPropagation();
    const links = metadata?.tenant_links || [];
    links.forEach((linkObj: any, index: number) => {
      setTimeout(() => window.open(linkObj.whatsapp_link, '_blank'), index * 500);
    });
    toast.success(`${links.length} WhatsApp messages opened`);
  };

  if (notification.type === 'weekly_arrears_report') {
    return (
      <div
        onClick={handleExpand}
        className={`group relative bg-white border rounded-2xl p-4 transition-all cursor-pointer hover:shadow-md ${
          notification.is_read ? 'border-slate-100 opacity-80' : 'border-rose-100 bg-rose-50/30'
        }`}
      >
        {!notification.is_read && (
          <div className="absolute top-4 right-4 w-2 h-2 bg-rose-500 rounded-full" />
        )}
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
            <IndianRupee className="text-rose-600" size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-black text-slate-900 text-sm leading-tight mb-0.5">
              {notification.title}
            </h4>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              This month · Friday summary
            </p>
            <p className="text-[10px] font-bold text-slate-400 mt-1">
              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
            </p>
          </div>
        </div>

        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
            {metadata?.tenant_links?.map((tenant: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between bg-slate-50 p-3 rounded-xl">
                <div className="min-w-0">
                  <p className="text-xs font-black text-slate-900 truncate">{tenant.tenant_name}</p>
                  <p className="text-[10px] font-bold text-slate-500">
                    ₹{tenant.amount_due?.toLocaleString()} · {tenant.room_title}
                  </p>
                </div>
                <a
                  href={tenant.whatsapp_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-emerald-100 transition-colors"
                >
                  Remind <MessageSquare size={12} />
                </a>
              </div>
            ))}
            <button
              onClick={sendAllReminders}
              className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 transition-all active:scale-95"
            >
              Send All <MessageSquare size={14} />
            </button>
          </div>
        )}
      </div>
    );
  }

  // Generic fallback card
  return (
    <div
      onClick={() => !notification.is_read && onRead()}
      className={`bg-white border rounded-2xl p-4 transition-all cursor-pointer ${
        notification.is_read ? 'border-slate-100 opacity-60' : 'border-emerald-100 bg-emerald-50/20'
      }`}
    >
      {!notification.is_read && (
        <div className="w-2 h-2 bg-emerald-500 rounded-full ml-auto mb-2" />
      )}
      <h4 className="font-bold text-slate-900 text-sm">{notification.title}</h4>
      <p className="text-xs text-slate-500 mt-1">{notification.body}</p>
      <p className="text-[10px] font-bold text-slate-400 mt-2">
        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
      </p>
    </div>
  );
};

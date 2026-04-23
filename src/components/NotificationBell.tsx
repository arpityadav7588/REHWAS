import React, { useState } from 'react';
import { Bell, X, IndianRupee, MessageSquare, Check, Mail } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'react-hot-toast';

/**
 * NotificationBell Component
 * 
 * WHAT IT DOES: Displays a notification bell with a real-time unread badge 
 * and a right-side drawer containing landlord alerts.
 * 
 * WHY A DRAWER?
 * Unlike a dropdown, a drawer feels like a "Control Center" or a "Side Panel" 
 * in modern SaaS (like Slack or Linear). It doesn't obscure the main view 
 * and provides more horizontal space for complex cards like the Weekly Arrears Report.
 */
export const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllRead } = useNotifications();

  return (
    <div className="relative">
      {/* Bell Icon & Badge */}
      <button 
        onClick={() => setIsOpen(true)}
        className="relative p-2 hover:bg-slate-50 rounded-xl transition-all group"
      >
        <Bell className="w-6 h-6 text-slate-500 group-hover:text-dark transition-colors" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 w-4">
            <span className="animate-pulse-dot absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500 text-white text-[9px] font-black items-center justify-center border border-white">
              {unreadCount}
            </span>
          </span>
        )}
      </button>

      {/* Drawer Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-dark/20 backdrop-blur-sm z-[100] animate-in fade-in duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Drawer Content */}
      <aside className={`
        fixed inset-y-0 right-0 w-full max-w-[360px] bg-white shadow-2xl z-[101] transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-50 flex items-center justify-between">
            <h2 className="text-xl font-black text-dark tracking-tight">Notifications</h2>
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <button 
                  onClick={markAllRead}
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
                >
                  Mark all as read
                </button>
              )}
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 text-slate-400 hover:text-dark transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
            {notifications.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center">
                  <Mail className="text-slate-200" size={32} />
                </div>
                <div>
                  <h3 className="font-bold text-dark mb-1">No notifications yet</h3>
                  <p className="text-sm text-slate-400 font-medium">You'll see rent reminders and important alerts here.</p>
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
        </div>
      </aside>
    </div>
  );
};

const NotificationCard = ({ notification, onRead }: { notification: any, onRead: () => void }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const metadata = notification.metadata;

  const handleExpand = () => {
    if (!isExpanded && !notification.is_read) {
      onRead();
    }
    setIsExpanded(!isExpanded);
  };

  /**
   * WHY THE DELAY?
   * ANALOGY: Like a human clicking through tabs one at a time — 
   * opening 5 browser tabs simultaneously overwhelms the browser and might 
   * be flagged as suspicious behavior. A 500ms stagger makes it feel intentional.
   */
  const sendAllReminders = (e: React.MouseEvent) => {
    e.stopPropagation();
    const links = metadata.tenant_links || [];
    links.forEach((linkObj: any, index: number) => {
      setTimeout(() => {
        window.open(linkObj.whatsapp_link, '_blank');
      }, index * 500);
    });
    toast.success(`${links.length} WhatsApp messages opened`);
  };

  if (notification.type === 'weekly_arrears_report') {
    return (
      <div 
        onClick={handleExpand}
        className={`group relative bg-white border rounded-2xl p-4 transition-all cursor-pointer hover:shadow-md ${
          notification.is_read ? 'border-slate-100 opacity-80' : 'border-rose-100 bg-rose-50/20'
        }`}
      >
        {!notification.is_read && (
          <div className="absolute top-4 right-4 w-2 h-2 bg-rose-500 rounded-full"></div>
        )}
        
        <div className="flex gap-4">
          <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
            <IndianRupee className="text-rose-600" size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-black text-dark text-sm leading-tight mb-0.5">{notification.title}</h4>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">This month • Friday summary</p>
            <p className="text-[10px] font-bold text-slate-400 mt-2">
              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
            </p>
          </div>
        </div>

        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-slate-100 space-y-3 animate-in slide-in-from-top-2 duration-300">
            <div className="space-y-2">
              {metadata.tenant_links?.map((tenant: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between bg-white border border-slate-50 p-3 rounded-xl shadow-sm">
                  <div className="min-w-0">
                    <p className="text-xs font-black text-dark truncate">{tenant.tenant_name}</p>
                    <p className="text-[10px] font-bold text-slate-500">₹{tenant.amount_due.toLocaleString()} • {tenant.room_title}</p>
                  </div>
                  <a 
                    href={tenant.whatsapp_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-emerald-100 transition-colors"
                  >
                    Reminder <MessageSquare size={12} />
                  </a>
                </div>
              ))}
            </div>
            
            <button 
              onClick={sendAllReminders}
              className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 shadow-lg shadow-emerald-900/20 transition-all active:scale-95"
            >
              Send All Reminders <MessageSquare size={14} />
            </button>
          </div>
        )}
      </div>
    );
  }

  // Fallback card for other types
  return (
    <div 
      onClick={() => !notification.is_read && onRead()}
      className={`bg-white border rounded-2xl p-4 transition-all ${
        notification.is_read ? 'border-slate-100 opacity-60' : 'border-emerald-100'
      }`}
    >
      <h4 className="font-bold text-dark text-sm">{notification.title}</h4>
      <p className="text-xs text-slate-500 mt-1">{notification.body}</p>
      <p className="text-[10px] font-bold text-slate-400 mt-2">
        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
      </p>
    </div>
  );
};

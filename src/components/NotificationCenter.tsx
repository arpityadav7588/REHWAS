import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell as BellIcon, 
  Circle, 
  IndianRupee, 
  Calendar, 
  MessageSquare, 
  Settings, 
  AlertCircle,
  Megaphone
} from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { format, isToday, isWithinInterval, subDays, startOfToday } from 'date-fns';
import type { Notification } from '@/types';

/**
 * NotificationCenter Component
 * 
 * WHAT IT DOES: Renders a bell icon with an unread badge and a sophisticated dropdown panel.
 * 
 * DESIGN RATIONALE:
 * Uses semantic colors and icons to provide instant visual context (e.g. green for money, red for dues).
 * Groups by time (Today, Week, Earlier) to reduce cognitive load on power users.
 */
export const NotificationCenter = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllRead } = useNotifications();
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'rent_paid': return { icon: IndianRupee, color: 'bg-emerald-100 text-emerald-600' };
      case 'visit_request': return { icon: Calendar, color: 'bg-blue-100 text-blue-600' };
      case 'new_message': return { icon: MessageSquare, color: 'bg-purple-100 text-purple-600' };
      case 'maintenance_open': return { icon: Settings, color: 'bg-amber-100 text-amber-600' };
      case 'rent_due': return { icon: AlertCircle, color: 'bg-rose-100 text-rose-600' };
      case 'system': return { icon: Megaphone, color: 'bg-slate-100 text-slate-600' };
      default: return { icon: BellIcon, color: 'bg-slate-100 text-slate-600' };
    }
  };

  const groupNotifications = () => {
    const today = startOfToday();
    const weekAgo = subDays(today, 7);

    return {
      today: notifications.filter(n => isToday(new Date(n.created_at))),
      thisWeek: notifications.filter(n => {
        const d = new Date(n.created_at);
        return !isToday(d) && isWithinInterval(d, { start: weekAgo, end: today });
      }),
      earlier: notifications.filter(n => new Date(n.created_at) < weekAgo)
    };
  };

  const handleItemClick = (notification: Notification) => {
    markAsRead(notification.id);
    setIsOpen(false);
    if (notification.link) {
      // Check if it's a hash link or full path
      if (notification.link.startsWith('#')) {
        navigate(`/dashboard${notification.link}`);
      } else {
        navigate(notification.link);
      }
    }
  };

  const groups = groupNotifications();

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl hover:bg-slate-50 transition-colors group"
        aria-label="Notifications"
      >
        <BellIcon className={`w-6 h-6 transition-colors ${isOpen ? 'text-brand' : 'text-slate-500 group-hover:text-slate-900'}`} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-5 h-5 bg-rose-500 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white animate-in zoom-in">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-[340px] bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-[200] animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
            <h3 className="font-black text-slate-900 tracking-tight">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllRead}
                className="text-xs font-bold text-brand hover:text-emerald-700 transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[420px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-100">
            {notifications.length === 0 ? (
              <div className="py-12 flex flex-col items-center text-center px-8">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
                  <BellIcon className="text-slate-200" size={32} />
                </div>
                <p className="font-bold text-slate-900 mb-1">No notifications yet</p>
                <p className="text-sm text-slate-400 font-medium">When something important happens, we'll let you know.</p>
              </div>
            ) : (
              <div className="flex flex-col">
                <NotificationSection title="Today" items={groups.today} onItemClick={handleItemClick} getIcon={getIcon} />
                <NotificationSection title="This Week" items={groups.thisWeek} onItemClick={handleItemClick} getIcon={getIcon} />
                <NotificationSection title="Earlier" items={groups.earlier} onItemClick={handleItemClick} getIcon={getIcon} />
              </div>
            )}
          </div>

          <div className="p-3 bg-slate-50 border-t border-slate-100">
            <button 
              onClick={() => { navigate('/notifications'); setIsOpen(false); }}
              className="w-full py-2.5 text-center text-sm font-bold text-slate-500 hover:text-brand transition-colors"
            >
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const NotificationSection = ({ title, items, onItemClick, getIcon }: any) => {
  if (items.length === 0) return null;

  return (
    <div className="flex flex-col">
      <div className="px-5 py-2 bg-slate-50/50">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</span>
      </div>
      <div className="flex flex-col">
        {items.map((item: Notification) => {
          const { icon: Icon, color } = getIcon(item.type);
          return (
            <button
              key={item.id}
              onClick={() => onItemClick(item)}
              className={`px-5 py-4 flex items-start gap-4 hover:bg-slate-50 transition-colors text-left border-b border-slate-50 last:border-0 ${!item.read ? 'bg-brand/5' : ''}`}
            >
              <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                <Icon size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-2">
                  <p className={`text-sm leading-tight truncate ${!item.read ? 'font-bold text-slate-900' : 'font-semibold text-slate-600'}`}>
                    {item.title}
                  </p>
                  {!item.read && <Circle className="w-2 h-2 fill-blue-500 text-blue-500 mt-1.5 shrink-0" />}
                </div>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2 font-medium">
                  {item.body}
                </p>
                <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-tighter">
                  {format(new Date(item.created_at), 'h:mm a')}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

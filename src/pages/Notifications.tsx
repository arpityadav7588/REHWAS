import { useNavigate } from 'react-router-dom';
import { 
  Bell as BellIcon, 
  IndianRupee, 
  Calendar, 
  MessageSquare, 
  Settings, 
  AlertCircle,
  Megaphone,
  CheckCircle2,
  ArrowLeft
} from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import type { Notification } from '@/types';

/**
 * Notifications Page
 * 
 * WHAT IT DOES: Provides a full-screen, focused history of all user activity.
 * ANALOGY: Like an email inbox specifically for your home/property life.
 */
export default function Notifications() {
  const { notifications, loading, markAsRead, markAllRead } = useNotifications();
  const navigate = useNavigate();

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

  const handleItemClick = (notification: Notification) => {
    markAsRead(notification.id);
    if (notification.link) {
      if (notification.link.startsWith('#')) {
        navigate(`/dashboard${notification.link}`);
      } else {
        navigate(notification.link);
      }
    }
  };

  if (loading && notifications.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 bg-white rounded-xl shadow-sm hover:bg-slate-50 transition-colors border border-slate-100"
            >
              <ArrowLeft size={20} className="text-slate-600" />
            </button>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Notifications</h1>
          </div>
          <button 
            onClick={markAllRead}
            className="px-4 py-2 bg-white rounded-xl border border-slate-100 shadow-sm text-sm font-bold text-slate-600 hover:text-brand transition-colors"
          >
            Mark all read
          </button>
        </div>

        <div className="bg-white rounded-[32px] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          {notifications.length === 0 ? (
            <div className="py-24 flex flex-col items-center text-center px-8">
              <div className="w-24 h-24 bg-slate-50 rounded-[32px] flex items-center justify-center mb-6">
                <BellIcon className="text-slate-200" size={48} />
              </div>
              <h2 className="text-2xl font-black text-slate-900 mb-2">Your inbox is empty</h2>
              <p className="text-slate-500 font-medium max-w-xs">We'll notify you here when you have new messages, rent payments, or visit requests.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {notifications.map((n) => {
                const { icon: Icon, color } = getIcon(n.type);
                return (
                  <div 
                    key={n.id}
                    onClick={() => handleItemClick(n)}
                    className={`p-6 flex items-start gap-6 cursor-pointer hover:bg-slate-50/50 transition-all group ${!n.read ? 'bg-brand/5' : ''}`}
                  >
                    <div className={`shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${color}`}>
                      <Icon size={24} />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start gap-4 mb-1">
                        <h3 className={`text-lg leading-tight ${!n.read ? 'font-black text-slate-900' : 'font-bold text-slate-600'}`}>
                          {n.title}
                        </h3>
                        {!n.read && (
                          <div className="w-3 h-3 bg-blue-500 rounded-full shadow-lg shadow-blue-500/20 shrink-0 mt-1.5" />
                        )}
                      </div>
                      <p className="text-slate-500 font-medium mb-3">
                        {n.body}
                      </p>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-md">
                          {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                        </span>
                        {n.read && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 uppercase tracking-tighter">
                            <CheckCircle2 size={12} /> Read
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

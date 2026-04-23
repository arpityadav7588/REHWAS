import React from 'react';
import { Share2, Rocket, Lock, IndianRupee } from 'lucide-react';
import type { Room } from '@/types';
import { calculateVacancyBleed } from '@/lib/vacancyBleed';
import { useSubscription } from '@/hooks/useSubscription';

interface VacancyBleedCardProps {
  room: Room;
  onBoostClick: () => void;
}

/**
 * VacancyBleedCard Component
 * 
 * WHAT IT DOES: Displays a high-impact visualization of revenue loss for a vacant room.
 * 
 * WHY WE SHOW ₹ LOSS: "21 days" feels abstract, "₹14,700 lost" is visceral and real.
 * This component uses urgency levels (low, medium, high, critical) to drive landlord action.
 * 
 * ANALOGY: Like a hotel tracking "unsold room nights" — each empty night is revenue 
 * that can never be recovered.
 */
export const VacancyBleedCard: React.FC<VacancyBleedCardProps> = ({ room, onBoostClick }) => {
  const bleed = calculateVacancyBleed(room);
  const { hasPlan } = useSubscription();
  const isStarter = !hasPlan('pro') && !hasPlan('business');

  if (!bleed) return null;

  const { daysVacant, dailyLoss, totalLoss, urgencyLevel, urgencyLabel } = bleed;

  const getUrgencyStyles = () => {
    switch (urgencyLevel) {
      case 'low':
        return 'border-amber-400 bg-amber-50/30';
      case 'medium':
      case 'high':
        return 'border-red-500 bg-red-50/30';
      case 'critical':
        return 'border-red-600 bg-red-50/50 shadow-[0_0_20px_rgba(239,68,68,0.2)] animate-[pulse-red_2s_infinite]';
      default:
        return 'border-gray-200';
    }
  };

  const getBadgeStyles = () => {
    return urgencyLevel === 'low' 
      ? 'bg-amber-100 text-amber-700 border-amber-200' 
      : 'bg-red-100 text-red-700 border-red-200';
  };

  const shareOnWhatsApp = () => {
    const text = `Flat available\n${room.title} in ${room.locality}\n₹${room.rent_amount}/mo | ${room.room_type}\nContact via REHWAS 🏠`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className={`relative flex flex-col w-full rounded-3xl border-l-[8px] p-6 shadow-sm transition-all hover:shadow-md ${getUrgencyStyles()}`}>
      <style>{`
        @keyframes pulse-red {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
          50% { box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
        }
      `}</style>

      {/* ROW 1 — Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full bg-red-500 ${urgencyLevel === 'critical' ? 'animate-pulse' : ''}`} />
          <span className="text-xs font-black uppercase tracking-widest text-red-600">Vacancy Alert</span>
        </div>
        <div className={`px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider ${getBadgeStyles()}`}>
          {daysVacant} days empty
        </div>
      </div>

      {/* ROW 2 — Loss display */}
      <div className="mb-1">
        <h3 className="text-[32px] font-black text-rose-900 leading-tight">
          ₹{totalLoss.toLocaleString('en-IN')}
        </h3>
        <p className="text-gray-500 text-xs font-medium">estimated revenue lost</p>
      </div>

      {/* ROW 3 — Breakdown */}
      <div className="mb-6">
        <p className="text-gray-400 text-[13px] font-medium">
          ₹{dailyLoss}/day × {daysVacant} days
        </p>
      </div>

      {/* ROW 4 — Room info strip */}
      <div className="mb-6 py-3 px-4 bg-white/60 rounded-2xl border border-white/40 flex items-center gap-2 text-xs text-gray-600 overflow-hidden">
        <span className="font-bold truncate">{room.title}</span>
        <span className="text-gray-300">|</span>
        <span className="font-bold whitespace-nowrap">{room.room_type}</span>
        <span className="text-gray-300">|</span>
        <span className="font-bold whitespace-nowrap">₹{room.rent_amount}/mo expected</span>
      </div>

      {/* ROW 5 — Action buttons */}
      <div className="grid grid-cols-2 gap-3 mt-auto">
        <button
          onClick={shareOnWhatsApp}
          className="flex items-center justify-center gap-2 py-3.5 rounded-xl border-2 border-emerald-500 text-emerald-600 font-black text-[10px] uppercase tracking-widest hover:bg-emerald-50 transition-all active:scale-95"
        >
          <Share2 size={14} /> WhatsApp
        </button>
        <button
          onClick={onBoostClick}
          className="flex items-center justify-center gap-2 py-3.5 rounded-xl bg-amber-400 text-amber-950 font-black text-[10px] uppercase tracking-widest shadow-lg shadow-amber-200 hover:bg-amber-500 transition-all active:scale-95"
        >
          {isStarter && <Lock size={12} />}
          Boost Listing <span className="ml-1">⚡</span>
        </button>
      </div>
    </div>
  );
};

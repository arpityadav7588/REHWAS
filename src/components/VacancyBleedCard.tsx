import React from 'react';
import { AlertCircle, IndianRupee, Share2, Rocket, TrendingDown, Clock, MapPin } from 'lucide-react';
import type { Room } from '@/types';

interface VacancyBleedCardProps {
  room: Room;
  onBoost?: () => void;
}

/**
 * VacancyBleedCard Component
 * 
 * WHAT IT DOES: 
 * Visualizes the "invisible" financial loss of an empty room. It calculates 
 * the total revenue lost since the room became vacant and presents it as 
 * a "bleeding" cost to create urgency for the landlord.
 * 
 * 1. DAILY LOSS CALCULATION:
 *    Analogy: Like tracking how much petrol leaks from a tank with a hole. 
 *    Drip by drip, it adds up to a significant amount. By showing the ₹ value 
 *    instead of just "days", we trigger the psychological principle of Loss Aversion.
 * 
 * 2. PSYCHOLOGY:
 *    Landlords often think "it's just been a few weeks", but seeing "₹14,500 Lost" 
 *    is visceral. Money lost is more emotionally painful than time passed.
 */
export const VacancyBleedCard: React.FC<VacancyBleedCardProps> = ({ room, onBoost }) => {
  // Use today if vacant_since is missing
  const startDate = room.vacant_since ? new Date(room.vacant_since) : new Date();
  const daysVacant = Math.max(1, Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
  
  const monthlyLoss = room.expected_rent || room.rent_amount;
  const dailyLoss = Math.round(monthlyLoss / 30);
  const totalLoss = daysVacant * dailyLoss;

  // Determine Urgency Tier
  let tierStyle = "border-amber-500 text-amber-600 bg-amber-50/30";
  let tierLabel = "Getting expensive";
  let pulseClass = "";

  if (daysVacant > 30) {
    tierStyle = "border-rose-700 text-rose-700 bg-rose-50/50";
    tierLabel = "Critical vacancy";
    pulseClass = "animate-pulse";
  } else if (daysVacant > 7) {
    tierStyle = "border-red-600 text-red-600 bg-red-50/30";
    tierLabel = "Significant loss";
  }

  const shareOnWhatsApp = () => {
    const text = `Flat available in ${room.locality}\n${room.room_type} for ₹${room.rent_amount}/mo\nContact via REHWAS 🏠`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className={`relative overflow-hidden bg-white rounded-[2rem] border-l-[6px] shadow-xl shadow-slate-200/50 transition-all hover:scale-[1.01] ${tierStyle} ${pulseClass}`}>
      <div className="p-6 md:p-8">
        {/* Top Row: Warning & Days */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <AlertCircle size={20} />
            <span className="font-black text-[10px] uppercase tracking-[0.2em]">{tierLabel}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-white/50 rounded-full border border-current/10">
            <Clock size={14} />
            <span className="font-black text-xs">{daysVacant} days empty</span>
          </div>
        </div>

        {/* Loss Display */}
        <div className="mb-6">
          <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Estimated Revenue Lost</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-5xl font-black tracking-tighter">₹{totalLoss.toLocaleString('en-IN')}</h3>
            <TrendingDown size={24} className="opacity-40" />
          </div>
        </div>

        {/* Breakdown Row */}
        <div className="py-3 px-4 bg-black/5 rounded-2xl mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[10px] font-bold opacity-60">
            <IndianRupee size={12} />
            <span>{dailyLoss}/day × {daysVacant} days</span>
          </div>
          <div className="h-1 w-8 bg-current/20 rounded-full"></div>
          <span className="font-black text-xs">₹{totalLoss}</span>
        </div>

        {/* Room Details */}
        <div className="mb-8 border-t border-current/10 pt-6">
          <h4 className="text-slate-900 font-black text-lg leading-none mb-2">{room.title}</h4>
          <div className="flex items-center gap-3 text-slate-500 text-[10px] font-black uppercase tracking-widest">
            <span className="flex items-center gap-1"><MapPin size={12} /> {room.locality}</span>
            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
            <span>Exp. Rent: ₹{monthlyLoss.toLocaleString()}</span>
          </div>
        </div>

        {/* Action Row */}
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={shareOnWhatsApp}
            className="flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-emerald-500 text-emerald-600 font-black text-[10px] uppercase tracking-widest hover:bg-emerald-50 transition-all active:scale-95"
          >
            <Share2 size={16} /> Share on WhatsApp
          </button>
          
          {room.boosted_until && new Date(room.boosted_until) > new Date() ? (
            <div className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-amber-100 text-amber-700 font-black text-[10px] uppercase tracking-widest border border-amber-200">
              <Zap size={16} className="fill-amber-500 text-amber-500" />
              Boosted · {Math.ceil((new Date(room.boosted_until).getTime() - Date.now()) / (1000 * 60 * 60 * 24))}d left
            </div>
          ) : (
            <button 
              onClick={onBoost}
              className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-emerald-600 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-95"
            >
              <Rocket size={16} /> Boost Listing (₹199)
            </button>
          )}
        </div>
      </div>
      
      {/* Decorative pulse ring for critical tier */}
      {daysVacant > 30 && (
        <div className="absolute inset-0 border-4 border-rose-700/20 rounded-[2rem] animate-ping pointer-events-none"></div>
      )}
    </div>
  );
};

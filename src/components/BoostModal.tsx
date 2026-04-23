import React, { useState } from 'react';
import { X, Zap, Rocket, CheckCircle2, TrendingUp, Info } from 'lucide-react';
import { useMicroTransactions } from '@/hooks/useMicroTransactions';

interface BoostModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: {
    id: string;
    title: string;
    locality: string;
  };
}

/**
 * BoostModal Component
 * 
 * WHAT IT DOES: Provides the UI for the "Boost Listing" micro-transaction.
 * Landlords can pay ₹199 to put their listing at the top of search results.
 * 
 * Analogy: Like paying for a "Featured" slot on a bulletin board or a "Promoted" post on social media.
 * You get higher visibility, which leads to faster results.
 */
export const BoostModal: React.FC<BoostModalProps> = ({ isOpen, onClose, room }) => {
  const { initiateBoost, loading } = useMicroTransactions();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300" 
        onClick={onClose}
      ></div>
      
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl relative z-10 animate-in zoom-in-95 duration-300 flex flex-col border border-emerald-100">
        {/* Header */}
        <div className="relative p-8 text-center bg-gradient-to-br from-emerald-600 to-teal-700 text-white">
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors border border-white/10"
          >
            <X size={20} />
          </button>
          
          <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-white/20 backdrop-blur-sm">
            <Rocket size={40} className="text-emerald-50 animate-bounce" />
          </div>
          
          <h2 className="text-3xl font-black tracking-tight mb-2">Boost Listing</h2>
          <p className="text-emerald-50/80 font-medium text-sm">₹199 · 7 Days Premium Visibility</p>
        </div>

        <div className="p-8">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-6 flex items-center gap-4">
             <div className="w-12 h-12 bg-white rounded-xl border border-slate-200 flex items-center justify-center font-black text-emerald-600 text-lg">
                ⚡
             </div>
             <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Target Listing</p>
                <h4 className="font-bold text-slate-900 line-clamp-1">{room.title}</h4>
                <p className="text-xs text-slate-500">{room.locality}</p>
             </div>
          </div>

          <div className="space-y-4 mb-8">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2">
              <Info size={14} className="text-emerald-600" /> What you get:
            </h3>
            
            <ul className="space-y-3">
              {[
                "Top position on map and list search results",
                "Eye-catching 'Featured' badge on your listing",
                "3x more tenant inquiries on average",
                "Valid for 7 days from time of payment"
              ].map((benefit, i) => (
                <li key={i} className="flex items-start gap-3 text-sm font-medium text-slate-600">
                  <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                  {benefit}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-emerald-50 p-5 rounded-3xl border border-emerald-100 mb-8 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Total One-time Cost</p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-emerald-950">₹199</span>
                <span className="text-xs font-bold text-emerald-600/60">/ 7 days</span>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-1.5 px-3 py-1 bg-white rounded-full border border-emerald-200 text-[10px] font-black text-emerald-700 uppercase tracking-widest shadow-sm">
                <TrendingUp size={12} /> High Yield
              </div>
            </div>
          </div>

          <button 
            onClick={() => initiateBoost(room.id)}
            disabled={loading}
            className="w-full py-5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl shadow-xl shadow-emerald-200 active:scale-95 transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Preparing Boost..." : <>Boost Now — ₹199 <Rocket size={18} /></>}
          </button>
          
          <p className="text-center text-[10px] font-bold text-slate-400 mt-6 uppercase tracking-widest">
            Secure payment via Razorpay
          </p>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { Shield, Sparkles, Building2, Check, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface RoomLimitGateProps {
  currentCount: number;
  limit: number;
}

export const RoomLimitGate: React.FC<RoomLimitGateProps> = ({ currentCount, limit }) => {
  const navigate = useNavigate();

  const comparison = [
    { plan: 'Starter', limit: '3 Rooms', price: 'Free', current: limit === 3 },
    { plan: 'Pro', limit: '15 Rooms', price: '₹499/mo', current: limit === 15 },
    { plan: 'Business', limit: 'Unlimited', price: '₹1,499/mo', current: limit === Infinity }
  ];

  return (
    <div className="bg-slate-50 min-h-[400px] rounded-[3rem] p-8 md:p-12 flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-200">
      <div className="w-20 h-20 bg-rose-100 rounded-3xl flex items-center justify-center text-rose-600 mb-8 shadow-sm">
        <Building2 size={36} />
      </div>

      <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">
        You've reached your {limit}-room limit
      </h2>
      
      <p className="text-slate-500 font-medium max-w-md mb-10 leading-relaxed">
        Your current plan allows for up to {limit} room listings. 
        Upgrade to a higher tier to expand your property portfolio.
      </p>

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl mb-10">
        {comparison.map((c, i) => (
          <div 
            key={i} 
            className={`p-6 rounded-3xl border-2 transition-all ${
              c.current 
              ? 'bg-white border-slate-900 shadow-xl shadow-slate-200 z-10 scale-105' 
              : 'bg-white/50 border-slate-100 opacity-60'
            }`}
          >
            <h4 className="font-black text-slate-900 text-sm uppercase tracking-widest mb-1">{c.plan}</h4>
            <div className="text-xl font-black text-slate-900 mb-2">{c.limit}</div>
            <div className="text-xs font-bold text-slate-400 mb-4">{c.price}</div>
            {c.current && (
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Your Current Plan</div>
            )}
            {!c.current && (
              <div className="flex items-center justify-center text-emerald-500">
                <Check size={16} />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <button 
          onClick={() => navigate('/pricing')}
          className="bg-indigo-600 text-white px-10 py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-2"
        >
          Upgrade for ₹499/mo <ArrowRight size={18} />
        </button>
        <div className="flex items-center gap-2 text-indigo-600 bg-indigo-50 px-4 py-2 rounded-full">
          <Sparkles size={14} />
          <span className="text-[10px] font-black uppercase tracking-widest">14-Day Free Trial</span>
        </div>
      </div>
    </div>
  );
};

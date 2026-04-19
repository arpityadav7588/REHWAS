import React, { useState } from 'react';
import { ShieldCheck, ArrowRight, Loader2, Fingerprint } from 'lucide-react';
import { useKYC } from '@/hooks/useKYC';

/**
 * VerificationCenter Component.
 * WHAT IT DOES: Renders a high-fidelity verification prompt with an Aadhaar OTP simulation.
 * ANALOGY: A VIP check-in counter at a premium hotel.
 */
export const VerificationCenter: React.FC = () => {
  const { isVerifying, startVerification, kycStatus } = useKYC();
  const [aadhaarInput, setAadhaarInput] = useState('');
  const [showInput, setShowInput] = useState(false);

  if (kycStatus === 'verified') {
    return (
      <div className="bg-emerald-50/50 border border-emerald-100 p-6 rounded-[2rem] flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-100">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h3 className="text-emerald-900 font-extrabold text-lg leading-tight">Identity Fully Verified</h3>
            <p className="text-emerald-600/70 text-sm font-bold">You have 100% trust score on the platform.</p>
          </div>
        </div>
        <div className="bg-emerald-600 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">
          Verified Resident
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden bg-slate-900 rounded-[2.5rem] p-8 mb-8 text-white shadow-2xl shadow-slate-200">
      {/* Decorative Blur */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
      
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="max-w-md">
          <div className="flex items-center gap-3 mb-4">
             <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-xl shadow-emerald-500/20">
                <Fingerprint size={24} />
             </div>
             <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">Compliance Era</span>
          </div>
          <h2 className="text-3xl font-black tracking-tighter mb-2 italic">Get Your Verified Badge 🛡️</h2>
          <p className="text-slate-400 text-sm font-medium leading-relaxed">
            Boost your trust score by 40%. Verified profiles get 3x higher visibility and instant move-in permissions.
          </p>
        </div>

        <div className="flex flex-col gap-4 w-full md:w-auto min-w-[300px]">
           {!showInput ? (
             <button 
               onClick={() => setShowInput(true)}
               className="group flex items-center justify-center gap-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 px-8 rounded-2xl transition-all shadow-xl shadow-emerald-900/40 active:scale-95"
             >
               Start Aadhaar KYC <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
             </button>
           ) : (
             <div className="bg-white/5 backdrop-blur-md p-2 rounded-3xl border border-white/10 flex items-center gap-2">
               <input 
                 type="text" 
                 maxLength={4}
                 placeholder="Last 4 Digits of Aadhaar"
                 value={aadhaarInput}
                 onChange={(e) => setAadhaarInput(e.target.value.replace(/\D/g, ''))}
                 className="flex-1 bg-transparent border-none focus:ring-0 text-white font-black text-lg p-3 placeholder:text-slate-600"
               />
               <button 
                 disabled={isVerifying || aadhaarInput.length < 4}
                 onClick={() => startVerification(aadhaarInput)}
                 className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${aadhaarInput.length === 4 ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 active:scale-95' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
               >
                 {isVerifying ? <Loader2 size={16} className="animate-spin" /> : 'Verify'}
               </button>
             </div>
           )}
           <p className="text-[10px] text-slate-500 font-bold text-center uppercase tracking-widest">Secure 256-bit Encrypted Link</p>
        </div>
      </div>
    </div>
  );
};

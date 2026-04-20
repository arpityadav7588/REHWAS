import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLedger } from '@/hooks/useLedger';
import { DigitalCertificate } from '@/components/DigitalCertificate';
import { VerificationCenter } from '@/components/VerificationCenter';
import { Shield, Phone, LogOut, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { RentLedger } from '@/types';

/**
 * Profile Page Component.
 * WHAT IT DOES: Shows user details, KYC verification center, and the downloadable Rental Passport.
 * ANALOGY: A global traveler's personal portal where they manage their identity and credentials.
 */
export default function Profile() {
  const { profile, signOut, loading: authLoading } = useAuth();
  const { fetchLedger } = useLedger();
  const [history, setHistory] = useState<RentLedger[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !profile) {
      navigate('/login');
      return;
    }

    const loadHistory = async () => {
      if (profile) {
        // In a real app, tenants would fetch their own history
        // For demo, we might fetch history across properties
        const { data } = await fetchLedger(profile.id);
        if (data) setHistory(data);
        setLoading(false);
      }
    };

    loadHistory();
  }, [profile, authLoading, navigate, fetchLedger]);

  if (authLoading || loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand"></div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-[#fafafa] pb-32">
       {/* Hero Header */}
       <div className="bg-slate-900 pt-32 pb-48 px-4 text-white">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-8">
             <div className="w-32 h-32 rounded-[2.5rem] bg-emerald-500 flex items-center justify-center text-4xl font-black shadow-2xl shadow-emerald-500/20 ring-4 ring-white/10">
                {profile.full_name?.charAt(0) || 'U'}
             </div>
             <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center gap-4 mb-2">
                   <h1 className="text-4xl font-black tracking-tighter">{profile.full_name}</h1>
                   <div className="bg-emerald-600/20 text-emerald-400 border border-emerald-400/30 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest w-fit mx-auto md:mx-0">
                      {profile.role} account
                   </div>
                </div>
                <div className="flex flex-wrap justify-center md:justify-start gap-6 text-slate-400 font-bold text-sm">
                   <div className="flex items-center gap-2">
                      <Phone size={16} /> {profile.phone}
                   </div>
                   <div className="flex items-center gap-2">
                      <Shield size={16} className={profile.kyc_status === 'verified' ? 'text-emerald-500' : 'text-slate-500'} /> 
                      {profile.kyc_status === 'verified' ? 'Identity Verified' : 'Unverified Profile'}
                   </div>
                </div>
             </div>
             <button 
               onClick={signOut}
               className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors font-black text-xs uppercase tracking-widest"
             >
               <LogOut size={16} /> Sign Out
             </button>
          </div>
       </div>

       <div className="max-w-4xl mx-auto px-4 -mt-32">
          {/* KYC Section */}
          <VerificationCenter />

          {/* Rental Passport Section (Bhoomi 2.0) */}
          <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-xl shadow-slate-200/50 mb-12">
             <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 mb-12">
                <div>
                  <div className="flex items-center gap-2 text-emerald-600 mb-2">
                     <Award size={24} />
                     <span className="text-xs font-black uppercase tracking-[0.2em]">Asset Index 2.0</span>
                  </div>
                  <h2 className="text-3xl font-black tracking-tight mb-2 italic">Your Rental Passport 🎫</h2>
                  <p className="text-slate-500 font-medium max-w-md">
                     This is your verifiable credit asset. Landlords use this to bypass security deposits and instant-verify your occupancy.
                  </p>
                </div>
                
                <div className="flex flex-col items-center p-6 bg-slate-50 rounded-[2rem] border border-slate-100 min-w-[160px]">
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Bhoomi Score</span>
                   <span className="text-5xl font-black text-slate-900 tracking-tighter">{profile.bhoomi_score || 745}</span>
                   <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mt-2">Top 5% Tenant</span>
                </div>
             </div>

             {/* Certificate Rendering */}
             <div className="bg-slate-50 p-8 rounded-[2.5rem] border-2 border-dashed border-slate-200 overflow-x-auto">
                <DigitalCertificate profile={profile} history={history} />
             </div>
          </div>
       </div>
    </div>
  );
}

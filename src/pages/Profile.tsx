import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLedger } from '@/hooks/useLedger';
import { supabase } from '@/lib/supabase';
import { DigitalCertificate } from '@/components/DigitalCertificate';
import { VerificationCenter } from '@/components/VerificationCenter';
import { Shield, Phone, LogOut, Award, FileText, ArrowRight } from 'lucide-react';
import { TenantRentScore } from '@/components/TenantRentScore';
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
  const [pendingReports, setPendingReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !profile) {
      navigate('/login');
      return;
    }

    const loadHistory = async () => {
      if (profile) {
        // Fetch this user's ledger history (used for DigitalCertificate)
        const { data } = await fetchLedger(profile.id);
        if (data) setHistory(data);
        
        // Fetch pending move-in reports for tenant signature
        try {
          const tenantRow = await supabase
            .from('tenants')
            .select('id')
            .eq('tenant_profile_id', profile.id)
            .single();

          if (tenantRow.data?.id) {
            const { data: reports } = await supabase
              .from('move_in_reports')
              .select('id, rooms(title)')
              .eq('report_status', 'pending_tenant')
              .eq('tenant_id', tenantRow.data.id);
            if (reports) setPendingReports(reports);
          }
        } catch {
          // Not a tenant on any property — ignore silently
        }

        setLoading(false);
      } else if (!authLoading) {
        // No profile and auth is done — stop spinner
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

        <div className="max-w-4xl mx-auto px-4 -mt-32 space-y-8">
           {/* Notifications */}
           {pendingReports.map(report => (
             <div key={report.id} className="bg-indigo-600 p-6 rounded-[2.5rem] text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl shadow-indigo-200 animate-in slide-in-from-top-4 duration-500">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                      <FileText size={24} />
                   </div>
                   <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200">Pending Action Required</p>
                      <h3 className="text-lg font-black tracking-tight">Move-in Inspection Report for {report.rooms?.title}</h3>
                   </div>
                </div>
                <button 
                  onClick={() => navigate(`/move-in-report/${report.id}`)}
                  className="bg-white text-indigo-600 px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-indigo-50 active:scale-95 transition-all"
                >
                  Review & Sign 📋
                </button>
             </div>
           ))}

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
                {/* Score Summary Moved into TenantRentScore full view */}
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start mb-12">
                <TenantRentScore tenantId={profile.id} />
                
                <div className="flex flex-col gap-6">
                   <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-[2.5rem]">
                      <h3 className="text-xl font-black text-emerald-900 mb-2">Score Pulse 📈</h3>
                      <p className="text-emerald-800/70 font-medium text-sm mb-4">
                         Your rent score is a dynamic asset. Paying rent before the 7th of every month helps you build a premium reputation.
                      </p>
                      <button 
                        onClick={() => navigate('/discover')}
                        className="flex items-center gap-2 text-emerald-600 font-black text-xs uppercase tracking-widest hover:gap-4 transition-all"
                      >
                        Pay rent on time to improve your score <ArrowRight size={16} />
                      </button>
                   </div>
                   
                   <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-[2.5rem]">
                      <h3 className="text-xl font-black text-indigo-900 mb-2">Instant Approval ⚡</h3>
                      <p className="text-indigo-800/70 font-medium text-sm">
                         Tenants with an A+ score are 3x more likely to get their visit requests accepted by premium landlords.
                      </p>
                   </div>
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

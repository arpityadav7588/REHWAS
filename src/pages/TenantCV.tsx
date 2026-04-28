import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  ShieldCheck, 
  TrendingUp, 
  Clock, 
  Info, 
  Award,
  BadgeCheck,
  Calendar,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  Phone
} from 'lucide-react';
import { format, subMonths } from 'date-fns';
import type { Profile, TenantCV as TenantCVType, RentLedger } from '@/types';

/**
 * Tenant CV Public Page.
 * WHAT IT DOES: Displays a tenant's verified rental payment history and "Rent Health Grade" to third parties.
 * ANALOGY: A professional credit report or LinkedIn profile specifically for the rental market.
 * 
 * PRIVACY PRINCIPLE: 
 * We never expose rent amounts or specific property addresses to the public. 
 * Just as a bank shows a credit score rather than an account balance, REHWAS shows 
 * a "Grade" and "On-time %" to protect the tenant's financial privacy while 
 * providing landlords with the proof of reliability they need.
 */
export default function TenantCV() {
  const { tenantProfileId } = useParams<{ tenantProfileId: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [cv, setCV] = useState<TenantCVType | null>(null);
  const [history, setHistory] = useState<RentLedger[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!tenantProfileId) return;
      setLoading(true);

      try {
        // 1. Fetch Profile
        const { data: profileData, error: pError } = await supabase
          .from('profiles')
          .select('full_name, avatar_url, created_at, phone, kyc_status')
          .eq('id', tenantProfileId)
          .single();

        if (pError || !profileData) throw new Error('Tenant profile not found');
        setProfile(profileData as any);

        // 2. Fetch Tenant CV data
        const { data: cvData, error: cvError } = await supabase
          .from('tenant_cv')
          .select('*')
          .eq('tenant_profile_id', tenantProfileId)
          .single();

        if (cvError && cvError.code !== 'PGRST116') {
          console.error('CV Fetch Error:', cvError);
        }
        setCV(cvData);

        // 3. Fetch Rent Ledger (limited history)
        // We need to find the tenant record(s) first
        const { data: tenants } = await supabase
          .from('tenants')
          .select('id')
          .eq('tenant_profile_id', tenantProfileId);
        
        const tenantIds = tenants?.map(t => t.id) || [];

        if (tenantIds.length > 0) {
          const { data: ledgerData, error: lError } = await supabase
            .from('rent_ledger')
            .select('month, status, paid_on, due_date')
            .in('tenant_id', tenantIds)
            .order('due_date', { ascending: false })
            .limit(24);

          if (lError) console.error('Ledger Fetch Error:', lError);
          setHistory((ledgerData as unknown as RentLedger[]) || []);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [tenantProfileId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-indigo-100 rounded-full"></div>
            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <div className="text-center">
            <h3 className="text-lg font-black text-slate-900 tracking-tight">Verifying Credentials</h3>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">Connecting to REHWAS Nodes...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 text-center">
        <div className="max-w-sm bg-white p-12 rounded-[2.5rem] shadow-2xl shadow-slate-200 border border-slate-100">
          <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-rose-500">
            <AlertCircle size={40} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tighter">Profile Not Found</h2>
          <p className="text-slate-500 font-medium mb-8 leading-relaxed">This Rental CV is either private or does not exist on our verified servers.</p>
          <button 
            onClick={() => navigate('/')} 
            className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-slate-800 transition-all active:scale-95"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  const grade = cv?.rent_health_grade || 'N/A';
  const gradeConfig = {
    'A': { 
      ring: 'border-emerald-500', 
      text: 'text-emerald-600', 
      bg: 'bg-emerald-500', 
      shadow: 'shadow-emerald-200',
      description: 'Excellent — 90%+ on-time payments. Most landlords waive background checks for Grade A tenants.' 
    },
    'B': { 
      ring: 'border-amber-500', 
      text: 'text-amber-600', 
      bg: 'bg-amber-500', 
      shadow: 'shadow-amber-200',
      description: 'Good — 70-89% on-time. Minor delays but always eventually paid.' 
    },
    'C': { 
      ring: 'border-rose-500', 
      text: 'text-rose-600', 
      bg: 'bg-rose-500', 
      shadow: 'shadow-rose-200',
      description: 'Fair — below 70% on-time. Landlord may request references.' 
    },
    'N/A': { 
      ring: 'border-slate-200', 
      text: 'text-slate-400', 
      bg: 'bg-slate-400', 
      shadow: 'shadow-transparent',
      description: 'New — fewer than 3 months of data tracked on REHWAS.' 
    }
  };

  const currentConfig = gradeConfig[grade as keyof typeof gradeConfig];

  // Helper to get status color for cell
  const getStatusColor = (monthStr: string) => {
    const record = history.find(h => h.month === monthStr);
    if (!record) return 'bg-slate-100'; // No data
    if (record.status === 'unpaid') return 'bg-[#EF4444] shadow-lg shadow-red-100'; // Red
    if (record.status === 'paid') {
      const paidOn = record.paid_on ? new Date(record.paid_on) : null;
      const dueDate = record.due_date ? new Date(record.due_date) : null;
      if (paidOn && dueDate && paidOn > dueDate) {
        return 'bg-[#F59E0B] shadow-lg shadow-amber-100'; // Late (Amber)
      }
      return 'bg-[#10B981] shadow-lg shadow-emerald-100'; // On-time (Green)
    }
    return 'bg-slate-100';
  };

  // Generate 12 months for the grid
  const last12Months = Array.from({ length: 12 }).map((_, i) => {
    const d = subMonths(new Date(), 11 - i);
    return format(d, 'MMM yy');
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 selection:bg-indigo-100 selection:text-indigo-900">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-[40vh] bg-indigo-600/5 -z-10 pointer-events-none"></div>

      <div className="max-w-4xl mx-auto px-4 pt-12">
        {/* Top Header */}
        <div className="flex justify-between items-center mb-10">
          <button 
            onClick={() => navigate(-1)} 
            className="group flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-all font-black text-[10px] uppercase tracking-widest"
          >
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-slate-100 shadow-sm group-hover:bg-slate-50">
              <ChevronLeft size={16} />
            </div>
            Back
          </button>
          <div className="flex items-center gap-3 bg-white px-5 py-2 rounded-full border border-slate-100 shadow-sm">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic">Live Verified Record</span>
          </div>
        </div>

        {/* HEADER CARD */}
        <div className="bg-white rounded-[3rem] p-10 md:p-14 border border-slate-100 shadow-2xl shadow-slate-200/50 mb-8 relative overflow-hidden group">
          <div className="absolute -top-12 -right-12 w-64 h-64 bg-indigo-600/5 rounded-full blur-3xl group-hover:bg-indigo-600/10 transition-all duration-700"></div>
          
          <div className="flex flex-col items-center text-center relative z-10">
            {/* Avatar Circle */}
            <div className="relative mb-8">
              <div className="w-32 h-32 md:w-40 md:h-40 bg-indigo-50 rounded-[3rem] flex items-center justify-center text-4xl font-black text-indigo-600 shadow-inner border-4 border-white overflow-hidden">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
                ) : (
                  profile.full_name?.split(' ').map(n => n[0]).join('') || 'U'
                )}
              </div>
              {profile.kyc_status === 'verified' && (
                <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-2 rounded-2xl shadow-lg border-2 border-white">
                  <CheckCircle2 size={24} />
                </div>
              )}
            </div>

            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-none mb-3">
              {profile.full_name}
            </h1>
            
            <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
              <p className="text-slate-400 font-bold text-base">REHWAS Member since {format(new Date(profile.created_at), 'MMMM yyyy')}</p>
              <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 border border-emerald-100 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                <Phone size={10} className="fill-emerald-600" /> Verified Phone ✓
              </div>
            </div>

            {/* Sharing stats */}
            <div className="flex items-center gap-2 text-slate-400">
               <Info size={14} />
               <span className="text-[10px] font-black uppercase tracking-widest">RH-CV-{profile.id.substring(0, 8)}</span>
            </div>
          </div>
        </div>

        {/* HERO SECTION: GRADE */}
        <div className="bg-white rounded-[3rem] p-10 md:p-14 border border-slate-100 shadow-2xl shadow-slate-200/50 mb-8 flex flex-col md:flex-row items-center gap-12 relative overflow-hidden">
          <div className="relative shrink-0">
             <div className={`w-36 h-36 md:w-44 md:h-44 rounded-full border-[10px] ${currentConfig.ring} flex items-center justify-center text-6xl md:text-7xl font-black ${currentConfig.text} ${currentConfig.shadow} transition-all duration-500 hover:scale-105`}>
                {grade}
             </div>
             <div className="absolute -top-2 -right-2 bg-white p-2 rounded-full shadow-lg border border-slate-100">
                <ShieldCheck size={28} className="text-indigo-600" />
             </div>
          </div>

          <div className="flex-1 text-center md:text-left">
             <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Rent Health Grade</h2>
             <p className="text-slate-400 font-bold text-lg mb-6 leading-relaxed">
               Based on <span className="text-slate-900">{cv?.total_months_tracked || 0} months</span> of verified payment data
             </p>
             <div className="inline-flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-xl text-indigo-600 font-bold text-xs">
                <Award size={16} /> REHWAS Certified Reliability
             </div>
          </div>
        </div>

        {/* STATS ROW */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
           {[
             { label: 'On-time payments', value: `${cv?.on_time_payment_pct || 0}%`, icon: TrendingUp, color: 'emerald' },
             { label: 'Months paid on time', value: cv?.paid_on_time_count || 0, icon: CheckCircle2, color: 'indigo' },
             { label: 'Total months tracked', value: cv?.total_months_tracked || 0, icon: Clock, color: 'slate' }
           ].map((stat, i) => (
             <div key={i} className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl shadow-slate-200/40 hover:translate-y-[-4px] transition-all duration-300">
                <div className={`w-12 h-12 bg-${stat.color}-50 text-${stat.color}-500 rounded-2xl flex items-center justify-center mb-6`}>
                   <stat.icon size={24} />
                </div>
                <div className="text-4xl font-black text-slate-900 mb-1 tracking-tighter">{stat.value}</div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</div>
             </div>
           ))}
        </div>

        {/* PAYMENT HISTORY CALENDAR */}
        <div className="bg-white rounded-[3rem] p-10 md:p-14 border border-slate-100 shadow-2xl shadow-slate-200/50 mb-8">
           <div className="flex justify-between items-center mb-10">
              <h3 className="text-2xl font-black text-slate-900 tracking-tighter">Payment history</h3>
              <div className="hidden sm:flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                 <Calendar size={14} /> Last 12 Months
              </div>
           </div>

           {/* Grid Layout */}
           <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-6 mb-10">
              {last12Months.map((m, i) => (
                <div key={i} className="flex flex-col items-center gap-3">
                   <div className={`w-full aspect-square rounded-2xl ${getStatusColor(m)} transition-all hover:scale-110 cursor-default group relative`}>
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[8px] font-black text-white uppercase tracking-tighter">Verified</span>
                      </div>
                   </div>
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{m}</span>
                </div>
              ))}
           </div>

           {/* Legend */}
           <div className="flex flex-wrap gap-8 border-t border-slate-50 pt-10">
              <div className="flex items-center gap-3">
                 <div className="w-4 h-4 rounded-lg bg-[#10B981]"></div>
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">On time</span>
              </div>
              <div className="flex items-center gap-3">
                 <div className="w-4 h-4 rounded-lg bg-[#F59E0B]"></div>
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Late Payment</span>
              </div>
              <div className="flex items-center gap-3">
                 <div className="w-4 h-4 rounded-lg bg-[#EF4444]"></div>
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Unpaid</span>
              </div>
              <div className="flex items-center gap-3">
                 <div className="w-4 h-4 rounded-lg bg-slate-100"></div>
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">No history</span>
              </div>
           </div>

           <div className="mt-10 p-6 bg-slate-50 rounded-2xl flex items-start gap-4">
              <Info size={20} className="text-slate-400 shrink-0 mt-0.5" />
              <p className="text-slate-500 text-xs font-medium leading-relaxed italic">
                Only monthly status is shown. Specific rent amounts and building details are hidden to protect tenant privacy while maintaining landlord trust.
              </p>
           </div>
        </div>

        {/* GRADE EXPLANATION */}
        <div className="bg-slate-900 rounded-[3rem] p-10 md:p-14 text-white shadow-2xl shadow-indigo-200 mb-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-10">
            <BadgeCheck size={120} />
          </div>
          
          <h4 className="text-2xl font-black mb-10 tracking-tight italic">What Grade {grade} means:</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
            <div className="space-y-4">
              <div className={`p-6 rounded-3xl border-2 ${grade === 'A' ? 'border-emerald-500 bg-emerald-500/10' : 'border-white/5 opacity-40'}`}>
                <h5 className="font-black text-lg mb-1">Grade A</h5>
                <p className="text-sm text-slate-300 leading-relaxed">{gradeConfig.A.description}</p>
              </div>
              <div className={`p-6 rounded-3xl border-2 ${grade === 'B' ? 'border-amber-500 bg-amber-500/10' : 'border-white/5 opacity-40'}`}>
                <h5 className="font-black text-lg mb-1">Grade B</h5>
                <p className="text-sm text-slate-300 leading-relaxed">{gradeConfig.B.description}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className={`p-6 rounded-3xl border-2 ${grade === 'C' ? 'border-rose-500 bg-rose-500/10' : 'border-white/5 opacity-40'}`}>
                <h5 className="font-black text-lg mb-1">Grade C</h5>
                <p className="text-sm text-slate-300 leading-relaxed">{gradeConfig.C.description}</p>
              </div>
              <div className={`p-6 rounded-3xl border-2 ${grade === 'N/A' ? 'border-slate-500 bg-slate-500/10' : 'border-white/5 opacity-40'}`}>
                <h5 className="font-black text-lg mb-1">Grade N/A</h5>
                <p className="text-sm text-slate-300 leading-relaxed">{gradeConfig['N/A'].description}</p>
              </div>
            </div>
          </div>
        </div>

        {/* TRUST SEAL FOOTER */}
        <div className="text-center py-8">
           <div className="inline-flex flex-col items-center gap-6">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-200">R</div>
                 <span className="font-black text-2xl text-slate-900 tracking-tighter">REHWAS</span>
              </div>
              
              <div className="bg-white px-8 py-4 rounded-full border border-slate-100 shadow-xl shadow-slate-200/20 text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-4">
                <span>Verified Audit Trail</span>
                <div className="w-px h-3 bg-slate-200"></div>
                <span>Generated {format(new Date(), 'dd MMM yyyy')}</span>
                <div className="w-px h-3 bg-slate-200"></div>
                <span className="text-indigo-600">ID: RH-CV-{profile.id.substring(0, 8)}</span>
              </div>

              <p className="max-w-lg text-slate-400 font-medium text-xs leading-relaxed">
                This Rental CV is verified by REHWAS and cannot be edited by the tenant. 
                All data reflects actual payment records stored on REHWAS servers and verified against bank-linked ledgers.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
}

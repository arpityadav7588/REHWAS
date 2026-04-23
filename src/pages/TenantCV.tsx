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
  XCircle,
  HelpCircle,
  ChevronLeft
} from 'lucide-react';
import { format, subMonths, isSameMonth, parseISO, startOfMonth } from 'date-fns';
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
  const [history, setHistory] = useState<{ month: string; status: string; delay?: number }[]>([]);
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
          .select('full_name, avatar_url, created_at, kyc_status')
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

        if (cvError && cvError.code !== 'PGRST116') { // PGRST116 is "No rows found"
          console.error('CV Fetch Error:', cvError);
        }
        setCV(cvData);

        // 3. Fetch Rent Ledger (limited history)
        // Only fetch month, status, paid_on, due_date
        const { data: ledgerData, error: lError } = await supabase
          .from('rent_ledger')
          .select('month, status, paid_on, due_date, tenants!inner(tenant_profile_id)')
          .eq('tenants.tenant_profile_id', tenantProfileId)
          .order('due_date', { ascending: false })
          .limit(12);

        if (lError) console.error('Ledger Fetch Error:', lError);
        
        if (ledgerData) {
          const processedHistory = ledgerData.map(item => {
            let delay = 0;
            if (item.status === 'paid' && item.paid_on && item.due_date) {
               const paidDate = new Date(item.paid_on);
               const dueDate = new Date(item.due_date);
               if (paidDate > dueDate) {
                 delay = Math.floor((paidDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
               }
            }
            return {
              month: item.month,
              status: item.status,
              delay: delay > 0 ? delay : undefined
            };
          });
          setHistory(processedHistory);
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-black uppercase tracking-widest text-[10px]">Loading Verified Records...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 text-center">
        <div className="max-w-sm">
          <AlertCircle size={48} className="text-rose-500 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-gray-900 mb-2">Profile Not Found</h2>
          <p className="text-gray-500 font-medium mb-6">The Rental CV you are looking for does not exist or has been made private.</p>
          <button onClick={() => navigate('/')} className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100">Back to REHWAS</button>
        </div>
      </div>
    );
  }

  const grade = cv?.rent_health_grade || 'N/A';
  const gradeColors = {
    'A': { border: 'border-emerald-500', text: 'text-emerald-600', bg: 'bg-emerald-50', icon: 'text-emerald-500', shadow: 'shadow-emerald-100' },
    'B': { border: 'border-amber-500', text: 'text-amber-600', bg: 'bg-amber-50', icon: 'text-amber-500', shadow: 'shadow-amber-100' },
    'C': { border: 'border-rose-500', text: 'text-rose-600', bg: 'bg-rose-50', icon: 'text-rose-500', shadow: 'shadow-rose-100' },
    'N/A': { border: 'border-gray-200', text: 'text-gray-400', bg: 'bg-gray-50', icon: 'text-gray-300', shadow: 'shadow-transparent' }
  };

  const currentGradeColors = gradeColors[grade as keyof typeof gradeColors];

  // Last 12 months for the grid
  const months = Array.from({ length: 12 }).map((_, i) => {
    const d = subMonths(new Date(), 11 - i);
    const monthStr = format(d, 'MMM yyyy');
    const record = history.find(h => h.month === monthStr);
    return { date: d, record };
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      <div className="max-w-4xl mx-auto px-4 pt-12">
        {/* Top Navbar / Nav back */}
        <div className="flex justify-between items-center mb-8">
           <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors font-bold text-sm">
              <ChevronLeft size={20} />
              Back
           </button>
           <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-indigo-600" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Verified Rental CV</span>
           </div>
        </div>

        {/* HEADER CARD */}
        <div className="bg-white rounded-[2.5rem] p-8 md:p-12 border border-slate-100 shadow-xl shadow-slate-200/40 mb-8 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-8">
              <BadgeCheck size={48} className="text-indigo-600/10" />
           </div>

           <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
              <div className="w-32 h-32 md:w-40 md:h-40 bg-indigo-50 rounded-[3rem] flex items-center justify-center text-4xl font-black text-indigo-600 shadow-inner border-4 border-white">
                 {profile.avatar_url ? (
                   <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover rounded-[3rem]" />
                 ) : (
                   profile.full_name?.charAt(0) || 'U'
                 )}
              </div>
              
              <div className="flex-1 text-center md:text-left">
                 <div className="flex flex-col md:flex-row md:items-center gap-4 mb-3">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">{profile.full_name}</h1>
                    {profile.kyc_status === 'verified' && (
                       <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 border border-emerald-100 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest w-fit mx-auto md:mx-0">
                          <CheckCircle2 size={12} /> Verified Identity
                       </div>
                    )}
                 </div>
                 <p className="text-slate-400 font-bold text-lg mb-6">REHWAS Member since {format(new Date(profile.created_at), 'MMM yyyy')}</p>
                 
                 <div className="flex flex-wrap justify-center md:justify-start gap-4">
                    <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl text-slate-500 font-bold text-xs">
                       <Clock size={16} /> Verified History: {cv?.total_months_tracked || 0} Months
                    </div>
                    <div className="flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-xl text-indigo-600 font-bold text-xs">
                       <TrendingUp size={16} /> Payment Reliability: {cv?.on_time_payment_pct || 0}%
                    </div>
                 </div>
              </div>
           </div>
        </div>

        {/* GRADE DISPLAY */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
           <div className="md:col-span-1 bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-xl shadow-slate-200/40 flex flex-col items-center justify-center text-center">
              <div className={`w-32 h-32 rounded-full border-[12px] ${currentGradeColors.border} flex items-center justify-center text-6xl font-black ${currentGradeColors.text} ${currentGradeColors.shadow} mb-6 animate-in zoom-in-95 duration-500`}>
                 {grade}
              </div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Rent Health Grade</h3>
              <p className="text-slate-400 font-bold text-xs mt-2 uppercase tracking-widest">Verified Reputation</p>
           </div>

           <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-lg shadow-slate-200/40 flex flex-col justify-between">
                 <div className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center mb-4">
                    <TrendingUp size={20} />
                 </div>
                 <div>
                    <div className="text-3xl font-black text-slate-900 mb-1">{cv?.on_time_payment_pct || 0}%</div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">On-time payments</div>
                 </div>
              </div>

              <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-lg shadow-slate-200/40 flex flex-col justify-between">
                 <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-4">
                    <Calendar size={20} />
                 </div>
                 <div>
                    <div className="text-3xl font-black text-slate-900 mb-1">{cv?.paid_on_time_count || 0}</div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Months paid on time</div>
                 </div>
              </div>

              <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-lg shadow-slate-200/40 flex flex-col justify-between">
                 <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center mb-4">
                    <ShieldCheck size={20} />
                 </div>
                 <div>
                    <div className="text-3xl font-black text-slate-900 mb-1">{cv?.total_months_tracked || 0}</div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Months tracked</div>
                 </div>
              </div>
           </div>
        </div>

        {/* PAYMENT HISTORY TIMELINE */}
        <div className="bg-white rounded-[2.5rem] p-8 md:p-12 border border-slate-100 shadow-xl shadow-slate-200/40 mb-8">
           <div className="flex justify-between items-center mb-10">
              <h3 className="text-2xl font-black text-slate-900 tracking-tighter">Payment history</h3>
              <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                 <Info size={14} /> Last 12 Months
              </div>
           </div>

           {/* Calendar Grid */}
           <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-12 gap-4 mb-8">
              {months.map(({ date, record }, i) => {
                 let colorClass = 'bg-slate-100';
                 let icon = null;

                 if (record) {
                    if (record.status === 'paid') {
                       if (record.delay) {
                          colorClass = 'bg-amber-500 shadow-lg shadow-amber-200';
                          icon = <span className="text-[8px] font-black text-white">{record.delay}d</span>;
                       } else {
                          colorClass = 'bg-emerald-500 shadow-lg shadow-emerald-200';
                       }
                    } else if (record.status === 'unpaid') {
                       colorClass = 'bg-rose-500 shadow-lg shadow-rose-200';
                    }
                 }

                 return (
                    <div key={i} className="flex flex-col items-center gap-3">
                       <div className={`w-full aspect-square rounded-xl flex items-center justify-center transition-all hover:scale-110 cursor-help group relative ${colorClass}`}>
                          {icon}
                          {/* Tooltip */}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-[8px] font-black rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none">
                             {format(date, 'MMMM yyyy')}: {record ? (record.status === 'paid' ? (record.delay ? `Paid late (${record.delay}d)` : 'Paid on time') : 'Unpaid') : 'No Data'}
                          </div>
                       </div>
                       <span className="text-[10px] font-black text-slate-400 uppercase">{format(date, 'MMM')}</span>
                    </div>
                 );
              })}
           </div>

           {/* Legend */}
           <div className="flex flex-wrap gap-6 border-t border-slate-50 pt-8">
              <div className="flex items-center gap-2">
                 <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">On time</span>
              </div>
              <div className="flex items-center gap-2">
                 <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Late Payment</span>
              </div>
              <div className="flex items-center gap-2">
                 <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Unpaid</span>
              </div>
              <div className="flex items-center gap-2">
                 <div className="w-3 h-3 rounded-full bg-slate-200"></div>
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">No data</span>
              </div>
           </div>
        </div>

        {/* GRADE EXPLANATION */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
           <div className="bg-indigo-600 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-indigo-200">
              <h4 className="text-xl font-black mb-4 tracking-tight italic">What does Grade {grade} mean?</h4>
              <p className="text-indigo-100 font-medium leading-relaxed mb-6">
                 {grade === 'A' && "Excellent — This tenant has paid on time 90%+ of the time. Landlords consider this equivalent to a credit score above 750."}
                 {grade === 'B' && "Good — This tenant has paid on time 70–89% of the time. There may have been minor delays, but records show they are consistent payers."}
                 {grade === 'C' && "Fair — Paid on time less than 70% of the time. We recommend landlords request additional references or a slightly higher security deposit."}
                 {grade === 'N/A' && "Not enough data — This tenant has fewer than 3 months of verified history on REHWAS. Reputation building is in progress."}
              </p>
              <div className="flex items-center gap-2 text-indigo-300">
                 <Info size={16} />
                 <span className="text-[10px] font-black uppercase tracking-widest italic">Calculated using actual banking & ledger data</span>
              </div>
           </div>

           <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-xl shadow-slate-200/40">
              <h4 className="text-xl font-black text-slate-900 mb-4 tracking-tight">Landlord Verification</h4>
              <ul className="space-y-4">
                 <li className="flex items-start gap-3">
                    <div className="mt-1 w-5 h-5 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center shrink-0">
                       <CheckCircle2 size={12} />
                    </div>
                    <p className="text-slate-500 text-sm font-medium">Verified by REHWAS Platform audits</p>
                 </li>
                 <li className="flex items-start gap-3">
                    <div className="mt-1 w-5 h-5 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center shrink-0">
                       <CheckCircle2 size={12} />
                    </div>
                    <p className="text-slate-500 text-sm font-medium">History cannot be edited by the tenant</p>
                 </li>
                 <li className="flex items-start gap-3">
                    <div className="mt-1 w-5 h-5 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center shrink-0">
                       <CheckCircle2 size={12} />
                    </div>
                    <p className="text-slate-500 text-sm font-medium">Reflects real payments to multiple landlords</p>
                 </li>
              </ul>
              
              <div className="mt-10 pt-8 border-t border-slate-50 flex items-center justify-between">
                 <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Share this Profile</span>
                    <span className="text-xs font-black text-indigo-600">rehwas.in/cv/{profile.full_name?.split(' ')[0]}</span>
                 </div>
                 <button onClick={() => window.print()} className="bg-slate-900 text-white p-3 rounded-xl hover:bg-slate-800 transition-colors">
                    <ExternalLink size={18} />
                 </button>
              </div>
           </div>
        </div>

        {/* TRUST SEAL */}
        <div className="text-center">
           <div className="inline-flex items-center gap-4 bg-white px-8 py-4 rounded-full border border-slate-100 shadow-lg shadow-slate-200/20">
              <div className="flex items-center gap-2">
                 <div className="w-6 h-6 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-black text-[10px]">R</div>
                 <span className="font-black text-slate-900 tracking-tighter">REHWAS Verified</span>
              </div>
              <div className="w-px h-4 bg-slate-200"></div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Generated {format(new Date(), 'dd MMM yyyy')}</span>
           </div>
           <p className="mt-6 text-slate-400 font-medium text-xs max-w-sm mx-auto">
              REHWAS is a neutral third-party platform. Payment data is pulled directly from digital transaction records and landlord-verified ledgers.
           </p>
        </div>
      </div>
    </div>
  );
}

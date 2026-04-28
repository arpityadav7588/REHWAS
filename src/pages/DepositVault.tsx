import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { 
  Lock, ShieldCheck, Check, Clock, AlertTriangle, ArrowRight, 
  ExternalLink, FileText, ChevronRight, Download
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';
import { useDepositVault } from '@/hooks/useDepositVault';

/**
 * DepositVault Page
 * 
 * WHAT IT IS: A transparency dashboard for security deposits.
 * PHILOSOPHY: Deposits shouldn't be "gone" money—they are "held" money.
 * This dashboard gives both landlords and tenants visual proof that funds 
 * are secured by REHWAS and governed by mutual reports.
 */

interface EscrowRecord {
  id: string;
  amount: number;
  status: 'pending' | 'held' | 'released' | 'disputed' | 'refunded';
  created_at: string;
  released_at?: string;
  rooms: {
    title: string;
    locality: string;
    city: string;
  };
  landlord: {
    full_name: string;
  };
  tenant_details: {
    tenant_profile: {
      full_name: string;
    };
  };
  move_in_verified?: boolean;
}

export default function DepositVault() {
  const { profile } = useAuth();
  const [escrows, setEscrows] = useState<EscrowRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { releaseDeposit, disputeDeposit, loading: processing } = useDepositVault();

  useEffect(() => {
    loadEscrows();
  }, [profile]);

  const loadEscrows = async () => {
    if (!profile) return;
    setLoading(true);

    let query = supabase
      .from('deposit_escrow')
      .select(`
        *,
        rooms(title, locality, city),
        landlord:landlord_id(full_name),
        tenant_details:tenant_id(
          tenant_profile:tenant_profile_id(full_name)
        )
      `)
      .order('created_at', { ascending: false });

    if (profile.role === 'landlord') {
      query = query.eq('landlord_id', profile.id);
    } else {
      // For tenants, we need to join through the tenants table
      // Note: The RLS policy handles the restriction, we just need to match the user's tenant records
      // In a real scenario, we'd fetch the tenant_id first or use a complex join
      const { data: tenantRecords } = await supabase
        .from('tenants')
        .select('id')
        .eq('tenant_profile_id', profile.id);
      
      if (tenantRecords && tenantRecords.length > 0) {
        query = query.in('tenant_id', tenantRecords.map(t => t.id));
      } else {
        setEscrows([]);
        setLoading(false);
        return;
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error loading escrows:', error);
      toast.error('Failed to load deposit data');
    } else {
      // Fetch move-in report status for each escrow
      const escrowsWithStatus = await Promise.all((data as any[]).map(async (escrow) => {
        const { data: report } = await supabase
          .from('move_in_reports')
          .select('report_status')
          .eq('room_id', escrow.room_id)
          .eq('tenant_id', escrow.tenant_id)
          .eq('type', 'move_in')
          .eq('report_status', 'completed')
          .maybeSingle();
        
        return {
          ...escrow,
          move_in_verified: !!report
        };
      }));
      setEscrows(escrowsWithStatus as unknown as EscrowRecord[]);
    }
    setLoading(false);
  };

  const handleRelease = async (id: string) => {
    try {
      await releaseDeposit(id);
      await loadEscrows();
    } catch (err) {
      // Error handled in hook
    }
  };

  const handleDispute = async (id: string) => {
    const reason = window.prompt("Please state the reason for this dispute (e.g. Property doesn't match photos):");
    if (!reason) return;

    try {
      await disputeDeposit(id, reason);
      await loadEscrows();
    } catch (err) {
      // Error handled in hook
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  const activeEscrows = escrows.filter(e => e.status === 'held');
  const pastEscrows = escrows.filter(e => e.status !== 'held');

  return (
    <div className="min-h-screen bg-slate-50/50 pb-32">
      {/* Header Section */}
      <section className="bg-white border-b border-slate-100 pt-24 pb-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-full border border-indigo-100">
              <Lock size={14} strokeWidth={3} />
              <span className="text-[10px] font-black uppercase tracking-widest">REHWAS Secure Escrow</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">Deposit Vault</h1>
            <p className="text-slate-500 font-medium max-w-xl">
              Verified security deposits held in a neutral vault. Protected by Razorpay and governed by mutual move-in reports.
            </p>
          </div>
          
          <div className="flex gap-4">
            <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-[2rem] flex flex-col justify-center min-w-[200px]">
              <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-1">Total Active Held</p>
              <h3 className="text-3xl font-black text-emerald-600 tracking-tighter">
                ₹{activeEscrows.reduce((sum, e) => sum + Number(e.amount), 0).toLocaleString()}
              </h3>
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-6 mt-12 space-y-16">
        
        {/* Active Deposits */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
              <ShieldCheck className="text-emerald-500" /> Active Holdings
            </h2>
            <div className="h-px flex-1 bg-slate-100 mx-6 hidden md:block"></div>
          </div>

          {activeEscrows.length === 0 ? (
            <div className="bg-white rounded-[3rem] p-16 text-center border-2 border-dashed border-slate-200">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                <Lock size={32} />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">No active deposits</h3>
              <p className="text-slate-500 font-medium mb-8 max-w-sm mx-auto">
                Security deposits paid through REHWAS will appear here while they are held in the vault.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {activeEscrows.map(escrow => (
                <EscrowCard 
                  key={escrow.id} 
                  escrow={escrow} 
                  role={profile?.role || 'tenant'}
                  onRelease={() => handleRelease(escrow.id)}
                  onDispute={() => handleDispute(escrow.id)}
                  processing={processing}
                />
              ))}
            </div>
          )}
        </section>

        {/* Past Transactions */}
        {pastEscrows.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-black text-slate-400 uppercase tracking-tight flex items-center gap-3">
                <Clock /> Vault History
              </h2>
              <div className="h-px flex-1 bg-slate-100 mx-6 hidden md:block"></div>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Property / {profile?.role === 'landlord' ? 'Tenant' : 'Landlord'}</th>
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Amount</th>
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {pastEscrows.map(escrow => (
                    <tr key={escrow.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-6">
                        <p className="font-bold text-slate-900">{format(parseISO(escrow.created_at), 'dd MMM yyyy')}</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">ID: {escrow.id.slice(0,8)}</p>
                      </td>
                      <td className="p-6">
                        <p className="font-black text-slate-900">{escrow.rooms?.title}</p>
                        <p className="text-xs font-bold text-slate-400">
                          {profile?.role === 'landlord' 
                            ? escrow.tenant_details?.tenant_profile?.full_name 
                            : escrow.landlord?.full_name}
                        </p>
                      </td>
                      <td className="p-6 text-right">
                        <p className="font-black text-slate-900">₹{escrow.amount.toLocaleString()}</p>
                      </td>
                      <td className="p-6">
                        <div className="flex justify-center">
                          <StatusBadge status={escrow.status} />
                        </div>
                      </td>
                      <td className="p-6 text-right">
                        <button className="p-2 bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-all">
                          <Download size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function EscrowCard({ 
  escrow, 
  role, 
  onRelease, 
  onDispute,
  processing 
}: { 
  escrow: EscrowRecord; 
  role: string;
  onRelease: () => void;
  onDispute: () => void;
  processing: boolean;
}) {
  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden relative group">
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-bl-[10rem] -mr-20 -mt-20 transition-transform group-hover:scale-110 duration-1000"></div>
      
      <div className="p-8 md:p-12 flex flex-col md:flex-row gap-12 relative z-10">
        <div className="flex-1 space-y-8">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="w-20 h-20 bg-emerald-100 rounded-3xl flex items-center justify-center text-emerald-600 shadow-inner">
              <Lock size={32} />
            </div>
            <div>
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                <ShieldCheck size={14} /> FUNDS SECURED IN VAULT
              </p>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">{escrow.rooms?.title}</h3>
              <p className="text-slate-400 font-bold text-sm flex items-center gap-1">
                {escrow.rooms?.locality}, {escrow.rooms?.city}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-8 border-t border-slate-50">
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Locked Amount</p>
              <p className="text-2xl font-black text-slate-900 tracking-tighter">₹{escrow.amount.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Locked Date</p>
              <p className="text-sm font-black text-slate-900">{format(parseISO(escrow.created_at), 'dd MMM yyyy')}</p>
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                {role === 'landlord' ? 'Tenant Name' : 'Landlord Name'}
              </p>
              <p className="text-sm font-black text-slate-900">
                {role === 'landlord' 
                  ? escrow.tenant_details?.tenant_profile?.full_name 
                  : escrow.landlord?.full_name}
              </p>
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Vault Status</p>
              <StatusBadge status={escrow.status} />
            </div>
          </div>
        </div>

        <div className="md:w-72 flex flex-col justify-center gap-4">
          <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-black">1</div>
              <p className="text-[10px] font-black text-slate-900 uppercase tracking-tight">Deposit Secured</p>
              <Check size={14} className="text-emerald-500 ml-auto" />
            </div>
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black ${escrow.move_in_verified ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'}`}>2</div>
              <p className={`text-[10px] font-black uppercase tracking-tight ${escrow.move_in_verified ? 'text-slate-900' : 'text-slate-500'}`}>Move-in Verified</p>
              {escrow.move_in_verified ? (
                <Check size={14} className="text-emerald-500 ml-auto" />
              ) : (
                <FileText size={14} className="text-slate-300 ml-auto" />
              )}
            </div>
            <div className="h-px bg-slate-100 mx-2"></div>
            <p className="text-[9px] text-slate-400 font-bold leading-relaxed">
              {escrow.move_in_verified 
                ? "Verification complete. Funds are ready for release."
                : "Funds are released after both parties sign the move-in inspection report."
              }
            </p>
          </div>

          {role === 'landlord' ? (
            <button 
              onClick={onRelease}
              disabled={processing || !escrow.move_in_verified}
              className={`w-full py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                processing || !escrow.move_in_verified
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                  : 'bg-emerald-600 text-white shadow-xl shadow-emerald-600/20 hover:bg-emerald-700 active:scale-95'
              }`}
            >
              {processing ? 'Processing...' : (escrow.move_in_verified ? 'Release Funds' : 'Awaiting Move-in')}
            </button>
          ) : (
            <div className="space-y-4">
              <div className={`w-full py-5 rounded-[2rem] text-center border-2 font-black text-[10px] uppercase tracking-widest ${escrow.move_in_verified ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-white border-slate-100 text-slate-400'}`}>
                {escrow.move_in_verified ? 'Verification Complete' : 'Awaiting Move-in'}
              </div>
              
              {!escrow.move_in_verified && (
                <button 
                  onClick={onDispute}
                  disabled={processing}
                  className="w-full flex items-center justify-center gap-2 text-[9px] font-black text-rose-500 uppercase tracking-widest hover:text-rose-600 transition-all"
                >
                  <AlertTriangle size={12} /> Raise Dispute
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    pending: 'bg-amber-50 text-amber-600 border-amber-100',
    held: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    released: 'bg-blue-50 text-blue-600 border-blue-100',
    disputed: 'bg-rose-50 text-rose-600 border-rose-100',
    refunded: 'bg-slate-100 text-slate-600 border-slate-200'
  };

  return (
    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${styles[status as keyof typeof styles]}`}>
      {status}
    </span>
  );
}

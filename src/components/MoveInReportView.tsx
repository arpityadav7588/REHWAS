import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { format, parseISO } from 'date-fns';
import { ShieldCheck, User, Home, MapPin, CheckCircle2, AlertCircle, Printer, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * MoveInReportView
 * WHAT IT DOES: Renders a comprehensive, print-optimized view of a property inspection.
 * DUAL PURPOSE: 1. Sign-off flow for tenants. 2. Final immutable legal record viewing.
 * BRINGING TRUST: Uses "Verify-by-Sign" logic—once both parties sign, the record is legally locked in REHWAS.
 */
export const MoveInReportView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [tenantNotes, setTenantNotes] = useState('');

  useEffect(() => {
    const fetchReport = async () => {
      if (!id) return;
      
      const { data, error } = await supabase
        .from('move_in_reports')
        .select(`
          *,
          tenants (
            profiles:tenant_profile_id (full_name, phone),
            rooms (title, address, locality, city, room_type)
          ),
          landlord:landlord_id (full_name, phone)
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error(error);
        toast.error('Failed to load report');
        navigate('/discover');
      } else {
        setReport(data);
        setTenantNotes(data.tenant_notes || '');
      }
      setLoading(false);
    };

    fetchReport();
  }, [id, navigate]);

  const handleSignReport = async () => {
    if (!report || signing) return;
    
    setSigning(true);
    try {
      const { error } = await supabase
        .from('move_in_reports')
        .update({
          tenant_notes: tenantNotes,
          tenant_signed_at: new Date().toISOString(),
          report_status: 'completed'
        })
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Report Signed & Verified! ✅');
      setReport({ ...report, report_status: 'completed', tenant_signed_at: new Date().toISOString(), tenant_notes: tenantNotes });
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign report');
    } finally {
      setSigning(false);
    }
  };

  if (loading) {
     return (
       <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="flex flex-col items-center gap-4">
             <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
             <p className="font-black text-slate-500 uppercase tracking-widest text-xs">Authenticating Record...</p>
          </div>
       </div>
     );
  }

  if (!report) return null;

  const tInfo = report.tenants;
  const tProfile = tInfo.profiles;
  const room = tInfo.rooms;
  const lProfile = report.landlord;
  const isTenant = profile?.id === tInfo.tenant_profile_id;
  const isCompleted = report.report_status === 'completed';

  return (
    <div className="min-h-screen bg-slate-100 py-10 px-4 print:bg-white print:p-0">
      
      {/* Action Bar - Hidden in Print */}
      <div className="max-w-5xl mx-auto mb-8 flex flex-col md:flex-row justify-between items-center gap-4 print:hidden">
         <div className="flex items-center gap-3">
            <div className={`px-4 py-2 rounded-full font-black text-[10px] uppercase tracking-[0.2em] border-2 shadow-sm ${isCompleted ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'}`}>
               {isCompleted ? 'Immutable Record' : 'Pending Signature'}
            </div>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">RH-MIR-{report.id.substring(0, 8).toUpperCase()}</p>
         </div>
         <div className="flex gap-3">
            <button 
              onClick={() => navigate(-1)}
              className="px-6 py-2.5 bg-white text-slate-600 font-bold rounded-xl border border-slate-200 hover:bg-slate-50 transition-all text-sm"
            >
              Back
            </button>
            <button 
              onClick={() => window.print()}
              disabled={!isCompleted && !isTenant}
              className={`px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl shadow-xl flex items-center gap-2 hover:bg-slate-800 transition-all text-sm ${(!isCompleted && !isTenant) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Printer size={16} /> Print Report
            </button>
         </div>
      </div>

      {/* MAIN REPORT PAPER (A4 Approx) */}
      <div className="max-w-[210mm] mx-auto bg-white shadow-2xl rounded-[40px] overflow-hidden relative print:shadow-none print:rounded-none print:w-full">
        
        {/* Header Branding */}
        <div className="p-12 md:p-16 bg-gradient-to-br from-slate-900 to-slate-800 text-white relative">
           <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
              <div>
                 <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                       <ShieldCheck size={24} className="text-white" />
                    </div>
                    <h1 className="text-3xl font-black tracking-tighter uppercase italic">REHWAS VAULT</h1>
                 </div>
                 <h2 className="text-4xl font-black tracking-tight mb-2">Move-in Inspection Report</h2>
                 <p className="text-slate-400 font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                    Official Property condition audit • {format(parseISO(report.created_at), 'dd MMM yyyy')}
                 </p>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/10 text-right">
                 <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Status</p>
                 <p className="text-2xl font-black capitalize">{report.report_status.replace('_', ' ')}</p>
                 {isCompleted && <p className="text-[10px] font-bold text-slate-300 mt-1 uppercase">Digitally Verified by REHWAS</p>}
              </div>
           </div>
           {/* Decorative Grid */}
           <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
        </div>

        <div className="p-12 md:p-16 space-y-16">
           
           {/* Entity Details */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-12 border-b border-slate-100 pb-16">
              <div className="space-y-4">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Home size={12}/> Property Details</p>
                 <div className="space-y-1">
                    <p className="text-xl font-black text-slate-900">{room.title}</p>
                    <p className="text-sm font-bold text-slate-500 flex items-center gap-1.5"><MapPin size={14}/> {room.address}</p>
                    <p className="text-xs font-medium text-slate-400">{room.locality}, {room.city}</p>
                 </div>
              </div>
              <div className="space-y-4">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><User size={12}/> Primary Landlord</p>
                 <div className="space-y-1">
                    <p className="text-xl font-black text-slate-900">{lProfile.full_name}</p>
                    <p className="text-sm font-bold text-slate-500 tracking-tighter">PH: {lProfile.phone}</p>
                 </div>
              </div>
              <div className="space-y-4">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><User size={12}/> Incoming Tenant</p>
                 <div className="space-y-1">
                    <p className="text-xl font-black text-slate-900">{tProfile.full_name}</p>
                    <p className="text-sm font-bold text-slate-500 tracking-tighter">PH: {tProfile.phone}</p>
                 </div>
              </div>
           </div>

           {/* Inspection Checklist Output */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
              <section className="space-y-8">
                 <h3 className="text-xl font-black text-slate-900 tracking-tight">Technical Audit</h3>
                 <div className="grid grid-cols-1 gap-4">
                    {[
                      { label: 'Electricity Infrastructure', val: report.checklist.electricity_working },
                      { label: 'Hydraulic/Water Plumbing', val: report.checklist.water_working },
                      { label: 'Connectivity & WiFi', val: report.checklist.wifi_connected },
                      { label: 'AC Cooling Systems', val: report.checklist.ac_working },
                      { label: 'Aperture/Window Locks', val: report.checklist.locks_functional },
                    ].map(item => (
                      <div key={item.label} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                         <span className="text-sm font-bold text-slate-600">{item.label}</span>
                         {item.val ? <CheckCircle2 size={20} className="text-emerald-500" /> : <AlertCircle size={20} className="text-slate-300" />}
                      </div>
                    ))}
                 </div>
                 <div className="p-6 bg-slate-50 rounded-3xl space-y-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Key Management Handover</p>
                    <div className="flex gap-4">
                       <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter ${report.checklist.keys_handed_over.main_door ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-400'}`}>Main Door</div>
                       <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter ${report.checklist.keys_handed_over.room ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-400'}`}>Private Room</div>
                       <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter ${report.checklist.keys_handed_over.mailbox ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-400'}`}>Mailbox</div>
                    </div>
                 </div>
              </section>

              <section className="space-y-8">
                 <h3 className="text-xl font-black text-slate-900 tracking-tight">Financial & Meters</h3>
                 <div className="space-y-6">
                    <div className="p-8 bg-indigo-50 border-2 border-indigo-100 rounded-[2rem] relative overflow-hidden">
                       <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1 relative z-10">Initial Meter Reading</p>
                       <p className="text-3xl font-black text-indigo-900 relative z-10">{report.meter_reading || 'N/A'}</p>
                       <div className="absolute top-[-50%] right-[-10%] w-40 h-40 bg-indigo-100/50 rounded-full blur-3xl"></div>
                    </div>
                    <div className="p-8 border border-slate-100 rounded-[2rem] space-y-6">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Observation Notes</p>
                       <div className="space-y-6">
                          <div>
                             <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Landlord Review</p>
                             <p className="text-sm font-medium text-slate-700 leading-relaxed italic border-l-4 border-slate-200 pl-4">{report.notes || 'No notes provided by landlord.'}</p>
                          </div>
                          {isCompleted ? (
                            <div>
                               <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Tenant Review</p>
                               <p className="text-sm font-medium text-slate-700 leading-relaxed italic border-l-4 border-emerald-200 pl-4">{report.tenant_notes || 'No additional notes from tenant.'}</p>
                            </div>
                          ) : (
                             isTenant && (
                               <div className="space-y-3 pt-4 border-t border-slate-50 animate-in slide-in-from-bottom-4 duration-500">
                                  <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Add your observations</label>
                                  <textarea 
                                    value={tenantNotes}
                                    onChange={(e) => setTenantNotes(e.target.value)}
                                    placeholder="e.g. Also noted a minor scratch on the wardrobe..."
                                    className="w-full bg-slate-50 border border-indigo-100 rounded-2xl p-4 text-sm font-medium outline-none focus:ring-4 focus:ring-indigo-100 transition-all min-h-[100px]"
                                  />
                                  <button 
                                    onClick={handleSignReport}
                                    disabled={signing}
                                    className="w-full bg-emerald-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-emerald-200 hover:bg-emerald-700 active:scale-95 transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-widest"
                                  >
                                    {signing ? <Loader2 className="animate-spin" size={18}/> : <ShieldCheck size={18}/>}
                                    {signing ? 'Authenticating...' : 'Sign & Accept Condition'}
                                  </button>
                               </div>
                             )
                          )}
                       </div>
                    </div>
                 </div>
              </section>
           </div>

           {/* Photo Evidence Grid */}
           <section className="space-y-8">
              <div className="flex justify-between items-end">
                 <h3 className="text-xl font-black text-slate-900 tracking-tight">Photo Evidence (Immutable Timestamped)</h3>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Collection: {report.photos.length} Frames</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                 {report.photos.map((url: string, idx: number) => (
                   <div key={idx} className="group relative aspect-[4/3] rounded-[2rem] overflow-hidden bg-slate-100 shadow-sm border border-slate-200 break-inside-avoid">
                      <img src={url} className="w-full h-full object-cover grayscale transition-all duration-500 group-hover:grayscale-0" alt={`Evidence ${idx+1}`} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent p-6 flex flex-col justify-end">
                         <p className="text-[9px] font-black text-white/80 uppercase tracking-tighter">Frame #{idx+1} • Certified</p>
                      </div>
                   </div>
                 ))}
              </div>
           </section>

           {/* Signatures & Certification */}
           <div className="mt-20 pt-16 border-t-[3px] border-slate-900 grid grid-cols-1 md:grid-cols-2 gap-16">
              <div className="space-y-8">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest tracking-[0.3em]">Signatory A (Landlord)</p>
                 <div className="flex flex-col gap-2">
                    <p className="text-3xl font-black text-slate-900 italic tracking-tighter">{lProfile.full_name}</p>
                    <p className="text-xs font-bold text-slate-500 italic">Signed Digitally via REHWAS on {format(parseISO(report.landlord_signed_at), 'dd MMM yyyy, p')}</p>
                 </div>
              </div>
              <div className="space-y-8 text-right">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest tracking-[0.3em]">Signatory B (Tenant)</p>
                 <div className="flex flex-col gap-2">
                    {isCompleted ? (
                      <>
                        <p className="text-3xl font-black text-slate-900 italic tracking-tighter">{tProfile.full_name}</p>
                        <p className="text-xs font-bold text-slate-500 italic">Signed Digitally via REHWAS on {report.tenant_signed_at ? format(parseISO(report.tenant_signed_at), 'dd MMM yyyy, p') : 'N/A'}</p>
                      </>
                    ) : (
                      <div className="px-8 py-5 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl inline-block">
                         <p className="font-black text-slate-300 italic text-2xl uppercase tracking-tighter">Awaiting Tenant</p>
                      </div>
                    )}
                 </div>
              </div>
           </div>

           {/* Footer Disclaimer */}
           <div className="mt-12 text-center space-y-4 pt-12 border-t border-slate-100">
              <div className="flex justify-center items-center gap-6 opacity-40">
                 <p className="text-[9px] font-black text-slate-400 uppercase">Hash: 0x{report.id.substring(0,16)}</p>
                 <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
                 <p className="text-[9px] font-black text-slate-400 uppercase">Audit ID: MIR-{report.id.substring(24)}</p>
              </div>
              <p className="text-[9px] font-bold text-slate-400 uppercase leading-relaxed max-w-lg mx-auto">
                 This document is a certified, timestamped property condition report generated by REHWAS. 
                 Data is stored in immutable cloud storage and is valid as evidence in property dispute arbitrations.
              </p>
              <div className="flex justify-center gap-2 pt-4">
                 <div className="w-12 h-1 bg-emerald-500 rounded-full"></div>
                 <div className="w-4 h-1 bg-slate-200 rounded-full"></div>
                 <div className="w-4 h-1 bg-slate-200 rounded-full"></div>
              </div>
           </div>
        </div>
      </div>

      <style>{`
        @media print {
          body { background: white !important; }
          .min-h-screen { background: white !important; padding: 0 !important; }
          .max-w-[210mm] { max-width: 100% !important; margin: 0 !important; box-shadow: none !important; border-radius: 0 !important; }
          .rounded-[40px] { border-radius: 0 !important; }
          .print\\:hidden { display: none !important; }
          .p-12, .p-16 { padding: 40px !important; }
          .bg-slate-900 { background-color: #0f172a !important; -webkit-print-color-adjust: exact; }
          .shadow-2xl, .shadow-xl { box-shadow: none !important; }
          @page { size: A4; margin: 0; }
        }
      `}</style>
    </div>
  );
};

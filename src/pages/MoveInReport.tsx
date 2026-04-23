import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { 
  Camera, Check, Upload, Trash2, Loader2, Info, User, Home, 
  ShieldCheck, MapPin, Printer, Share2, AlertCircle, 
  ChevronRight, ArrowLeft, Image as ImageIcon, Clock
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format, parseISO } from 'date-fns';
import { SignaturePad } from '@/components/SignaturePad';

/**
 * MoveInReportPage
 * WHAT IT IS: A comprehensive, legally-binding inspection system for property move-in/move-out.
 * REALTIME PRESENCE: Like Google Docs, it shows when both parties are viewing the report simultaneously.
 * DIGITAL SIGNATURES: Proves both parties reviewed the condition at a specific timestamp.
 * ANALOGY: A digital notary for property condition.
 */
export default function MoveInReport() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentViewers, setCurrentViewers] = useState<{name: string, role: string}[]>([]);
  
  // Landlord Upload States
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoLabels, setPhotoLabels] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [meterReading, setMeterReading] = useState('');
  const [checklist, setChecklist] = useState<any>({
    electricity_working: false,
    water_working: false,
    locks_functional: false,
    ac_working: false,
    wifi_provided: false,
    keys_handed_over: { main_door: false, room: false, mailbox: false },
    deposit_receipt: false
  });

  // Tenant States
  const [tenantNotes, setTenantNotes] = useState('');

  // Signature States
  const [landlordSig, setLandlordSig] = useState<string | null>(null);
  const [tenantSig, setTenantSig] = useState<string | null>(null);

  // Comparison Mode (for move-out)
  const [originalReport, setOriginalReport] = useState<any>(null);

  useEffect(() => {
    if (!id || !profile) return;

    const fetchReport = async () => {
      const { data, error } = await supabase
        .from('move_in_reports')
        .select(`
          *,
          tenants (
            id,
            tenant_profile_id,
            profiles:tenant_profile_id (full_name, avatar_url),
            rooms (id, title, address, locality, city)
          ),
          landlord:landlord_id (full_name, avatar_url)
        `)
        .eq('id', id)
        .single();

      if (error) {
        toast.error('Report not found');
        navigate('/dashboard');
        return;
      }

      setReport(data);
      setNotes(data.notes || '');
      setTenantNotes(data.tenant_notes || '');
      setMeterReading(data.meter_reading || '');
      if (data.checklist) setChecklist(data.checklist);
      setLandlordSig(data.landlord_signature_url);
      setTenantSig(data.tenant_signature_url);
      setPhotoLabels(data.photo_labels || []);

      // If move-out, fetch original move-in report for comparison
      if (data.type === 'move_out') {
        const { data: original } = await supabase
          .from('move_in_reports')
          .select('*')
          .eq('room_id', data.room_id)
          .eq('type', 'move_in')
          .eq('report_status', 'completed')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (original) setOriginalReport(original);
      }

      setLoading(false);
    };

    fetchReport();

    // STEP 2: Supabase Realtime Presence
    const channel = supabase.channel(`move-in-report-${id}`);

    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const viewers = Object.values(state).flat() as {name: string, role: string}[];
      setCurrentViewers(viewers);
    });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          name: profile.full_name,
          role: profile.role
        });
      }
    });

    return () => {
      channel.unsubscribe();
    };
  }, [id, profile, navigate]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      if (photos.length + newFiles.length > 30) {
        toast.error('Maximum 30 photos allowed per report');
        return;
      }
      setPhotos([...photos, ...newFiles]);
      setPhotoLabels([...photoLabels, ...newFiles.map(() => 'Living room')]);
    }
  };

  const removePhoto = (idx: number) => {
    setPhotos(photos.filter((_, i) => i !== idx));
    setPhotoLabels(photoLabels.filter((_, i) => i !== idx));
  };

  const handleSaveLandlordReport = async () => {
    if (photos.length < 8) {
      toast.error('Minimum 8 photos required for legal protection');
      return;
    }
    if (!landlordSig) {
       toast.error('Landlord signature is required');
       return;
    }

    setSaving(true);
    try {
      const photoUrls: string[] = [];
      const timestamp = new Date().getTime();

      // Upload photos
      for (let i = 0; i < photos.length; i++) {
        const file = photos[i];
        const fileExt = file.name.split('.').pop();
        const path = `move-in-photos/${id}/${timestamp}_${i}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('move-in-photos')
          .upload(path, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('move-in-photos')
          .getPublicUrl(path);
        
        photoUrls.push(publicUrl);
      }

      // Upload Signature
      const sigBlob = await (await fetch(landlordSig)).blob();
      const sigPath = `signatures/${id}/landlord.png`;
      await supabase.storage.from('signatures').upload(sigPath, sigBlob);
      const { data: { publicUrl: sigUrl } } = supabase.storage.from('signatures').getPublicUrl(sigPath);

      const { error } = await supabase
        .from('move_in_reports')
        .update({
          photos: photoUrls,
          photo_labels: photoLabels,
          notes,
          meter_reading: meterReading,
          checklist,
          landlord_signature_url: sigUrl,
          landlord_signed_at: new Date().toISOString(),
          report_status: 'pending_tenant'
        })
        .eq('id', id);

      if (error) throw error;
      toast.success('Report submitted! Tenant notified. 📋');
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleTenantSignOff = async () => {
    if (!tenantSig) {
      toast.error('Please provide your signature to confirm condition');
      return;
    }

    setSaving(true);
    try {
      // Upload Tenant Signature
      const sigBlob = await (await fetch(tenantSig)).blob();
      const sigPath = `signatures/${id}/tenant.png`;
      await supabase.storage.from('signatures').upload(sigPath, sigBlob);
      const { data: { publicUrl: sigUrl } } = supabase.storage.from('signatures').getPublicUrl(sigPath);

      const { error } = await supabase
        .from('move_in_reports')
        .update({
          tenant_notes: tenantNotes,
          tenant_signature_url: sigUrl,
          tenant_signed_at: new Date().toISOString(),
          report_status: 'completed'
        })
        .eq('id', id);

      if (error) throw error;
      toast.success('Report Completed & Locked! ✅');
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Loader2 className="animate-spin text-emerald-500" size={40} />
    </div>
  );

  const isLandlord = profile?.id === report.landlord_id;
  const isTenant = profile?.id === report.tenants.tenant_profile_id;
  const status = report.report_status;
  const room = report.tenants.rooms;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* HEADER SECTION */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-24 flex items-center justify-between">
           <div className="flex items-center gap-6">
              <button onClick={() => navigate(-1)} className="p-3 bg-slate-100 hover:bg-slate-200 rounded-full transition-all text-slate-500">
                 <ArrowLeft size={20} />
              </button>
              <div>
                 <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-xl font-black text-slate-900 tracking-tight">
                      {report.type === 'move_in' ? 'Move-in' : 'Move-out'} Inspection Report
                    </h1>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {status.replace('_', ' ')}
                    </span>
                 </div>
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    ID: RH-MIR-{id?.substring(0,8).toUpperCase()} • {room.title}
                 </p>
              </div>
           </div>

           <div className="flex items-center gap-6">
              {/* Presence Indicator */}
              <div className="hidden md:flex items-center gap-2">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">Currently Viewing:</span>
                 <div className="flex -space-x-2">
                    {currentViewers.map((viewer, i) => (
                       <div key={i} className="group relative">
                          <div className={`w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-black text-white ${viewer.role === 'landlord' ? 'bg-indigo-500' : 'bg-emerald-500 shadow-lg'}`}>
                             {viewer.name.charAt(0)}
                             <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                          </div>
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-[8px] font-black rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                             {viewer.name} ({viewer.role})
                          </div>
                       </div>
                    ))}
                 </div>
              </div>

              {status === 'completed' && (
                <div className="flex gap-2">
                   <button onClick={() => window.print()} className="px-5 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl flex items-center gap-2 hover:bg-slate-200 transition-all text-sm">
                      <Printer size={16} /> Print
                   </button>
                   <button className="px-5 py-2.5 bg-slate-900 text-white font-bold rounded-xl shadow-xl flex items-center gap-2 hover:bg-slate-800 transition-all text-sm">
                      <Share2 size={16} /> Share
                   </button>
                </div>
              )}
           </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 mt-12 space-y-12">
        
        {/* CONDITION PHOTOS SECTION */}
        <section className="bg-white rounded-[3rem] shadow-sm border border-slate-200 overflow-hidden">
           <div className="p-8 md:p-12 border-b border-slate-100 bg-slate-50/50 flex justify-between items-end">
              <div>
                 <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">1. Room Condition Evidence</h2>
                 <p className="text-slate-500 font-medium text-sm">Landlord uploads high-resolution, timestamped photos of the property.</p>
              </div>
              <div className="text-right">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Requirement</p>
                 <p className="text-xs font-bold text-slate-700">Min 8 • Max 30 Photos</p>
              </div>
           </div>

           <div className="p-8 md:p-12">
              {status === 'pending_landlord' && isLandlord ? (
                <div className="space-y-8">
                   <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      <label className="aspect-square border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-emerald-50 hover:border-emerald-300 transition-all group bg-slate-50">
                         <Upload className="text-slate-300 group-hover:text-emerald-500 transition-colors" size={32} />
                         <span className="text-[10px] font-black text-slate-400 group-hover:text-emerald-600 uppercase tracking-[0.2em]">Add Photos</span>
                         <input type="file" multiple accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                      </label>

                      {photos.map((photo, idx) => (
                        <div key={idx} className="aspect-square rounded-[2rem] overflow-hidden group/photo relative shadow-sm border border-slate-100">
                           <img src={URL.createObjectURL(photo)} className="w-full h-full object-cover" alt="Preview" />
                           <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                              <select 
                                value={photoLabels[idx]}
                                onChange={(e) => {
                                   const newLabels = [...photoLabels];
                                   newLabels[idx] = e.target.value;
                                   setPhotoLabels(newLabels);
                                }}
                                className="w-full bg-white/10 text-white text-[9px] font-black uppercase tracking-widest border border-white/20 rounded-lg py-1 px-2 outline-none"
                              >
                                 <option value="Living room">Living room</option>
                                 <option value="Bedroom">Bedroom</option>
                                 <option value="Bathroom">Bathroom</option>
                                 <option value="Kitchen">Kitchen</option>
                                 <option value="Main door">Main door</option>
                                 <option value="AC unit">AC unit</option>
                                 <option value="Custom">Custom...</option>
                              </select>
                           </div>
                           <button onClick={() => removePhoto(idx)} className="absolute top-3 right-3 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover/photo:opacity-100 transition-opacity shadow-lg">
                              <Trash2 size={14} />
                           </button>
                        </div>
                      ))}
                   </div>

                   <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-[2rem] flex gap-4 text-indigo-700">
                      <Clock size={20} className="shrink-0 mt-0.5" />
                      <div>
                         <p className="text-sm font-black uppercase tracking-tight mb-1">Automatic Timestamping</p>
                         <p className="text-xs font-medium leading-relaxed italic opacity-80">Every photo you upload is metadata-stamped with the current server time ({format(new Date(), 'dd MMM yyyy, p')}). This prevents usage of old or misleading photos in disputes.</p>
                      </div>
                   </div>
                </div>
              ) : (
                <div className="space-y-8">
                   <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                      {report.photos.map((url: string, idx: number) => (
                        <div key={idx} className="space-y-3">
                           <div className="aspect-[4/3] rounded-[2rem] overflow-hidden border border-slate-200 group relative">
                              <img src={url} className="w-full h-full object-cover grayscale transition-all duration-500 group-hover:grayscale-0" alt="Evidence" />
                              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full border border-white/20 shadow-sm">
                                 <p className="text-[9px] font-black text-slate-900 uppercase tracking-widest">{report.photo_labels[idx] || 'General Condition'}</p>
                              </div>
                           </div>
                        </div>
                      ))}
                   </div>
                   
                   {/* MOVE-OUT COMPARISON MODE */}
                   {report.type === 'move_out' && originalReport && (
                     <div className="pt-12 border-t border-slate-100">
                        <div className="flex items-center gap-3 mb-8">
                           <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center">
                              <ShieldCheck size={20} />
                           </div>
                           <div>
                              <h3 className="text-lg font-black text-slate-900 tracking-tight">Move-in vs Move-out Comparison</h3>
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Auditing damages against initial report from {format(parseISO(originalReport.created_at), 'dd MMM yyyy')}</p>
                           </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                           <div className="space-y-4">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Original Move-in Photos</p>
                              <div className="grid grid-cols-2 gap-2 opacity-60">
                                 {originalReport.photos.slice(0, 4).map((url: string, i: number) => (
                                   <img key={i} src={url} className="w-full aspect-video object-cover rounded-2xl" alt="Old" />
                                 ))}
                              </div>
                           </div>
                           <div className="space-y-4">
                              <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest text-center">Current Move-out Photos</p>
                              <div className="grid grid-cols-2 gap-2">
                                 {report.photos.slice(0, 4).map((url: string, i: number) => (
                                   <img key={i} src={url} className="w-full aspect-video object-cover rounded-2xl border-2 border-emerald-500/20 shadow-lg" alt="New" />
                                 ))}
                              </div>
                           </div>
                        </div>
                     </div>
                   )}
                </div>
              )}
           </div>
        </section>

        {/* CHECKLIST & NOTES */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
           <section className="bg-white rounded-[3rem] shadow-sm border border-slate-200 p-10 space-y-8">
              <h3 className="text-xl font-black text-slate-900 tracking-tight">2. Utility & Assets Checklist</h3>
              <div className="grid grid-cols-1 gap-3">
                 {[
                   { id: 'electricity_working', label: 'Electricity supply functional' },
                   { id: 'water_working', label: 'Water supply (Hot/Cold) tested' },
                   { id: 'locks_functional', label: 'Door & window locks functional' },
                   { id: 'ac_working', label: 'AC Cooling functional' },
                   { id: 'wifi_provided', label: 'WiFi Credentials provided' },
                   { id: 'deposit_receipt', label: 'Security Deposit receipt issued' },
                 ].map(item => (
                   <button 
                     key={item.id}
                     disabled={status !== 'pending_landlord' || !isLandlord}
                     onClick={() => setChecklist({ ...checklist, [item.id]: !checklist[item.id] })}
                     className={`flex items-center justify-between p-5 rounded-2xl transition-all ${checklist[item.id] ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-slate-50 border-slate-100 text-slate-400 opacity-60'}`}
                   >
                      <span className="text-sm font-bold">{item.label}</span>
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center border-2 ${checklist[item.id] ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-200 text-transparent'}`}>
                         <Check size={14} strokeWidth={4} />
                      </div>
                   </button>
                 ))}
              </div>
              
              <div className="p-6 bg-slate-50 rounded-[2rem] space-y-4">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Meter Reading (Initial Units)</p>
                 <input 
                   disabled={status !== 'pending_landlord' || !isLandlord}
                   value={meterReading}
                   onChange={(e) => setMeterReading(e.target.value)}
                   className="w-full bg-white border border-slate-100 rounded-2xl p-4 font-black text-xl text-slate-900 outline-none focus:border-indigo-500 transition-all"
                   placeholder="e.g. 142.5 kWh"
                 />
              </div>
           </section>

           <section className="bg-white rounded-[3rem] shadow-sm border border-slate-200 p-10 space-y-8">
              <h3 className="text-xl font-black text-slate-900 tracking-tight">3. Condition Observations</h3>
              <div className="space-y-6">
                 <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Landlord's Inspection Notes</label>
                    <textarea 
                      disabled={status !== 'pending_landlord' || !isLandlord}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full h-40 bg-slate-50 border border-slate-100 rounded-[2rem] p-6 font-medium text-slate-700 outline-none focus:border-emerald-500 transition-all resize-none mt-2"
                      placeholder="Describe the overall condition, any pre-existing scratches, or items missing..."
                    />
                 </div>

                 {status !== 'pending_landlord' && (
                    <div>
                       <label className="text-[10px] font-black text-emerald-500 uppercase tracking-widest pl-1">Tenant's Response Notes</label>
                       <textarea 
                         disabled={status === 'completed' || !isTenant}
                         value={tenantNotes}
                         onChange={(e) => setTenantNotes(e.target.value)}
                         className="w-full h-40 bg-emerald-50/50 border border-emerald-100 rounded-[2rem] p-6 font-medium text-slate-700 outline-none focus:border-emerald-500 transition-all resize-none mt-2"
                         placeholder="As a tenant, add your own observations here before signing..."
                       />
                    </div>
                 )}
              </div>
           </section>
        </div>

        {/* SIGNATURE SECTION */}
        <section className="bg-white rounded-[3rem] shadow-sm border border-slate-200 p-10 md:p-16">
           <div className="flex flex-col md:flex-row justify-between items-start gap-12">
              <div className="flex-1 space-y-12 w-full">
                 <SignaturePad 
                   label="Landlord Signature"
                   onSave={setLandlordSig}
                   existingSignature={landlordSig}
                   disabled={status !== 'pending_landlord' || !isLandlord}
                 />
                 
                 {status !== 'pending_landlord' && (
                   <div className="animate-in fade-in slide-in-from-left-8 duration-700">
                      <SignaturePad 
                        label="Tenant Signature"
                        onSave={setTenantSig}
                        existingSignature={tenantSig}
                        disabled={status === 'completed' || !isTenant}
                      />
                   </div>
                 )}
              </div>

              <div className="w-full md:w-80 space-y-6">
                 <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white relative overflow-hidden">
                    <div className="relative z-10">
                       <h4 className="font-black text-lg mb-2">Legal Certification</h4>
                       <p className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase tracking-tight italic">
                         By signing this report, both parties agree to the recorded condition. 
                         This report serves as the primary evidence for security deposit release or claims.
                       </p>
                    </div>
                    <ShieldCheck className="absolute -right-4 -bottom-4 text-white/5 rotate-12" size={120} />
                 </div>

                 {status === 'pending_landlord' && isLandlord && (
                   <button 
                     onClick={handleSaveLandlordReport}
                     disabled={saving || photos.length < 8 || !landlordSig}
                     className={`w-full py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-2 ${
                       saving || photos.length < 8 || !landlordSig ? 'bg-slate-100 text-slate-300' : 'bg-emerald-600 text-white shadow-emerald-200 hover:bg-emerald-700'
                     }`}
                   >
                     {saving ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} strokeWidth={4} />}
                     {saving ? 'Saving...' : 'Submit to Tenant'}
                   </button>
                 )}

                 {status === 'pending_tenant' && isTenant && (
                   <button 
                     onClick={handleTenantSignOff}
                     disabled={saving || !tenantSig}
                     className={`w-full py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-2 ${
                       saving || !tenantSig ? 'bg-slate-100 text-slate-300' : 'bg-indigo-600 text-white shadow-indigo-200 hover:bg-indigo-700'
                     }`}
                   >
                     {saving ? <Loader2 className="animate-spin" size={18} /> : <ShieldCheck size={18} />}
                     {saving ? 'Completing...' : 'Sign & Complete'}
                   </button>
                 )}

                 {status === 'completed' && (
                    <div className="flex flex-col items-center gap-3 p-6 bg-emerald-50 rounded-[2rem] border-2 border-emerald-100">
                       <Check size={32} className="text-emerald-500" strokeWidth={3} />
                       <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Report Verified</p>
                    </div>
                 )}
              </div>
           </div>
        </section>

      </div>
    </div>
  );
}

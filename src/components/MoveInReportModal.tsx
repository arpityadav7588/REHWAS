import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { X, Camera, Check, Upload, Trash2, Loader2, Info, Building2, User, Home } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import type { InspectionChecklist } from '@/types';

interface MoveInReportModalProps {
  tenant: {
    id: string;
    profileId: string;
    tenantName: string;
    roomTitle: string;
    roomId: string;
    landlordId: string;
  };
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * MoveInReportModal
 * WHAT IT DOES: Provides a legal-grade inspection interface for landlords to document a room's state before a tenant moves in.
 * CONCEPT: An "Immutable Digital Ledger" — once signed, these photos cannot be disputed as they are legally timestamped in Supabase.
 */
export const MoveInReportModal: React.FC<MoveInReportModalProps> = ({ tenant, onClose, onSuccess }) => {
  const [photos, setPhotos] = useState<File[]>([]);
  const [notes, setNotes] = useState('');
  const [meterReading, setMeterReading] = useState('');
  const [uploading, setUploading] = useState(false);
  
  const [checklist, setChecklist] = useState<InspectionChecklist>({
    electricity_working: false,
    water_working: false,
    wifi_connected: false,
    ac_working: false,
    locks_functional: false,
    keys_handed_over: {
      main_door: false,
      room: false,
      mailbox: false
    },
    deposit_receipt_given: false
  });

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      if (photos.length + newFiles.length > 20) {
        toast.error('Maximum 20 photos allowed');
        return;
      }
      setPhotos([...photos, ...newFiles]);
    }
  };

  const removePhoto = (idx: number) => {
    setPhotos(photos.filter((_, i) => i !== idx));
  };

  /**
   * Submits the report to Supabase.
   * CONCEPT: "Immutable Legal Record" - Captures state in a way that protects both parties from future deposit disputes.
   */
  const handleSubmit = async () => {
    if (photos.length < 4) {
      toast.error('Please upload at least 4 photos for a valid report');
      return;
    }

    setUploading(true);
    try {
      // 1. Upload photos with current timestamp in filename
      const photoUrls: string[] = [];
      const timestamp = format(new Date(), 'yyyyMMdd_HHmm');
      
      for (const file of photos) {
        const fileExt = file.name.split('.').pop();
        const fileName = `report_${timestamp}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${tenant.roomId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('move-in-photos')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('move-in-photos')
          .getPublicUrl(filePath);
          
        photoUrls.push(publicUrl);
      }

      // 2. Create the report record
      const { data: report, error: reportError } = await supabase
        .from('move_in_reports')
        .insert([{
          tenant_id: tenant.id,
          room_id: tenant.roomId,
          landlord_id: tenant.landlordId,
          photos: photoUrls,
          notes,
          checklist,
          meter_reading: meterReading,
          report_status: 'pending_tenant'
        }])
        .select()
        .single();

      if (reportError) throw reportError;

      // 3. Send automated chat notification to tenant
      await supabase.from('messages').insert([{
        room_id: tenant.roomId,
        sender_id: tenant.landlordId,
        receiver_id: tenant.profileId,
        content: `Your landlord has created an official Move-in Inspection Report for ${tenant.roomTitle}. Please review and sign off to confirm the room condition. 📋`
      }]);

      toast.success('Report created and sent to tenant!');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Failed to create report');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900/40 backdrop-blur-md px-4 py-8">
      <div className="bg-white w-full max-w-4xl h-full max-h-[90vh] rounded-[40px] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-slate-50/50">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 shadow-inner">
                 <Camera size={24} />
              </div>
              <div>
                 <h2 className="text-2xl font-black text-gray-900 tracking-tighter">Move-in Inspection</h2>
                 <p className="text-gray-500 font-bold text-sm flex items-center gap-1.5 uppercase tracking-wide">
                    <User size={14}/> {tenant.tenantName} • <Home size={14}/> {tenant.roomTitle}
                 </p>
              </div>
           </div>
           <button onClick={onClose} className="p-3 bg-gray-100 hover:bg-gray-200 text-gray-400 hover:text-gray-900 rounded-full transition-all">
              <X size={20} />
           </button>
        </div>

        {/* Content Scrollable */}
        <div className="flex-1 overflow-y-auto p-8 space-y-12">
            
            {/* PHOTO UPLOAD ZONE */}
            <section className="space-y-4">
               <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black text-gray-800">1. Room Condition Photos</h3>
                  <span className="text-xs font-black px-3 py-1 bg-slate-100 text-slate-500 rounded-full uppercase tracking-widest">
                     {photos.length} / 20 Selected
                  </span>
               </div>
               
               <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  <label className="aspect-square border-2 border-dashed border-gray-200 rounded-3xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-emerald-50 hover:border-emerald-300 transition-all group overflow-hidden bg-slate-50">
                     <Upload className="text-gray-300 group-hover:text-emerald-500 transition-colors" size={24} />
                     <span className="text-[10px] font-black text-gray-400 group-hover:text-emerald-600 uppercase tracking-widest">Upload Files</span>
                     <input type="file" multiple accept="image/*" onChange={handlePhotoChange} className="hidden" />
                  </label>

                  {photos.map((photo, idx) => (
                    <div key={idx} className="aspect-square rounded-3xl overflow-hidden group/photo relative shadow-sm">
                       <img src={URL.createObjectURL(photo)} className="w-full h-full object-cover" alt="Preview" />
                       <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/photo:opacity-100 transition-opacity flex items-center justify-center">
                          <button onClick={() => removePhoto(idx)} className="p-2 bg-red-500 text-white rounded-full hover:scale-110 transition-transform shadow-lg">
                             <Trash2 size={16} />
                          </button>
                       </div>
                    </div>
                  ))}
               </div>
               <div className="p-3 bg-blue-50 border border-blue-100 rounded-2xl flex gap-3 text-blue-700">
                  <Info size={18} className="shrink-0 mt-0.5" />
                  <p className="text-xs font-bold leading-relaxed italic">The "Legal Record" protocol: Photos are automatically timestamped based on current date. Minimum 4 photos required to create a valid audit trail.</p>
               </div>
            </section>

            {/* CHECKLIST SECTION */}
            <section className="space-y-6">
               <h3 className="text-lg font-black text-gray-800 border-b border-gray-100 pb-2">2. Verification Checklist</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                  {[
                    { key: 'electricity_working', label: 'Electricity supply working' },
                    { key: 'water_working', label: 'Water supply (hot + cold) working' },
                    { key: 'wifi_connected', label: 'WiFi/Internet connected & shared' },
                    { key: 'ac_working', label: 'AC Cooling properly (if applicable)' },
                    { key: 'locks_functional', label: 'All door/window locks functional' },
                    { key: 'deposit_receipt_given', label: 'Security deposit receipt given' },
                  ].map(item => (
                    <button 
                      key={item.key}
                      onClick={() => setChecklist(prev => ({ ...prev, [item.key]: !prev[item.key as keyof typeof prev] }))}
                      className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-all group"
                    >
                      <span className="text-sm font-bold text-gray-700">{item.label}</span>
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-all ${checklist[item.key as keyof InspectionChecklist] ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-gray-200 text-transparent group-hover:border-gray-300'}`}>
                         <Check size={14} strokeWidth={4} />
                      </div>
                    </button>
                  ))}
               </div>

               <div className="bg-slate-50 p-6 rounded-[2rem] space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Key handovers</h4>
                  <div className="flex gap-4">
                     {['Main Door', 'Room', 'Mailbox'].map(k => (
                       <button 
                         key={k}
                         onClick={() => {
                            const keyMap = { 'Main Door': 'main_door', 'Room': 'room', 'Mailbox': 'mailbox' };
                            const target = keyMap[k as keyof typeof keyMap];
                            setChecklist(prev => ({
                               ...prev,
                               keys_handed_over: {
                                  ...prev.keys_handed_over,
                                  [target]: !prev.keys_handed_over[target as keyof typeof prev.keys_handed_over]
                               }
                            }));
                         }}
                         className={`px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all ${checklist.keys_handed_over[k === 'Main Door' ? 'main_door' : k === 'Room' ? 'room' : 'mailbox'] ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'}`}
                       >
                          {k} Key
                       </button>
                     ))}
                  </div>
               </div>
            </section>

            {/* NOTES & READINGS */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Condition Notes</label>
                  <textarea 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Small crack on north wall. AC filter needs cleaning..."
                    className="w-full h-40 bg-gray-50 border border-gray-200 rounded-3xl p-5 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 font-medium text-gray-700 transition-all resize-none"
                  />
               </div>
               <div className="space-y-4">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Meter Reading (Initial)</label>
                     <input 
                       type="text"
                       value={meterReading}
                       onChange={(e) => setMeterReading(e.target.value)}
                       placeholder="e.g. 1422.5 kWh"
                       className="w-full bg-gray-50 border border-gray-200 rounded-3xl px-5 py-4 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 font-bold text-gray-900 transition-all"
                     />
                  </div>
                  <div className="p-6 bg-slate-900 rounded-[2rem] text-white overflow-hidden relative group">
                     <div className="relative z-10">
                        <h4 className="font-black text-lg mb-1 flex items-center gap-2">Final Certification <Building2 size={16} className="text-emerald-400"/></h4>
                        <p className="text-[10px] font-bold text-gray-400 leading-relaxed uppercase tracking-tighter italic">This Move-in Inspection will be broadcasted to the tenant for verification. Once approved, it becomes a permanent legal record in the REHWAS Vault.</p>
                     </div>
                     <Camera className="absolute -right-4 -bottom-4 text-white/5 rotate-12" size={120} />
                  </div>
               </div>
            </section>
        </div>

        {/* Footer Actions */}
        <div className="p-8 border-t border-gray-100 flex justify-end gap-4 bg-slate-50/50">
           <button onClick={onClose} className="px-8 py-3.5 font-black text-gray-500 hover:text-gray-900 transition-colors uppercase tracking-widest text-xs">Discard Draft</button>
           <button 
             onClick={handleSubmit}
             disabled={uploading || photos.length < 4}
             className={`px-8 py-3.5 rounded-[20px] font-black text-xs uppercase tracking-[0.2em] shadow-xl flex items-center gap-2 transition-all active:scale-95 ${uploading ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : photos.length < 4 ? 'bg-gray-100 text-gray-300' : 'bg-emerald-600 text-white shadow-emerald-200 hover:bg-emerald-700'}`}
           >
              {uploading ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} strokeWidth={4} />}
              {uploading ? 'Finalizing Record...' : 'Send to Tenant for Sign-off'}
           </button>
        </div>
      </div>
    </div>
  );
};

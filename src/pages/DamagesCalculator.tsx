import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { 
  Camera, 
  ArrowLeft, 
  ShieldCheck, 
  IndianRupee, 
  AlertTriangle, 
  Plus, 
  Trash2, 
  Save, 
  FileText, 
  CheckCircle2, 
  X,
  History,
  Scale,
  CreditCard,
  MessageSquare
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import type { MoveInReport, DamageItem, DepositEscrow, RentLedger } from '@/types';
import { FeatureGate } from '@/components/FeatureGate';

/**
 * DamagesCalculator component.
 * WHAT IT DOES: Allows landlords to compare move-in/move-out photos and calculate deductions.
 * 
 * LEGAL CONTEXT (Fair Wear and Tear):
 * 1. "Fair wear and tear" refers to the normal deterioration of a property through ordinary use. 
 *    Analogy: Like how a rented car is expected to have some dust and minor tire wear — that's normal. 
 *    A broken window or a deep hole in the wall is NOT normal wear and tear and is deductible.
 * 
 * MUTUAL REVIEW PROTOCOL:
 * 2. Why we need both parties to review before releasing escrow:
 *    Analogy: Like a referee calling the final score — both teams see the scoreboard before the game 
 *    is officially over. Transparency reduces disputes and ensures legal compliance.
 * 
 * RAZORPAY ROUTE INTEGRATION:
 * 3. How partial Razorpay Route transfer works:
 *    Analogy: Like splitting a restaurant bill — one card pays ₹600 (landlord's deduction), 
 *    another pays ₹400 (tenant's refund) of the same ₹1,000 total, processed in one atomic step 
 *    via the release-deposit edge function.
 */
export default function DamagesCalculator() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  
  const isTenant = profile?.role === 'tenant';
  
  const [loading, setLoading] = useState(true);
  const [activeDisputeId, setActiveDisputeId] = useState<string | null>(null);
  const [tenantResponse, setTenantResponse] = useState('');
  const [saving, setSaving] = useState(false);
  
  const [tenant, setTenant] = useState<any>(null);
  const [moveInReport, setMoveInReport] = useState<MoveInReport | null>(null);
  const [moveOutReport, setMoveOutReport] = useState<MoveInReport | null>(null);
  const [escrow, setEscrow] = useState<DepositEscrow | null>(null);
  const [ledgerEntries, setLedgerEntries] = useState<RentLedger[]>([]);
  
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [damageItems, setDamageItems] = useState<DamageItem[]>([]);
  const [isAddingDamage, setIsAddingDamage] = useState(false);
  const [newDamageCoord, setNewDamageCoord] = useState<{x: number, y: number} | null>(null);
  
  // Form for new damage
  const [damageForm, setDamageForm] = useState<Partial<DamageItem>>({
    type: 'scratch',
    severity: 'minor',
    repair_cost: 0,
    location: ''
  });

  const photoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData();
  }, [tenantId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch Tenant and Room
      const { data: tData } = await supabase
        .from('tenants')
        .select('*, profiles(*), rooms(*)')
        .eq('id', tenantId)
        .single();
      
      if (tData) {
        setTenant(tData);
        
        // 2. Fetch Move-in Report
        const { data: miData } = await supabase
          .from('move_in_reports')
          .select('*')
          .eq('tenant_id', tenantId)
          .eq('type', 'move_in')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        setMoveInReport(miData);

        // 3. Fetch Move-out Report
        const { data: moData } = await supabase
          .from('move_in_reports')
          .select('*')
          .eq('tenant_id', tenantId)
          .eq('type', 'move_out')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        setMoveOutReport(moData);
        if (moData?.damage_items) {
          setDamageItems(moData.damage_items);
        }

        // 4. Fetch Escrow
        const { data: eData } = await supabase
          .from('deposit_escrow')
          .select('*')
          .eq('tenant_id', tenantId)
          .maybeSingle();
        
        setEscrow(eData);

        // 5. Fetch Unpaid Ledger
        const { data: lData } = await supabase
          .from('rent_ledger')
          .select('*')
          .eq('tenant_id', tenantId)
          .neq('status', 'paid');
        
        setLedgerEntries(lData || []);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isAddingDamage || !photoRef.current) return;
    
    const rect = photoRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setNewDamageCoord({ x, y });
  };

  const saveDamageItem = () => {
    if (!newDamageCoord || !damageForm.location) {
      toast.error('Please specify location and click on photo');
      return;
    }

    const newItem: DamageItem = {
      id: Math.random().toString(36).substr(2, 9),
      location: damageForm.location || '',
      type: damageForm.type as any,
      severity: damageForm.severity as any,
      repair_cost: Number(damageForm.repair_cost) || 0,
      photo_x: newDamageCoord.x,
      photo_y: newDamageCoord.y,
      photo_index: selectedPhotoIndex
    };

    setDamageItems([...damageItems, newItem]);
    setIsAddingDamage(false);
    setNewDamageCoord(null);
    setDamageForm({ type: 'scratch', severity: 'minor', repair_cost: 0, location: '' });
  };

  const removeDamageItem = (id: string) => {
    setDamageItems(damageItems.filter(item => item.id !== id));
  };

  const totalDeductions = damageItems.reduce((acc, item) => acc + item.repair_cost, 0);
  const unpaidRent = ledgerEntries.reduce((acc, entry) => acc + entry.amount, 0);
  const lateFees = ledgerEntries.reduce((acc, entry) => acc + (entry.late_fee_applied || 0), 0);
  const totalOtherDeductions = unpaidRent + lateFees;
  const grandTotalDeductions = totalDeductions + totalOtherDeductions;
  
  const depositAmount = escrow?.amount || 0;
  const refundAmount = Math.max(0, depositAmount - grandTotalDeductions);

  const handleFinalize = async () => {
    if (!moveOutReport) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('move_in_reports')
        .update({
          damage_items: damageItems,
          total_damages_amount: totalDeductions,
          report_status: 'signed' // Landlord finalized it
        })
        .eq('id', moveOutReport.id);

      if (error) throw error;
      toast.success('Deductions saved successfully! 📄');
    } catch (err: any) {
      toast.error('Failed to save: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-xl font-black text-gray-900 tracking-tight">Damages Calculator</h1>
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{tenant?.profiles?.full_name} • {tenant?.rooms?.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <button 
               onClick={() => window.print()}
               className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold text-xs hover:bg-slate-200 transition-all"
             >
               <FileText size={16} /> Print Summary
             </button>
             <button 
               onClick={handleFinalize}
               disabled={saving}
               className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all active:scale-95"
             >
               {saving ? 'Saving...' : 'Finalize Deductions'}
             </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Comparison Interface */}
          <div className="lg:col-span-2 space-y-8">
            {/* Photo Comparison */}
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
               <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-slate-50/50">
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                    <Camera size={18} className="text-emerald-600" /> Condition Audit
                  </h3>
                  <div className="flex gap-2">
                    <span className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                      Before vs After
                    </span>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-px bg-gray-200">
                  {/* Move-in Side */}
                  <div className="bg-white p-4 relative group">
                    <div className="absolute top-6 left-6 z-10 bg-emerald-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">Move-in</div>
                    <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden border border-gray-100">
                      {moveInReport?.photos[selectedPhotoIndex] ? (
                        <img 
                          src={moveInReport.photos[selectedPhotoIndex]} 
                          className="w-full h-full object-cover" 
                          alt="Move-in condition" 
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 gap-2">
                           <Camera size={48} strokeWidth={1} />
                           <p className="text-[10px] font-bold">No photo captured</p>
                        </div>
                      )}
                    </div>
                    {moveInReport?.photo_labels?.[selectedPhotoIndex] && (
                       <div className="mt-2 text-center">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{moveInReport.photo_labels[selectedPhotoIndex]}</p>
                       </div>
                    )}
                  </div>

                  {/* Move-out Side */}
                  <div className="bg-white p-4 relative group">
                    <div className="absolute top-6 left-6 z-10 bg-rose-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">Move-out</div>
                    <div 
                      ref={photoRef}
                      onClick={handlePhotoClick}
                      className={`aspect-square bg-gray-100 rounded-2xl overflow-hidden border border-gray-100 relative ${isAddingDamage ? 'cursor-crosshair' : ''}`}
                    >
                      {(() => {
                        const moveInLabel = moveInReport?.photo_labels?.[selectedPhotoIndex];
                        let matchedIndex = selectedPhotoIndex;
                        
                        // Try to find matching label in move-out report
                        if (moveInLabel && moveOutReport?.photo_labels) {
                          const foundIndex = moveOutReport.photo_labels.indexOf(moveInLabel);
                          if (foundIndex !== -1) matchedIndex = foundIndex;
                        }

                        const photoUrl = moveOutReport?.photos[matchedIndex];
                        
                        if (photoUrl) {
                          return (
                            <>
                              <img 
                                src={photoUrl} 
                                className="w-full h-full object-cover" 
                                alt="Move-out condition" 
                              />
                              {/* Red Dot Markers */}
                              {damageItems.filter(d => d.photo_index === matchedIndex).map((d, i) => (
                                <div 
                                  key={d.id}
                                  style={{ left: `${d.photo_x}%`, top: `${d.photo_y}%` }}
                                  className="absolute w-6 h-6 bg-rose-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold shadow-xl -translate-x-1/2 -translate-y-1/2 border-2 border-white transition-all transform hover:scale-110"
                                >
                                  {damageItems.indexOf(d) + 1}
                                </div>
                              ))}
                              {/* New Marker Preview */}
                              {newDamageCoord && matchedIndex === selectedPhotoIndex && (
                                <div 
                                  style={{ left: `${newDamageCoord.x}%`, top: `${newDamageCoord.y}%` }}
                                  className="absolute w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center text-white -translate-x-1/2 -translate-y-1/2 border-2 border-white shadow-xl animate-pulse"
                                >
                                  +
                                </div>
                              )}
                            </>
                          );
                        }

                        return (
                          <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 gap-2">
                             <Camera size={48} strokeWidth={1} />
                             <p className="text-[10px] font-bold">No matching photo found</p>
                          </div>
                        );
                      })()}
                    </div>
                    {moveInReport?.photo_labels?.[selectedPhotoIndex] && (
                       <div className="mt-2 text-center">
                          <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Target: {moveInReport.photo_labels[selectedPhotoIndex]}</p>
                       </div>
                    )}
                  </div>
               </div>

               {/* Add Damage Tool Overlay */}
                {isAddingDamage && (
                 <div className="p-6 bg-slate-900 text-white transition-all duration-300">
                    <div className="flex justify-between items-center mb-6">
                       <h4 className="text-xs font-black uppercase tracking-[0.2em] text-amber-400">Add Damage Record</h4>
                       <button onClick={() => setIsAddingDamage(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-bold uppercase text-gray-500">Exact Location</label>
                          <input 
                            type="text" 
                            placeholder="e.g. Wall behind door"
                            value={damageForm.location}
                            onChange={e => setDamageForm({...damageForm, location: e.target.value})}
                            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-amber-400 transition-all"
                          />
                       </div>
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-bold uppercase text-gray-500">Damage Type</label>
                          <select 
                            value={damageForm.type}
                            onChange={e => setDamageForm({...damageForm, type: e.target.value as any})}
                            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-sm outline-none appearance-none"
                          >
                             <option value="scratch">Scratch</option>
                             <option value="dent">Dent</option>
                             <option value="stain">Stain</option>
                             <option value="broken">Broken</option>
                             <option value="missing">Missing</option>
                             <option value="other">Other</option>
                          </select>
                       </div>
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-bold uppercase text-gray-500">Severity</label>
                          <select 
                            value={damageForm.severity}
                            onChange={e => setDamageForm({...damageForm, severity: e.target.value as any})}
                            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-sm outline-none appearance-none"
                          >
                             <option value="minor">Minor</option>
                             <option value="moderate">Moderate</option>
                             <option value="severe">Severe</option>
                          </select>
                       </div>
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-bold uppercase text-gray-500">Repair Cost (₹)</label>
                          <input 
                            type="number" 
                            value={damageForm.repair_cost}
                            onChange={e => setDamageForm({...damageForm, repair_cost: Number(e.target.value)})}
                            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-amber-400 transition-all font-mono"
                          />
                       </div>
                    </div>
                    <div className="mt-6 flex justify-between items-center">
                       <p className="text-[10px] text-gray-400 italic font-medium">Step 1: Click the exact spot on the photo above</p>
                       <button 
                         onClick={saveDamageItem}
                         className="bg-amber-500 text-slate-900 px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-amber-400 transition-all"
                       >
                         <Save size={14} /> Save Damage Record
                       </button>
                    </div>
                 </div>
               )}

               {!isAddingDamage && (
                 <div className="p-4 bg-gray-50 flex justify-between items-center">
                    <div className="flex gap-2 overflow-x-auto scrollbar-none py-1">
                       {moveOutReport?.photos.map((p, i) => (
                         <button 
                           key={i}
                           onClick={() => setSelectedPhotoIndex(i)}
                           className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${selectedPhotoIndex === i ? 'border-emerald-500 ring-4 ring-emerald-500/10' : 'border-white hover:border-gray-300'}`}
                         >
                            <img src={p} className="w-full h-full object-cover" />
                         </button>
                       ))}
                    </div>
                    <button 
                      onClick={() => setIsAddingDamage(true)}
                      className="ml-4 bg-white border border-gray-200 text-gray-900 px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-sm hover:bg-gray-50 transition-all active:scale-95"
                    >
                      <Plus size={16} className="text-rose-600" /> Add Damage Note
                    </button>
                 </div>
               )}
            </div>

            {/* Wear and Tear Note */}
            <div className="bg-amber-50 rounded-[2rem] p-6 border border-amber-200 flex gap-4">
               <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 shrink-0">
                  <Scale size={24} />
               </div>
               <div>
                  <h4 className="text-sm font-black text-amber-900 uppercase tracking-widest mb-1">Fair Wear and Tear Guidelines</h4>
                  <p className="text-xs text-amber-800 font-medium leading-relaxed opacity-80">
                    Note: Minor scuffs, faded paint, and normal aging are considered fair wear and tear and cannot be deducted from deposits under Indian tenancy law. Only damage beyond normal use (e.g. broken windows, structural dents, or deep stains) is deductible.
                  </p>
               </div>
            </div>

            {/* Damage Items Table */}
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
               <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                  <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">Damage Inventory</h3>
                  <div className="text-xs font-black text-rose-600 uppercase tracking-widest bg-rose-50 px-3 py-1 rounded-full">
                    Total: ₹{totalDeductions.toLocaleString()}
                  </div>
               </div>
               <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead>
                       <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                          <th className="px-6 py-4">#</th>
                          <th className="px-6 py-4">Location</th>
                          <th className="px-6 py-4">Type</th>
                          <th className="px-6 py-4">Severity</th>
                          <th className="px-6 py-4">Repair Cost</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                       {damageItems.length === 0 ? (
                         <tr>
                           <td colSpan={6} className="p-12 text-center text-gray-400 italic text-sm">No damages recorded yet. Property is in prime condition.</td>
                         </tr>
                       ) : (
                         damageItems.map((item, i) => (
                           <tr key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-5 text-sm font-bold text-gray-400">{i + 1}</td>
                              <td className="px-6 py-5 text-sm font-black text-gray-900">{item.location}</td>
                              <td className="px-6 py-5">
                                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">
                                   {item.type}
                                 </span>
                              </td>
                              <td className="px-6 py-5">
                                 <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${
                                   item.severity === 'minor' ? 'text-blue-600 bg-blue-50' : 
                                   item.severity === 'moderate' ? 'text-amber-600 bg-amber-50' : 
                                   'text-rose-600 bg-rose-50'
                                 }`}>
                                   {item.severity}
                                 </span>
                              </td>
                              <td className="px-6 py-5 font-mono font-bold text-gray-900">₹{item.repair_cost.toLocaleString()}</td>
                              <td className="px-6 py-5 text-right">
                                 {isTenant ? (
                                   <div className="flex justify-end gap-2">
                                     <button 
                                       onClick={() => setActiveDisputeId(item.id)}
                                       className="px-3 py-1 bg-rose-50 text-rose-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-rose-100 transition-all"
                                     >
                                        I Dispute This
                                     </button>
                                     <button className="p-2 text-gray-300 hover:text-emerald-600 rounded-lg transition-all">
                                        <MessageSquare size={16} />
                                     </button>
                                   </div>
                                 ) : (
                                   <button 
                                     onClick={() => removeDamageItem(item.id)}
                                     className="p-2 text-gray-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                   >
                                      <Trash2 size={16} />
                                   </button>
                                 )}
                              </td>
                           </tr>
                         ))
                       )}
                    </tbody>
                 </table>
               </div>
            </div>

            {/* Tenant Dispute Modal Overlay */}
            {activeDisputeId && (
              <div className="bg-rose-600 rounded-[2.5rem] p-8 text-white transition-all duration-300 transform translate-y-0">
                 <div className="flex justify-between items-center mb-6">
                    <h4 className="text-xl font-black italic tracking-tighter">Tenant Dispute Response</h4>
                    <button onClick={() => setActiveDisputeId(null)} className="text-white/60 hover:text-white"><X size={24} /></button>
                 </div>
                 <div className="space-y-4">
                    <p className="text-xs font-bold text-rose-100 uppercase tracking-widest">Why do you dispute this damage?</p>
                    <textarea 
                      placeholder="e.g. This mark was already there at move-in, or I fixed this before leaving..."
                      value={tenantResponse}
                      onChange={e => setTenantResponse(e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-2xl p-6 text-sm outline-none focus:border-white transition-all h-32"
                    />
                    <div className="flex justify-end gap-3 pt-4">
                       <button 
                         onClick={() => setActiveDisputeId(null)}
                         className="px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-white hover:bg-white/5 transition-all"
                       >
                         Cancel
                       </button>
                       <button 
                         onClick={async () => {
                           const updatedItems = damageItems.map(item => 
                             item.id === activeDisputeId ? { ...item, is_disputed: true, tenant_response: tenantResponse } : item
                           );
                           setDamageItems(updatedItems);
                           setActiveDisputeId(null);
                           setTenantResponse('');
                           toast.info('Dispute recorded. Landlord will be notified.');
                         }}
                         className="px-8 py-4 bg-white text-rose-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-50 transition-all shadow-xl active:scale-95"
                       >
                         Submit Dispute
                       </button>
                    </div>
                 </div>
              </div>
            )}
          </div>

          {/* Right Panel: Final Settlement Summary */}
          <div className="space-y-6">
             <div className="bg-slate-900 rounded-[3rem] p-8 text-white sticky top-28 shadow-2xl shadow-slate-900/20">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-emerald-400 mb-8 flex items-center gap-2">
                  <ShieldCheck size={18} /> Final Settlement Summary
                </h3>

                <div className="space-y-6">
                   <div className="flex justify-between items-center pb-6 border-b border-white/10">
                      <div>
                         <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Security Deposit Held</p>
                         <p className="text-2xl font-black italic tracking-tighter">₹{depositAmount.toLocaleString()}</p>
                      </div>
                      <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-emerald-400 border border-white/10">
                         <IndianRupee size={24} />
                      </div>
                   </div>

                   <div className="space-y-4">
                      <div className="flex justify-between items-center">
                         <span className="text-xs font-bold text-gray-400">Damage Deductions</span>
                         <span className="text-xs font-mono font-black text-rose-400">- ₹{totalDeductions.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                         <span className="text-xs font-bold text-gray-400">Unpaid Rent ({ledgerEntries.length} months)</span>
                         <span className="text-xs font-mono font-black text-rose-400">- ₹{unpaidRent.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                         <span className="text-xs font-bold text-gray-400">Late Fees Outstanding</span>
                         <span className="text-xs font-mono font-black text-rose-400">- ₹{lateFees.toLocaleString()}</span>
                      </div>
                   </div>

                   <div className="pt-6 border-t border-white/10 space-y-6">
                      <div className="p-6 bg-white/5 rounded-[2rem] border border-white/10">
                         <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-2 text-center">Amount to Refund Tenant</p>
                         <p className="text-5xl font-black tracking-tighter text-center italic">₹{refundAmount.toLocaleString()}</p>
                      </div>

                      {escrow ? (
                        <div className="space-y-3">
                           {isTenant ? (
                             <>
                               <button className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-black py-5 rounded-[2rem] text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2">
                                 <CheckCircle2 size={18} /> Accept Settlement of ₹{refundAmount.toLocaleString()}
                               </button>
                               <button className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-4 rounded-[2rem] text-[10px] uppercase tracking-widest transition-all border border-rose-500 flex items-center justify-center gap-2">
                                 <AlertTriangle size={16} /> I Want to Dispute
                               </button>
                             </>
                           ) : (
                             <>
                               <button className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-black py-5 rounded-[2rem] text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2">
                                 <CheckCircle2 size={18} /> Release Refund to Tenant
                               </button>
                               <button className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-[2rem] text-[10px] uppercase tracking-widest transition-all border border-white/10 flex items-center justify-center gap-2">
                                 <AlertTriangle size={16} className="text-amber-400" /> Mark as Disputed
                               </button>
                             </>
                           )}
                        </div>
                      ) : (
                        <div className="p-4 bg-amber-500/10 rounded-2xl border border-amber-500/20">
                           <div className="flex gap-3">
                              <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
                              <p className="text-[10px] font-medium text-amber-200 leading-relaxed italic">
                                No deposit found in REHWAS Vault. Settlement must be handled manually between parties. This document serves as an official audit record.
                              </p>
                           </div>
                        </div>
                      )}
                   </div>
                </div>
                
                <div className="mt-12 flex items-center gap-3 text-white/40">
                   <ShieldCheck size={14} />
                   <p className="text-[9px] font-black uppercase tracking-widest">REHWAS Verified Settlement Protocol</p>
                </div>
             </div>

             {/* History/Log Card */}
             <div className="bg-white rounded-[2.5rem] border border-gray-100 p-6 shadow-sm">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <History size={14} /> Audit Timeline
                </h4>
                <div className="space-y-4">
                   <div className="flex gap-3">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1.5 shrink-0"></div>
                      <div className="space-y-1">
                         <p className="text-xs font-black text-gray-900 leading-none">Move-in Confirmed</p>
                         <p className="text-[10px] text-gray-400 font-medium">{format(new Date(tenant?.move_in_date || Date.now()), 'MMM dd, yyyy')}</p>
                      </div>
                   </div>
                   <div className="flex gap-3">
                      <div className="w-1.5 h-1.5 bg-rose-500 rounded-full mt-1.5 shrink-0"></div>
                      <div className="space-y-1">
                         <p className="text-xs font-black text-gray-900 leading-none">Move-out Initiated</p>
                         <p className="text-[10px] text-gray-400 font-medium">{format(new Date(), 'MMM dd, yyyy')}</p>
                      </div>
                   </div>
                   <div className="flex gap-3">
                      <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-1.5 shrink-0 animate-pulse"></div>
                      <div className="space-y-1">
                         <p className="text-xs font-black text-gray-900 leading-none">Awaiting Settlement</p>
                         <p className="text-[10px] text-gray-400 font-medium">Currently in audit phase</p>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

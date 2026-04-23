import React, { useState, useEffect } from 'react';
import { X, FileText, CheckCircle2, ShieldCheck, Download, AlertCircle, Info } from 'lucide-react';
import { useMicroTransactions } from '@/hooks/useMicroTransactions';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

interface RentAgreementModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: {
    tenantName: string;
    tenantPhone: string;
    tenantAddress: string;
    landlordName: string;
    landlordAddress: string;
    landlordPhone: string;
    propertyAddress: string;
    rentAmount: number;
    depositAmount: number;
    leaseStart: string;
  };
}

/**
 * RentAgreementModal Component
 * 
 * WHAT IT DOES: Provides a form to generate a legally compliant rent agreement.
 * Implements plan-aware pricing (Pro gets 1 free agreement/month).
 * 
 * Analogy: Like a document generator that auto-fills based on your records, 
 * then lets you make final tweaks before printing the official copy.
 */
export const RentAgreementModal: React.FC<RentAgreementModalProps> = ({ isOpen, onClose, initialData }) => {
  const { initiateAgreementPayment, loading: paymentLoading } = useMicroTransactions();
  const { plan, hasPlan } = useSubscription();
  const [loading, setLoading] = useState(false);
  const [agreementsUsed, setAgreementsUsed] = useState(0);

  const [formData, setFormData] = useState({
    landlord_name: initialData.landlordName,
    landlord_address: initialData.landlordAddress,
    landlord_phone: initialData.landlordPhone,
    tenant_name: initialData.tenantName,
    tenant_address: initialData.tenantAddress,
    tenant_phone: initialData.tenantPhone,
    property_address: initialData.propertyAddress,
    rent_amount: initialData.rentAmount,
    deposit_amount: initialData.depositAmount,
    lease_start_date: initialData.leaseStart,
    lease_end_date: '',
    lease_period: '11 months',
    notice_period: '30',
    special_clauses: '',
    city: ''
  });

  // Calculate lease end date (default 11 months)
  useEffect(() => {
    if (initialData.leaseStart) {
      const start = new Date(initialData.leaseStart);
      const end = new Date(start);
      end.setMonth(end.getMonth() + 11);
      setFormData(prev => ({ ...prev, lease_end_date: end.toISOString().split('T')[0] }));
    }
  }, [initialData.leaseStart]);

  // Fetch usage for Pro plan
  useEffect(() => {
    if (hasPlan('pro')) {
      const fetchUsage = async () => {
        const { data } = await supabase.from('subscriptions').select('monthly_agreements_used').single();
        if (data) setAgreementsUsed(data.monthly_agreements_used || 0);
      };
      fetchUsage();
    }
  }, [hasPlan]);

  const isEligibleForFree = hasPlan('pro') && agreementsUsed < 1;

  const handleGenerate = async () => {
    if (isEligibleForFree) {
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('generate-agreement', {
          body: { agreement_data: formData, is_free: true }
        });

        if (error) throw error;

        // Update usage in DB
        await supabase.rpc('increment_agreement_usage');

        const blob = new Blob([data.html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const win = window.open(url, '_blank');
        if (win) win.print();
        toast.success('Free agreement generated! 📄');
        onClose();
      } catch (err: any) {
        toast.error(err.message || 'Failed to generate agreement');
      } finally {
        setLoading(false);
      }
    } else {
      initiateAgreementPayment(formData);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}></div>
      
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] overflow-hidden shadow-2xl relative z-10 animate-in zoom-in-95 duration-300 flex flex-col border border-indigo-100 max-h-[90vh]">
        {/* Header */}
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100">
              <FileText size={28} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tighter leading-none">Draft Agreement</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Review & Generate Legal Document</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X size={24} className="text-slate-400" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-8 overflow-y-auto">
          <div className="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100 mb-8">
            <div className="flex items-start gap-4">
              <Info className="text-indigo-600 mt-1" size={20} />
              <div className="text-sm text-indigo-900 font-medium leading-relaxed">
                We've pre-filled this form from your REHWAS records. Review the details carefully. Once generated, the agreement will include standard Indian rental clauses and verification tracking.
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="col-span-2 space-y-4">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Parties Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Landlord Name</label>
                  <input type="text" value={formData.landlord_name} onChange={e => setFormData({...formData, landlord_name: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:border-indigo-600 outline-none transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Tenant Name</label>
                  <input type="text" value={formData.tenant_name} onChange={e => setFormData({...formData, tenant_name: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:border-indigo-600 outline-none transition-all" />
                </div>
              </div>
            </div>

            <div className="col-span-2 space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Property Address</label>
              <textarea rows={2} value={formData.property_address} onChange={e => setFormData({...formData, property_address: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:border-indigo-600 outline-none transition-all resize-none" />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Monthly Rent</label>
              <input type="number" value={formData.rent_amount} onChange={e => setFormData({...formData, rent_amount: parseInt(e.target.value)})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:border-indigo-600 outline-none transition-all" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Security Deposit</label>
              <input type="number" value={formData.deposit_amount} onChange={e => setFormData({...formData, deposit_amount: parseInt(e.target.value)})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:border-indigo-600 outline-none transition-all" />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Lease Start</label>
              <input type="date" value={formData.lease_start_date} onChange={e => setFormData({...formData, lease_start_date: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:border-indigo-600 outline-none transition-all" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Notice Period (Days)</label>
              <input type="number" value={formData.notice_period} onChange={e => setFormData({...formData, notice_period: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:border-indigo-600 outline-none transition-all" />
            </div>

            <div className="col-span-2 space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Special Clauses (Optional)</label>
              <textarea rows={3} placeholder="e.g. No pets allowed, Smoking prohibited in balcony..." value={formData.special_clauses} onChange={e => setFormData({...formData, special_clauses: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:border-indigo-600 outline-none transition-all resize-none" />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex flex-col gap-4 sticky bottom-0 z-20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl border border-slate-200 flex items-center justify-center text-indigo-600 shadow-sm">
                <Download size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Estimated Cost</p>
                <h4 className="font-black text-slate-900 text-xl">{isEligibleForFree ? 'FREE' : '₹299'}</h4>
              </div>
            </div>
            {isEligibleForFree && (
              <div className="px-3 py-1 bg-indigo-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse">
                Pro Reward Available
              </div>
            )}
          </div>

          <button 
            onClick={handleGenerate}
            disabled={loading || paymentLoading}
            className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-xl shadow-indigo-200 active:scale-95 transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-widest disabled:opacity-50"
          >
            {loading || paymentLoading ? "Generating..." : (
              isEligibleForFree ? "Generate Free Agreement" : "Generate Agreement — ₹299"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

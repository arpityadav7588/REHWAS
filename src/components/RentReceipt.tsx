import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { Phone, CheckCircle, Share2, Printer, MapPin, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * RentReceipt Component
 * WHAT IT DOES: Renders a professional, A4-portrait rent receipt for a specific ledger entry.
 * ANALOGY: A carbon-copy receipt book that is automatically filled out and shared with the tenant.
 */
export const RentReceipt: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [receiptId] = useState(() => `RH-RCT-${Math.random().toString(36).substring(2, 10).toUpperCase()}`);

  useEffect(() => {
    const fetchReceiptData = async () => {
      if (!id) return;
      
      const { data, error } = await supabase
        .from('rent_ledger')
        .select(`
          *,
          tenants (
            move_in_date,
            rent_amount,
            profiles:tenant_profile_id (full_name, phone),
            rooms (title, address, locality, city, room_type)
          ),
          landlord:landlord_id (full_name, phone)
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error(error);
        toast.error('Failed to load receipt data');
      } else {
        setData(data);
        // Automatic print trigger once data is loaded
        setTimeout(() => {
          window.print();
        }, 800);
      }
      setLoading(false);
    };

    fetchReceiptData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin"></div>
          <p className="font-bold text-gray-500 animate-pulse">Generating Secure Receipt...</p>
        </div>
      </div>
    );
  }

  if (!data) return <div className="p-20 text-center font-bold">Receipt not found or access denied.</div>;

  const tenant = data.tenants;
  const profile = tenant.profiles;
  const room = tenant.rooms;
  const landlord = data.landlord;
  const totalAmount = data.amount + (data.utility_amount || 0);

  const handleWhatsAppShare = () => {
    const text = `Hi ${profile.full_name}, your rent receipt for ${data.month} from ${landlord.full_name} is ready. Receipt ID: ${receiptId}. View here: ${window.location.href}`;
    window.open(`https://wa.me/${profile.phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-100 py-10 print:bg-white print:py-0">
      {/* Action Bar - Hidden in Print */}
      <div className="max-w-4xl mx-auto mb-6 flex justify-between items-center px-4 print:hidden">
         <button 
           onClick={() => window.close()}
           className="text-gray-500 font-bold flex items-center gap-1 hover:text-gray-800 transition-colors"
         >
           &larr; Close Window
         </button>
         <div className="flex gap-3">
            <button 
              onClick={handleWhatsAppShare}
              className="bg-[#25D366] text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-green-200 active:scale-95 transition-all"
            >
              <Share2 size={18} /> Share on WhatsApp
            </button>
            <button 
              onClick={() => window.print()}
              className="bg-white text-gray-700 border-2 border-gray-100 px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-50 active:scale-95 transition-all"
            >
              <Printer size={18} /> Print
            </button>
         </div>
      </div>

      {/* RECEIPT PAPER */}
      <div className="max-w-[210mm] mx-auto bg-white shadow-2xl min-h-[297mm] p-12 relative overflow-hidden print:shadow-none print:p-8 print:mx-0">
        
        {/* Header Section */}
        <div className="flex justify-between items-start mb-10">
           <div>
              <div className="flex items-center gap-2 mb-1">
                 <div className="w-8 h-8 bg-brand rounded-xl flex items-center justify-center text-white">
                    <Building2 size={18} />
                 </div>
                 <h1 className="text-2xl font-black tracking-tighter text-brand">REHWAS</h1>
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Prop-Tech Solutions India</p>
              <p className="mt-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Receipt ID: <span className="text-gray-900 font-black">{receiptId}</span></p>
           </div>
           <div className="text-right">
              <h2 className="text-4xl font-black text-gray-200 italic tracking-tighter uppercase mr-[-4px]">Rent Receipt</h2>
              <div className={`mt-2 inline-flex items-center gap-2 px-4 py-1.5 rounded-full ${data.status === 'paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'} font-black text-xs uppercase tracking-widest`}>
                 <CheckCircle size={14} /> {data.status}
              </div>
           </div>
        </div>

        <div className="h-0.5 w-full bg-brand/10 mb-10"></div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-12 mb-12">
            <div className="space-y-6">
               <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Receipt Date</p>
                  <p className="text-lg font-bold text-gray-900">{format(new Date(data.paid_on || Date.now()), 'dd MMM yyyy')}</p>
               </div>
               <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Payment Month</p>
                  <p className="text-lg font-bold text-gray-900">{data.month}</p>
               </div>
               <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Payment Mode</p>
                  <p className="text-lg font-black text-indigo-600 uppercase tracking-tighter italic">{data.payment_mode || 'UPI / Bank'}</p>
               </div>
            </div>
            <div className="space-y-6 text-right">
               <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Landlord Name</p>
                  <p className="text-lg font-bold text-gray-900">{landlord.full_name}</p>
               </div>
               <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Property Location</p>
                  <div className="flex flex-col items-end gap-1">
                     <p className="text-sm font-bold text-gray-800 flex items-center gap-1"><MapPin size={12} className="text-brand"/> {room.address}</p>
                     <p className="text-sm font-medium text-gray-500">{room.locality}, {room.city}</p>
                  </div>
               </div>
            </div>
        </div>

        {/* Ledger Table */}
        <div className="bg-slate-50 rounded-3xl p-8 mb-12">
           <table className="w-full">
              <thead>
                 <tr className="border-b border-slate-200">
                    <th className="text-left py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</th>
                    <th className="text-right py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                 <tr>
                    <td className="py-6 font-bold text-gray-800">
                       Base Monthly Rent — {room.title}
                       <p className="text-xs font-medium text-gray-400 mt-1">{room.room_type} Accommodation</p>
                    </td>
                    <td className="py-6 text-right font-black text-gray-900 italic">₹{data.amount.toLocaleString()}</td>
                 </tr>
                 {data.utility_amount > 0 && (
                   <tr>
                      <td className="py-6 font-bold text-gray-800">Electricity / Maintenance Utilities</td>
                      <td className="py-6 text-right font-black text-gray-900 italic">₹{data.utility_amount.toLocaleString()}</td>
                   </tr>
                 )}
                 <tr className="bg-white/50">
                    <td className="py-6 font-black text-brand text-xl">TOTAL AMOUNT RECEIVED</td>
                    <td className="py-6 text-right font-black text-brand text-3xl italic tracking-tighter">₹{totalAmount.toLocaleString()}</td>
                 </tr>
              </tbody>
           </table>
        </div>

        {/* Tenant Footer */}
        <div className="grid grid-cols-2 gap-8 mb-20 border-t border-slate-100 pt-10">
           <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Received From (Tenant)</p>
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center font-black text-slate-500">
                    {profile.full_name[0]}
                 </div>
                 <div>
                    <h4 className="font-black text-slate-900">{profile.full_name}</h4>
                    <p className="text-xs font-medium text-slate-500 flex items-center gap-1"><Phone size={10}/> {profile.phone}</p>
                 </div>
              </div>
           </div>
           <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Tenancy Meta</p>
              <p className="text-sm font-bold text-slate-800">Tenancy Since: {format(new Date(tenant.move_in_date), 'MMM yyyy')}</p>
              <p className="text-xs font-bold text-emerald-600 mt-1 uppercase">Bhoomi Score Verified ✓</p>
           </div>
        </div>

        {/* Bottom Disclaimer */}
        <div className="absolute bottom-12 left-12 right-12 border-t border-slate-100 pt-8 text-center">
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-4 leading-relaxed">
              This is a computer-generated receipt and is valid without a physical signature. 
              The transaction depicted is a direct agreement between the landlord and tenant. 
              REHWAS acts as a facilitator and platform provider.
           </p>
           <div className="flex justify-between items-center opacity-60">
              <p className="text-[9px] font-black text-brand uppercase tracking-widest italic">Generated by REHWAS — India's trusted rental platform</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase">Verification URL: rehwas.in/verify/{receiptId}</p>
           </div>
        </div>
      </div>

      <style>{`
        @media print {
          body { background-color: white !important; margin: 0; padding: 0; }
          .min-h-screen { height: auto !important; min-height: 0 !important; background-color: white !important; padding: 0 !important; }
          .print\\:py-0 { padding-top: 0 !important; padding-bottom: 0 !important; }
          .max-w-4xl { max-width: 100% !important; margin: 0 !important; }
          .bg-gray-100 { background-color: white !important; }
          .shadow-2xl { box-shadow: none !important; }
          .rounded-[3rem], .rounded-3xl, .rounded-2xl { border-radius: 0 !important; }
          .print\\:hidden { display: none !important; }
          .bg-slate-50 { background-color: #f8fafc !important; -webkit-print-color-adjust: exact; }
          .bg-brand { background-color: #10B981 !important; -webkit-print-color-adjust: exact; }
          .text-brand { color: #10B981 !important; -webkit-print-color-adjust: exact; }
          @page { margin: 10mm; size: A4 portrait; }
        }
      `}</style>
    </div>
  );
};

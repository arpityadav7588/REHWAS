import React, { useMemo } from 'react';
import { ShieldCheck, User, MapPin, Calendar, CheckCircle2 } from 'lucide-react';

interface DigitalDossierProps {
  tenant: {
    full_name: string;
    phone: string;
    move_in_date: string;
    rent_amount: number;
    room_title: string;
    kyc_verified: boolean;
  };
}

/**
 * DigitalDossier component.
 * WHAT IT DOES: Renders a premium, printable tenant profile (Rental ID).
 * ANALOGY: A professional resume for urban living.
 */
export const DigitalDossier: React.FC<DigitalDossierProps> = ({ tenant }) => {
  const dossierId = useMemo(() => Math.random().toString(36).substring(7).toUpperCase(), []);
  const verificationHash = useMemo(() => Math.random().toString(36).repeat(5), []);

  return (
    <div id="digital-dossier-print" className="hidden print:block fixed inset-0 bg-white p-12 z-[200]">
      <div className="max-w-4xl mx-auto border-[12px] border-emerald-600/10 rounded-[4rem] p-16 relative overflow-hidden">
        {/* Decor */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-50 rounded-full -mr-48 -mt-48"></div>
        
        {/* Header */}
        <div className="flex justify-between items-start relative z-10 mb-20">
          <div className="flex items-center gap-4">
             <div className="w-16 h-16 bg-emerald-600 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-emerald-200">
                <ShieldCheck size={36} />
             </div>
             <div>
                <h1 className="text-4xl font-black text-gray-900 tracking-tighter">REHWAS</h1>
                <p className="text-xs font-black text-emerald-600 uppercase tracking-[0.3em]">Digital Estate Dossier</p>
             </div>
          </div>
          <div className="text-right">
             <p className="text-sm font-bold text-gray-400">Dossier ID</p>
             <p className="text-2xl font-black text-gray-900 leading-none mt-1">RH-{dossierId}</p>
          </div>
        </div>

        {/* Profile Section */}
        <div className="flex gap-14 relative z-10 mb-20">
           <div className="w-48 h-48 bg-gray-100 rounded-[3.5rem] flex items-center justify-center text-gray-300 border-4 border-dashed border-gray-200">
              <User size={80} />
           </div>
           <div className="flex-1 space-y-6">
              <div>
                 <h2 className="text-6xl font-black text-gray-900 tracking-tighter leading-none">{tenant.full_name}</h2>
                 <p className="text-2xl font-bold text-slate-500 mt-2">{tenant.phone}</p>
              </div>
              <div className="flex gap-4">
                 <div className="px-6 py-3 bg-emerald-50 text-emerald-700 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 border border-emerald-100 ring-4 ring-emerald-500/5">
                    <CheckCircle2 size={16} /> KYC Verified
                 </div>
                 <div className="px-6 py-3 bg-blue-50 text-blue-700 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 border border-blue-100 ring-4 ring-blue-500/5">
                    <MapPin size={16} /> Registered Resident
                 </div>
              </div>
           </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-12 relative z-10 mb-20">
           <div className="space-y-8 p-10 bg-slate-50/50 rounded-[3rem] border border-slate-100">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-3">Stay Information</h3>
              <div className="space-y-6">
                 <div className="flex items-center gap-5">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 shadow-sm"><Calendar size={24} /></div>
                    <div>
                       <p className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">Resident Since</p>
                       <p className="text-xl font-bold text-dark">{tenant.move_in_date}</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-5">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 shadow-sm"><MapPin size={24} /></div>
                    <div>
                       <p className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">Property Address</p>
                       <p className="text-xl font-bold text-dark">{tenant.room_title}</p>
                    </div>
                 </div>
              </div>
           </div>
           
           <div className="space-y-8 p-10 bg-emerald-50/30 rounded-[3rem] border border-emerald-100/50 flex flex-col justify-center">
              <h3 className="text-xs font-black text-emerald-600 uppercase tracking-widest border-b border-emerald-100 pb-3">Financial Standing</h3>
              <div className="space-y-6">
                 <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-emerald-500/5 border border-emerald-50 flex items-center justify-between">
                    <div>
                       <p className="text-[10px] font-black text-emerald-600 uppercase leading-none mb-1">Bhoomi Rent Status</p>
                       <p className="text-3xl font-black text-emerald-700">PRIME</p>
                    </div>
                    <CheckCircle2 size={48} className="text-emerald-500 opacity-20" />
                 </div>
              </div>
           </div>
        </div>

        {/* Verification Summary */}
        <div className="bg-slate-900 rounded-[3rem] p-12 text-white relative overflow-hidden">
           <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-24 -mt-24"></div>
           <div className="relative z-10 flex justify-between items-center">
              <div className="space-y-3">
                 <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Verification Hash</p>
                 <p className="font-mono text-xs opacity-40 break-all">{verificationHash}</p>
              </div>
              <div className="text-right">
                 <p className="text-xs font-black uppercase tracking-widest text-emerald-400 mb-2">Status</p>
                 <p className="text-4xl font-black italic tracking-tighter">TRUSTED</p>
              </div>
           </div>
        </div>

        <p className="mt-16 text-center text-[10px] font-black text-slate-300 uppercase tracking-[0.5em] leading-relaxed">
           THIS DOCUMENT IS A CERTIFIED DIGITAL COPY GENERATED BY THE REHWAS PLATFORM.<br />
           SECURE IDENTIFICATION FOR THE MODERN INDIAN RENTER.
        </p>
      </div>
    </div>
  );
};

import React from 'react';
import { ShieldCheck, Calendar, Award, Download } from 'lucide-react';
import type { Profile, RentLedger } from '@/types';

interface DigitalCertificateProps {
  profile: Profile;
  history: RentLedger[];
}

/**
 * DigitalCertificate Component.
 * WHAT IT DOES: Renders a printable 'Rental Passport' with the tenant's trust score and history.
 * ANALOGY: A diplomat's passport or a gold-medal certificate for rental behavior.
 */
export const DigitalCertificate: React.FC<DigitalCertificateProps> = ({ profile, history }) => {
  const score = profile.bhoomi_score || 450;
  const paidCount = history.filter(h => h.status === 'paid').length;

  return (
    <div className="digital-certificate-container printable-certificate bg-white border-[12px] border-slate-900 p-8 md:p-12 max-w-2xl mx-auto shadow-2xl relative overflow-hidden font-sans text-slate-900 print:shadow-none print:border-8 print:m-0 print:p-8 print:max-w-none print:w-[210mm] print:h-[297mm] print:overflow-hidden flex flex-col justify-between">
      {/* Global Print Styles */}
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact;
          }
          body > :not(.printable-certificate) {
            display: none !important;
          }
          #root > :not(.printable-certificate) {
            display: none !important;
          }
          /* Deep override to ensure only the certificate and its parents (if they persist) are clean */
          .printable-certificate {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 210mm !important;
            height: 297mm !important;
            visibility: visible !important;
            z-index: 9999 !important;
            page-break-after: avoid !important;
            page-break-before: avoid !important;
          }
          header, footer, .verification-center, nav, button { display: none !important; }
        }
      `}</style>

      {/* Decorative Guilloche Patterns */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 border border-slate-200"></div>
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-slate-50 rounded-full -ml-16 -mb-16 border border-slate-200"></div>
      
      {/* Logo & Header */}
      <div className="flex flex-col items-center gap-4 mb-8 relative z-10 print:mb-6">
        <div className="w-16 h-16 bg-slate-900 rounded-3xl flex items-center justify-center text-white shadow-xl rotate-3 print:w-14 print:h-14">
          <ShieldCheck size={32} />
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-black tracking-tighter uppercase italic print:text-2xl">REHWAS Digital Passport</h1>
          <p className="text-[10px] font-black tracking-[0.3em] text-slate-400 mt-1 uppercase">Certificate of Rental Excellence</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col gap-6 border-y-2 border-slate-100 py-8 my-6 print:py-6 print:my-4 print:gap-4">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Authenticated Holder</p>
            <h2 className="text-2xl font-black tracking-tight print:text-xl">{profile.full_name}</h2>
            <p className="text-slate-500 font-bold mt-1 text-xs flex items-center gap-2">
               ID: {profile.id.slice(0, 8).toUpperCase()} • {profile.kyc_status === 'verified' ? 'Verified Citizen' : 'Registered User'}
            </p>
          </div>
          <div className="text-right">
             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Bhoomi 2.0 Score</p>
             <h2 className="text-4xl font-black text-emerald-600 tracking-tighter leading-none print:text-3xl">{score}</h2>
             <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mt-1.5">{score > 750 ? 'Elite Tier' : 'Standard Tier'}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 print:gap-3">
           <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 print:p-4">
              <div className="flex items-center gap-2 text-slate-900 mb-2 font-black text-[10px] uppercase tracking-widest">
                 <Calendar size={12} className="text-emerald-600" />
                 Consistency
              </div>
              <p className="text-xl font-black leading-none">{paidCount} Months</p>
              <p className="text-[9px] font-bold text-slate-400 mt-1.5 uppercase">Consecutive Payments</p>
           </div>
           
           <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 print:p-4">
              <div className="flex items-center gap-2 text-slate-900 mb-2 font-black text-[10px] uppercase tracking-widest">
                 <Award size={12} className="text-emerald-600" />
                 Standing
              </div>
              <p className="text-xl font-black leading-none uppercase">{score > 750 ? 'EXCELLENT' : 'GOOD'}</p>
              <p className="text-[9px] font-bold text-slate-400 mt-1.5 uppercase">Trust Variable</p>
           </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-4">
         <p className="text-center text-[9px] text-slate-400 font-bold max-w-sm leading-relaxed tracking-wide px-8">
           This document is a verifiable digital record. New landlords can scan the QR code to verify this data portability request in real-time on the REHWAS protocol.
         </p>
         
         <div className="flex items-center gap-6 opacity-30 grayscale print:gap-4 print:opacity-20">
            <Award size={24} />
            <ShieldCheck size={24} />
            <Award size={24} />
         </div>
      </div>

      <div className="mt-8 flex justify-center print:hidden">
         <button 
           onClick={() => window.print()}
           className="flex items-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl active:scale-95"
         >
           <Download size={18} /> Download Rental Passport
         </button>
      </div>
    </div>
  );
};

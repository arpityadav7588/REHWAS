import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Share2, 
  Copy, 
  Download, 
  Check, 
  ExternalLink, 
  ShieldCheck, 
  Eye, 
  EyeOff,
  TrendingUp,
  MessageCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import type { Profile, TenantCV } from '@/types';

interface RentalCVShareProps {
  profile: Profile;
  cv: TenantCV | null;
}

/**
 * Rental CV Share Component.
 * WHAT IT DOES: Allows tenants to view their own grade, generate a QR code, and share their verified rental history link.
 * 
 * QR CODE ANALOGY: Like a barcode on a product — scanning it with a phone camera is faster than typing a URL, 
 * which matters when a landlord wants to check your history during a room visit.
 */
export const RentalCVShare: React.FC<RentalCVShareProps> = ({ profile, cv }) => {
  const [isPublic, setIsPublic] = useState(cv?.is_public ?? true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [copied, setCopied] = useState(false);

  const cvUrl = `${window.location.origin}/tenant-cv/${profile.id}`;

  const togglePrivacy = async () => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('tenant_cv')
        .update({ is_public: !isPublic })
        .eq('tenant_profile_id', profile.id);

      if (error) throw error;
      setIsPublic(!isPublic);
      toast.success(isPublic ? 'Rental CV is now private' : 'Rental CV is now public');
    } catch (err) {
      toast.error('Failed to update privacy settings');
    } finally {
      setIsUpdating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(cvUrl);
    setCopied(true);
    toast.success('Rental CV link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOnWhatsApp = () => {
    const text = `Hi! Here is my Rental CV from REHWAS showing my verified payment history:\n\n${cvUrl}\n\nThis is verified by REHWAS and cannot be edited.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const downloadQRCode = () => {
    const svg = document.getElementById('cv-qr-code');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width + 40;
      canvas.height = img.height + 100;
      if (ctx) {
        // White background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw QR
        ctx.drawImage(img, 20, 20);
        
        // Add Text
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 20px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('REHWAS RENTAL CV', canvas.width / 2, img.height + 50);
        
        ctx.fillStyle = '#64748b';
        ctx.font = '14px Inter, sans-serif';
        ctx.fillText(profile.full_name, canvas.width / 2, img.height + 75);

        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `REHWAS_RentalCV_${profile.full_name.replace(/\s+/g, '_')}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      }
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  const grade = cv?.rent_health_grade || 'N/A';
  const gradeColor = grade === 'A' ? 'text-emerald-500' : grade === 'B' ? 'text-amber-500' : grade === 'C' ? 'text-rose-500' : 'text-slate-300';

  return (
    <div className="bg-white rounded-[2.5rem] p-8 md:p-10 border border-slate-100 shadow-2xl shadow-slate-200/50">
      <div className="flex flex-col md:flex-row gap-12">
        {/* QR CODE SECTION */}
        <div className="flex flex-col items-center gap-6 shrink-0">
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/20 relative group">
             <div className="absolute inset-0 bg-indigo-600/5 rounded-[2.5rem] opacity-0 group-hover:opacity-100 transition-opacity"></div>
             <QRCodeSVG
                id="cv-qr-code"
                value={cvUrl}
                size={180}
                bgColor="#ffffff"
                fgColor="#10B981"
                level="H"
                includeMargin={true}
                className="relative z-10"
              />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-xl shadow-lg flex items-center justify-center border border-slate-50 z-20">
                 <div className="w-6 h-6 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-black text-[10px]">R</div>
              </div>
          </div>
          <div className="text-center">
            <h4 className="text-lg font-black text-slate-900 tracking-tight">Scan to view CV</h4>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">Verified on REHWAS</p>
          </div>
        </div>

        {/* INFO & ACTIONS */}
        <div className="flex-1">
          <div className="flex flex-col h-full">
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-black text-slate-900 tracking-tighter">Your Rental CV</h3>
                <div className={`px-4 py-1 rounded-full border-2 font-black text-xs ${gradeColor} border-current opacity-80`}>
                   Grade {grade}
                </div>
              </div>
              <p className="text-slate-500 font-medium leading-relaxed mb-6">
                Share this profile with landlords to prove you're a reliable payer. 
                This CV is verified and cannot be edited by anyone.
              </p>

              <div className="grid grid-cols-2 gap-4">
                 <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="text-2xl font-black text-slate-900 mb-1">{cv?.on_time_payment_pct || 0}%</div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reliability</div>
                 </div>
                 <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="text-2xl font-black text-slate-900 mb-1">{cv?.total_months_tracked || 0}</div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Months</div>
                 </div>
              </div>
            </div>

            <div className="mt-auto space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={copyToClipboard}
                  className="flex items-center justify-center gap-2 bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-slate-800 transition-all active:scale-95"
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? 'Copied' : 'Copy Link'}
                </button>
                <button 
                  onClick={shareOnWhatsApp}
                  className="flex items-center justify-center gap-2 bg-emerald-500 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-emerald-600 transition-all active:scale-95"
                >
                  <MessageCircle size={16} />
                  WhatsApp
                </button>
              </div>
              
              <button 
                onClick={downloadQRCode}
                className="w-full flex items-center justify-center gap-2 bg-white text-slate-900 border-2 border-slate-100 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95"
              >
                <Download size={16} />
                Download QR Code
              </button>

              <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                 <div className="flex items-center gap-2">
                    {isPublic ? <Eye size={16} className="text-indigo-600" /> : <EyeOff size={16} className="text-slate-400" />}
                    <span className={`text-[10px] font-black uppercase tracking-widest ${isPublic ? 'text-indigo-600' : 'text-slate-400'}`}>
                       {isPublic ? 'CV is Public' : 'CV is Private'}
                    </span>
                 </div>
                 <button 
                   onClick={togglePrivacy}
                   disabled={isUpdating}
                   className={`text-[10px] font-black uppercase tracking-widest underline decoration-2 underline-offset-4 ${isUpdating ? 'opacity-50' : 'hover:text-indigo-600 transition-colors'}`}
                 >
                   {isPublic ? 'Make Private' : 'Make Public'}
                 </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

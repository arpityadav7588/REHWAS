import React, { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Trash2, Check, RotateCcw } from 'lucide-react';

interface SignaturePadProps {
  label: string;
  onSave: (dataUrl: string) => void;
  existingSignature?: string;
  disabled?: boolean;
}

/**
 * SignaturePad Component
 * WHAT IT DOES: Provides a digital canvas for capturing handwritten signatures.
 * ANALOGY: Like initialing each page of a paper contract — it proves both parties 
 * reviewed and accepted the terms at a specific moment in time.
 */
export const SignaturePad: React.FC<SignaturePadProps> = ({ 
  label, 
  onSave, 
  existingSignature, 
  disabled = false 
}) => {
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [hasSignature, setHasSignature] = useState(!!existingSignature);
  const [isSaved, setIsSaved] = useState(!!existingSignature);

  const clear = () => {
    sigCanvas.current?.clear();
    setHasSignature(false);
    setIsSaved(false);
  };

  const save = () => {
    if (sigCanvas.current?.isEmpty()) return;
    const dataUrl = sigCanvas.current?.getTrimmedCanvas().toDataURL('image/png');
    if (dataUrl) {
      onSave(dataUrl);
      setIsSaved(true);
    }
  };

  if (existingSignature || isSaved) {
    return (
      <div className="space-y-4">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">{label}</label>
        <div className="bg-slate-50 border-2 border-slate-100 rounded-3xl p-6 flex flex-col items-center justify-center gap-4 group relative overflow-hidden">
          <img 
            src={existingSignature || sigCanvas.current?.getTrimmedCanvas().toDataURL('image/png')} 
            alt="Signature" 
            className="max-h-24 object-contain grayscale"
          />
          {!disabled && (
            <button 
              onClick={() => setIsSaved(false)}
              className="flex items-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-700 transition-colors"
            >
              <RotateCcw size={12} /> Re-sign
            </button>
          )}
          <div className="absolute top-2 right-2">
             <div className="bg-emerald-500 text-white p-1 rounded-full shadow-lg">
                <Check size={12} strokeWidth={4} />
             </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-end px-1">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
        <p className="text-[9px] font-bold text-slate-400 italic">Handwritten digital signature required</p>
      </div>
      
      <div className={`relative border-2 border-slate-100 rounded-3xl overflow-hidden bg-slate-50 transition-all ${disabled ? 'opacity-50 pointer-events-none' : 'hover:border-slate-200'}`}>
        <SignatureCanvas
          ref={sigCanvas}
          penColor="black"
          canvasProps={{
            className: "w-full h-40 cursor-crosshair",
          }}
          onEnd={() => setHasSignature(true)}
        />
        
        <div className="absolute bottom-4 right-4 flex gap-2">
          <button
            onClick={clear}
            className="p-3 bg-white text-slate-400 hover:text-red-500 rounded-2xl border border-slate-100 hover:border-red-100 transition-all shadow-sm"
            title="Clear signature"
          >
            <Trash2 size={16} />
          </button>
          <button
            onClick={save}
            disabled={!hasSignature}
            className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-xl transition-all ${hasSignature ? 'bg-emerald-600 text-white shadow-emerald-200 hover:bg-emerald-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
          >
            <Check size={16} strokeWidth={3} /> Save Signature
          </button>
        </div>
      </div>
    </div>
  );
};

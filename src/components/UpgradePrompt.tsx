import React from 'react';
import { Lock, Sparkles, ArrowRight, Zap, ShieldCheck } from 'lucide-react';

interface UpgradePromptProps {
  feature: string;
  requiredPlan: 'pro' | 'business';
  onUpgrade: () => void;
}

const FEATURE_META: Record<string, { name: string; benefit: string; icon: any }> = {
  'pl_dashboard': {
    name: "P&L Dashboard",
    benefit: "Understand your property income and expenses at a glance",
    icon: Zap
  },
  'rent_agreement': {
    name: "Rent Agreement Generator",
    benefit: "Create legally valid agreements with Aadhaar e-sign in minutes",
    icon: ShieldCheck
  },
  '3d_preview': {
    name: "AI 3D Room Preview",
    benefit: "Let tenants walk through your property virtually before visiting",
    icon: Sparkles
  },
  'team_seats': {
    name: "Team Members",
    benefit: "Add co-owners and property managers to help you run things",
    icon: Zap
  },
  'unlimited_rooms': {
    name: "Unlimited Rooms",
    benefit: "Scale your portfolio without limits or restrictions",
    icon: Zap
  },
  'receipt_generator': {
    name: "Rent Receipt Generator",
    benefit: "Automate tax-compliant receipts for your tenants",
    icon: Zap
  },
  'api_access': {
    name: "API Access",
    benefit: "Connect REHWAS data with your accounting or internal tools",
    icon: Zap
  },
  'white_label': {
    name: "White-label Portal",
    benefit: "Your branding, your logo, your professional identity",
    icon: Zap
  }
};

export const UpgradePrompt: React.FC<UpgradePromptProps> = ({ feature, requiredPlan, onUpgrade }) => {
  const meta = FEATURE_META[feature] || { 
    name: "Premium Feature", 
    benefit: "Unlock the full power of REHWAS management tools",
    icon: Lock
  };
  const Icon = meta.icon;

  return (
    <div className="relative w-full h-full min-h-[300px] overflow-hidden rounded-2xl border border-slate-100 bg-white group">
      {/* Blurred Preview Background */}
      <div className="absolute inset-0 opacity-10 blur-md grayscale transition-all group-hover:opacity-20">
        <div className="grid grid-cols-3 gap-4 p-8">
          <div className="h-4 bg-slate-200 rounded w-full"></div>
          <div className="h-4 bg-slate-200 rounded w-2/3"></div>
          <div className="h-4 bg-slate-200 rounded w-full"></div>
          <div className="h-32 bg-slate-200 rounded col-span-3"></div>
          <div className="h-4 bg-slate-200 rounded w-1/2"></div>
          <div className="h-4 bg-slate-200 rounded w-full"></div>
        </div>
      </div>

      {/* Content Overlay */}
      <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
        <div className="max-w-md bg-white p-8 md:p-10 rounded-[2rem] shadow-2xl shadow-emerald-500/10 border border-slate-50 transform transition-transform hover:scale-[1.02] duration-300">
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mx-auto mb-6">
            <Lock size={32} />
          </div>

          <h3 className="text-xl font-black text-slate-900 mb-2">
            {meta.name} is a <span className="capitalize text-emerald-600">{requiredPlan}</span> feature
          </h3>
          
          <p className="text-slate-500 font-medium mb-8 leading-relaxed">
            {meta.benefit}
          </p>

          <button 
            onClick={onUpgrade}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-lg shadow-emerald-600/20 active:scale-95 transition-all text-sm uppercase tracking-widest flex items-center justify-center gap-2"
          >
            Upgrade to <span className="capitalize">{requiredPlan}</span>
          </button>

          <button 
            onClick={onUpgrade}
            className="mt-6 text-slate-400 hover:text-slate-600 text-xs font-bold flex items-center justify-center gap-1 mx-auto transition-colors"
          >
            See all plan features <ArrowRight size={12} />
          </button>
        </div>
      </div>
    </div>
  );
};

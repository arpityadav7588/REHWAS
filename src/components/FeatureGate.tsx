import React from 'react';
import { Lock, Sparkles, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { FEATURE_GATES } from '../lib/featureGates';
import type { FeatureKey } from '../lib/featureGates';
import { useSubscription } from '../hooks/useSubscription';

interface FeatureGateProps {
  feature: FeatureKey;
  children?: React.ReactNode;
  fallback?: React.ReactNode;
  requiredPlan?: 'starter' | 'pro' | 'business'; // Optional override
}

/**
 * @component FeatureGate
 * @description
 * Analogy: Like a velvet rope at a club — you can see what's inside, 
 * but you need the right membership to enter. This component handles 
 * visibility gating and premium upsell UI.
 */
export const FeatureGate: React.FC<FeatureGateProps> = ({ 
  feature, 
  children, 
  fallback,
  requiredPlan 
}) => {
  const { hasPlan } = useSubscription();
  const navigate = useNavigate();
  const gate = FEATURE_GATES[feature];

  // Use override plan if provided, otherwise use default from gate map
  const targetPlan = requiredPlan || gate.plan;
  const isUnlocked = hasPlan(targetPlan);

  if (isUnlocked) {
    return <>{children}</>;
  }

  // If a custom fallback is provided (e.g. inline placeholder), show that
  if (fallback) {
    return <>{fallback}</>;
  }

  // Default "Velvet Rope" Upsell UI
  return (
    <div className={`bg-white rounded-[2.5rem] border border-slate-100 text-center relative overflow-hidden group ${children ? '' : 'p-10'}`}>
      {/* If children exist, we show them blurred in the background */}
      {children && (
        <div className="filter blur-md pointer-events-none opacity-40 select-none p-4">
          {children}
        </div>
      )}

      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-32 h-32 bg-emerald-50 rounded-full blur-3xl -ml-16 -mt-16 group-hover:bg-emerald-100 transition-colors duration-500" />
      <div className="absolute bottom-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -mr-16 -mb-16 group-hover:bg-indigo-100 transition-colors duration-500" />
      
      <div className={`${children ? 'absolute inset-0' : 'relative'} z-10 flex flex-col items-center justify-center p-8 bg-white/40 backdrop-blur-[2px]`}>
        <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-indigo-600 mb-6 shadow-xl group-hover:scale-110 transition-transform">
          <Lock size={32} />
        </div>
        
        <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">
          Unlock {gate.label}
        </h3>
        
        <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest mb-4">Requires {targetPlan.toUpperCase()} Plan</p>
        
        <p className="text-slate-500 font-medium max-w-sm mx-auto mb-8 leading-relaxed">
          This premium tool is reserved for our {targetPlan} members. 
          Upgrade now to streamline your management.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              navigate('/pricing');
            }}
            className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-slate-200 hover:bg-slate-800 active:scale-95 transition-all flex items-center gap-2"
          >
            Upgrade to {targetPlan.charAt(0).toUpperCase() + targetPlan.slice(1)} <ArrowRight size={18} />
          </button>
        </div>
        
        <div className="mt-6 flex items-center gap-2 text-indigo-600">
          <Sparkles size={16} />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Start 14-Day Free Trial</span>
        </div>
      </div>
    </div>
  );
};

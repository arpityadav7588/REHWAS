import { ReactNode } from 'react';
import { usePlan } from '@/hooks/usePlan';
import { Lock, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

interface FeatureGateProps {
  feature: string;
  requiredPlan: 'pro' | 'business';
  children: ReactNode;
}

/**
 * FeatureGate Component.
 * 
 * WHAT IT DOES: Wraps any UI element to restrict access based on the user's plan.
 * ANALOGY: Like a "VIP Only" rope in a club that shows you what's inside but prevents entry without the right badge.
 */
export const FeatureGate = ({ feature, requiredPlan, children }: FeatureGateProps) => {
  const { hasFeature } = usePlan();
  const hasAccess = hasFeature(feature);

  if (hasAccess) {
    return <>{children}</>;
  }

  const featureLabels: Record<string, string> = {
    pdf_receipts: 'Generate PDF receipts',
    urja_splitter: 'Utility bill splitting (Urja)',
    estate_dossier: 'Digital Estate Dossier',
    pl_dashboard: 'P&L Dashboard & Analytics',
    esign: 'Digital Rent Agreements',
  };

  return (
    <div className="relative group overflow-hidden">
      {/* Blurred Content */}
      <div className="filter blur-[2px] pointer-events-none opacity-40 select-none grayscale">
        {children}
      </div>

      {/* Locked Overlay */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-4 bg-white/20 backdrop-blur-[1px] border border-slate-100 rounded-xl transition-all group-hover:bg-white/40">
        <div className="bg-white p-3 rounded-2xl shadow-xl mb-3 transform transition-transform group-hover:scale-110">
          <Lock className="w-6 h-6 text-slate-400" />
        </div>
        
        <div className="flex items-center gap-1.5 bg-brand/10 text-brand text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest mb-2">
          <Zap className="w-3 h-3" />
          {requiredPlan} feature
        </div>

        <p className="text-[11px] font-bold text-slate-900 text-center leading-tight mb-3 max-w-[150px]">
          {featureLabels[feature] || 'Premium Feature'} with a REHWAS {requiredPlan.charAt(0).toUpperCase() + requiredPlan.slice(1)} subscription
        </p>

        <Link 
          to="/pricing" 
          className="px-4 py-2 bg-brand text-white text-[10px] font-black rounded-lg hover:bg-emerald-600 transition-colors shadow-lg shadow-brand/20 uppercase tracking-widest"
        >
          Upgrade Now →
        </Link>
      </div>
    </div>
  );
};

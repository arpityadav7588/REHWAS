import React, { useState } from 'react';
import { 
  X, 
  Check, 
  Zap, 
  Shield, 
  Users, 
  ChevronRight,
  MessageCircle,
  Clock
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetPlan?: 'pro' | 'business';
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose, targetPlan = 'pro' }) => {
  const { plan: currentPlan, trialDaysLeft, isOnTrial } = useAuth();
  const [isAnnual, setIsAnnual] = useState(true);

  if (!isOpen) return null;

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      price: '0',
      description: 'Your current plan',
      features: ['Up to 3 rooms', 'Basic Rent Ledger', 'WhatsApp Reminders', 'Listing on Map'],
      current: currentPlan === 'starter'
    },
    {
      id: 'pro',
      name: 'Pro',
      price: isAnnual ? '4,999' : '499',
      period: isAnnual ? '/year' : '/month',
      description: 'For serious landlords',
      features: ['Up to 15 rooms', 'P&L Dashboard', 'Rent Receipts', 'AI 3D Previews', 'Move-in Reports'],
      highlight: true,
      current: currentPlan === 'pro'
    },
    {
      id: 'business',
      name: 'Business',
      price: isAnnual ? '14,999' : '1,499',
      period: isAnnual ? '/year' : '/month',
      description: 'For property managers',
      features: ['Unlimited rooms', 'Rent Agreement Generator', 'E-sign via Aadhaar', 'Team Members', 'API Access'],
      current: currentPlan === 'business'
    }
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose} />
      
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
        >
          <X size={24} />
        </button>

        <div className="p-8 md:p-12">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full mb-4">
              <Zap size={14} fill="currentColor" />
              <span className="text-[10px] font-black uppercase tracking-widest">Upgrade REHWAS</span>
            </div>
            <h2 className="text-3xl font-black tracking-tight text-slate-900 mb-2">Choose the plan that fits your portfolio</h2>
            {isOnTrial && (
              <p className="text-emerald-600 text-sm font-bold flex items-center justify-center gap-1">
                <Clock size={14} /> You have {trialDaysLeft} days left in your Pro trial
              </p>
            )}
          </div>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-10">
            <span className={`text-sm font-bold ${!isAnnual ? 'text-slate-900' : 'text-slate-400'}`}>Monthly</span>
            <button 
              onClick={() => setIsAnnual(!isAnnual)}
              className="w-12 h-6 bg-slate-200 rounded-full relative p-1"
            >
              <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${isAnnual ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-bold ${isAnnual ? 'text-slate-900' : 'text-slate-400'}`}>Annual</span>
              <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">Save 20%</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {plans.filter(p => p.id !== 'starter' || p.current).map((plan) => (
              <div 
                key={plan.id}
                className={`relative p-8 rounded-3xl border-2 transition-all ${
                  plan.highlight && !plan.current
                  ? 'border-emerald-500 shadow-xl shadow-emerald-500/10' 
                  : plan.current
                  ? 'border-slate-100 bg-slate-50 opacity-80'
                  : 'border-slate-100'
                }`}
              >
                {plan.highlight && !plan.current && (
                  <div className="absolute -top-3 left-6 bg-emerald-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                    Recommended
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-xl font-black text-slate-900">{plan.name}</h3>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">{plan.description}</p>
                </div>

                <div className="mb-8">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black">₹</span>
                    <span className="text-5xl font-black tracking-tight">{plan.price}</span>
                    <span className="text-slate-400 font-bold text-sm">{plan.period || '/mo'}</span>
                  </div>
                </div>

                <button 
                  disabled={plan.current}
                  className={`w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all active:scale-95 mb-8 ${
                    plan.current
                    ? 'bg-slate-200 text-slate-400 cursor-default'
                    : plan.highlight
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700'
                    : 'border-2 border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  {plan.current ? 'Your Current Plan' : 'Upgrade Now'}
                </button>

                <div className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Check className={plan.current ? 'text-slate-300' : 'text-emerald-500'} size={14} strokeWidth={3} />
                      <span className={`text-xs font-bold ${plan.current ? 'text-slate-400' : 'text-slate-600'}`}>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-50 p-8 text-center border-t border-slate-100">
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 text-slate-400">
            <div className="flex items-center gap-2">
              <MessageCircle size={18} />
              <span className="text-xs font-bold">Questions? Chat with our experts</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield size={18} />
              <span className="text-xs font-bold">7-day money-back guarantee</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

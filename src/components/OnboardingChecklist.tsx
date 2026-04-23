import React, { useState, useEffect } from 'react';
import { 
  Check, 
  ChevronRight, 
  X, 
  Rocket, 
  PartyPopper,
  Home,
  Users,
  CreditCard,
  Bell,
  User
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';

/**
 * PSYCHOLOGY OF ONBOARDING CHECKLISTS:
 * 
 * 1. THE DOPAMINE LOOP: Each checkmark triggered by a user action provides a micro-reward 
 *    (dopamine hit), reinforcing the behavior and making the product feel "winnable."
 * 
 * 2. THE ZEIGARNIK EFFECT: Humans have a natural tendency to remember uncompleted tasks 
 *    more than completed ones. A visible checklist creates a healthy "tension" that pulls 
 *    the user back into the app until the loop is closed.
 * 
 * 3. ENDOWMENT PROGRESS EFFECT: By showing 0/5 or 1/5 complete, we capitalize on the fact 
 *    that people are more likely to complete a task if they feel they have already made progress.
 * 
 * 4. REDUCED COGNITIVE LOAD: Instead of exploring a complex dashboard, the user is given 
 *    a simple, linear path to "Activation" (the point where they realize the product's value).
 */

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  cta: string;
  to: string;
  icon: React.ElementType;
}

const STEPS: OnboardingStep[] = [
  {
    id: 'room',
    title: 'Add your first room',
    description: 'List a room on the map so tenants can find you',
    cta: 'Add Room →',
    to: '/add-room',
    icon: Home
  },
  {
    id: 'tenant',
    title: 'Add your first tenant',
    description: "Record who's living in your property",
    cta: 'Add Tenant →',
    to: '/dashboard?action=add-tenant',
    icon: Users
  },
  {
    id: 'rent',
    title: "Log this month's rent",
    description: 'Mark your first rent payment as received',
    cta: 'Open Ledger →',
    to: '/dashboard?tab=ledger',
    icon: CreditCard
  },
  {
    id: 'reminder',
    title: 'Send a WhatsApp reminder',
    description: 'Test the one-click reminder feature',
    cta: 'Go to Reminders →',
    to: '/dashboard?tab=reminders',
    icon: Bell
  },
  {
    id: 'profile',
    title: 'Complete your profile',
    description: 'Add your full name and a profile photo',
    cta: 'Edit Profile →',
    to: '/settings',
    icon: User
  }
];

export const OnboardingChecklist: React.FC = () => {
  const { profile, updateProfile } = useAuth();
  const [celebrating, setCelebrating] = useState(false);
  const navigate = useNavigate();

  // Query actual data to verify completion status
  const { data: status, isLoading } = useQuery({
    queryKey: ['onboarding-status', profile?.id],
    queryFn: async () => {
      if (!profile) return null;

      const [roomsRes, tenantsRes, rentRes] = await Promise.all([
        supabase.from('rooms').select('id', { count: 'exact', head: true }).eq('landlord_id', profile.id),
        supabase.from('tenants').select('id', { count: 'exact', head: true }).eq('landlord_id', profile.id),
        supabase.from('rent_ledger').select('id', { count: 'exact', head: true }).eq('landlord_id', profile.id).eq('status', 'paid')
      ]);

      return {
        room: (roomsRes.count || 0) > 0,
        tenant: (tenantsRes.count || 0) > 0,
        rent: (rentRes.count || 0) > 0,
        reminder: profile.onboarding_reminder_sent || false,
        profile: !!(profile.full_name && profile.avatar_url)
      };
    },
    enabled: !!profile,
    refetchInterval: 5000 // Refresh every 5s to catch updates
  });

  const completedCount = status ? Object.values(status).filter(Boolean).length : 0;
  const isAllComplete = completedCount === STEPS.length;
  const progress = (completedCount / STEPS.length) * 100;

  useEffect(() => {
    if (isAllComplete && !profile?.onboarding_dismissed && !celebrating) {
      setCelebrating(true);
      // Auto-dismiss after 3 seconds of celebration
      const timer = setTimeout(() => {
        handleDismiss();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isAllComplete]);

  const handleDismiss = async () => {
    await updateProfile({ onboarding_dismissed: true });
  };

  if (profile?.onboarding_dismissed || isLoading || !status) return null;

  if (celebrating) {
    return (
      <div className="bg-white border-l-4 border-emerald-500 rounded-2xl p-8 mb-8 shadow-xl shadow-emerald-500/10 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-500">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4 text-emerald-600">
          <PartyPopper size={32} />
        </div>
        <h3 className="text-xl font-black text-slate-900 mb-1">You're all set!</h3>
        <p className="text-slate-500 font-medium italic">REHWAS is ready to manage your properties.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border-l-4 border-emerald-500 rounded-2xl p-6 mb-8 shadow-sm border border-slate-100 animate-in slide-in-from-top duration-500">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
            <Rocket size={20} strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-lg font-black tracking-tight text-slate-900">Get started with REHWAS</h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{completedCount} of 5 steps complete</p>
          </div>
        </div>
        <button 
          onClick={handleDismiss}
          className="p-2 hover:bg-slate-50 rounded-full text-slate-400 transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-slate-100 rounded-full mb-8 overflow-hidden">
        <div 
          className="h-full bg-emerald-500 transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(16,185,129,0.5)]"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Step List */}
      <div className="space-y-1">
        {STEPS.map((step) => {
          const isComplete = status[step.id as keyof typeof status];
          const Icon = step.icon;

          return (
            <div 
              key={step.id}
              className={`group flex items-center gap-4 p-3 rounded-xl transition-all duration-200 ${
                isComplete ? 'opacity-60' : 'hover:bg-slate-50'
              }`}
            >
              {/* Checkbox */}
              <div 
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                  isComplete 
                  ? 'bg-emerald-500 border-emerald-500 text-white' 
                  : 'border-slate-200 bg-white group-hover:border-emerald-400'
                }`}
              >
                {isComplete && <Check size={14} strokeWidth={4} />}
              </div>

              {/* Title & Description */}
              <div className="flex-1">
                <h3 className={`text-sm font-bold transition-all ${
                  isComplete ? 'text-slate-400 line-through' : 'text-slate-900'
                }`}>
                  {step.title}
                </h3>
                {!isComplete && (
                  <p className="text-xs text-slate-500 font-medium mt-0.5 animate-in fade-in slide-in-from-left-2 duration-300">
                    {step.description}
                  </p>
                )}
              </div>

              {/* CTA */}
              {!isComplete && (
                <Link 
                  to={step.to}
                  className="text-xs font-black text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-1 transition-all"
                >
                  {step.cta}
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
